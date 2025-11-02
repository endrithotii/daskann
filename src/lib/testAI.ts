import { supabase } from './supabase';

export async function analyzeClosedDiscussion(discussionId: string) {
  try {
    console.log('Fetching discussion and responses...');

    const { data: discussion, error: discussionError } = await supabase
      .from('discussions')
      .select('*')
      .eq('id', discussionId)
      .single();

    if (discussionError || !discussion) {
      console.error('Discussion not found:', discussionError);
      return { success: false, error: 'Discussion not found' };
    }

    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('text')
      .eq('discussion_id', discussionId);

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return { success: false, error: 'Failed to fetch responses' };
    }

    if (!responses || responses.length === 0) {
      console.log('No responses found');
      return { success: false, error: 'No responses to analyze' };
    }

    console.log(`Found ${responses.length} responses`);
    console.log('Calling AI analysis...');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const analysisResponse = await fetch(
      `${supabaseUrl}/functions/v1/analyze-discussion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          question: discussion.prompt,
          responses: responses.map((r) => r.text),
        }),
      }
    );

    console.log('Response status:', analysisResponse.status);
    const responseText = await analysisResponse.text();
    console.log('Response body:', responseText);

    if (!analysisResponse.ok) {
      console.error('Failed to analyze:', responseText);
      return { success: false, error: responseText };
    }

    const aiAnalysis = JSON.parse(responseText);
    console.log('AI Analysis received:', aiAnalysis);

    const { error: updateError } = await supabase
      .from('discussions')
      .update({ ai_analysis: aiAnalysis })
      .eq('id', discussionId);

    if (updateError) {
      console.error('Failed to update discussion:', updateError);
      return { success: false, error: 'Failed to save analysis' };
    }

    console.log('Analysis saved successfully!');
    return { success: true, analysis: aiAnalysis };
  } catch (error) {
    console.error('Error in analyzeClosedDiscussion:', error);
    return { success: false, error: String(error) };
  }
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testAI = analyzeClosedDiscussion;
}
