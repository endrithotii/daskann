import { supabase } from './supabase';

export async function checkAndCloseDiscussion(discussionId: string): Promise<boolean> {
  try {
    const { data: discussion, error: discussionError } = await supabase
      .from('discussions')
      .select('*, discussion_participants(responded)')
      .eq('id', discussionId)
      .single();

    if (discussionError || !discussion || discussion.status === 'closed') {
      return false;
    }

    let shouldClose = false;
    let closedBy: 'deadline' | 'all_responses' | null = null;

    if (discussion.deadline_at && new Date(discussion.deadline_at) < new Date()) {
      shouldClose = true;
      closedBy = 'deadline';
    }

    const participants = discussion.discussion_participants || [];
    const allResponded = participants.length > 0 && participants.every((p: any) => p.responded);

    if (allResponded && !shouldClose) {
      shouldClose = true;
      closedBy = 'all_responses';
    }

    if (shouldClose && closedBy) {
      const { data: responses } = await supabase
        .from('responses')
        .select('text')
        .eq('discussion_id', discussionId);

      const totalResponses = responses?.length || 0;
      const resultsSummary = `Discussion closed ${closedBy === 'deadline' ? 'due to deadline expiration' : 'after all participants responded'}. Total responses: ${totalResponses}`;

      let aiAnalysis = null;

      if (responses && responses.length > 0) {
        try {
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

          if (analysisResponse.ok) {
            aiAnalysis = await analysisResponse.json();
          } else {
            console.error('Failed to analyze discussion:', await analysisResponse.text());
          }
        } catch (error) {
          console.error('Error calling AI analysis:', error);
        }
      }

      await supabase
        .from('discussions')
        .update({
          status: 'closed',
          closed_by: closedBy,
          results_summary: resultsSummary,
          ai_analysis: aiAnalysis,
        })
        .eq('id', discussionId);

      const { data: participantsList } = await supabase
        .from('discussion_participants')
        .select('user_id')
        .eq('discussion_id', discussionId);

      if (participantsList) {
        const consensusText = aiAnalysis?.consensus
          ? `Consensus reached: ${aiAnalysis.consensus.label}`
          : resultsSummary;

        const notifications = participantsList.map((p) => ({
          user_id: p.user_id,
          discussion_id: discussionId,
          message: `Discussion "${discussion.title}" has been closed. ${consensusText}`,
          read: false,
        }));

        await supabase.from('notifications').insert(notifications);
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking/closing discussion:', error);
    return false;
  }
}

export function calculateTimeRemaining(deadline: string | null): string {
  if (!deadline) return 'No deadline';

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();

  if (diff < 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''} left`;
  }
  return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''} left`;
}

export function isDiscussionActive(startDate: string): boolean {
  return new Date(startDate) <= new Date();
}

export function canEditDiscussion(ownerId: string, currentUserId: string, hasResponses: boolean): boolean {
  return ownerId === currentUserId && !hasResponses;
}
