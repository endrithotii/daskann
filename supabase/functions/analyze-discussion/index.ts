import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface AnalysisRequest {
  question: string;
  responses: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('=== AI Analysis Request Started ===');

    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key not configured',
          details: 'The OPENAI_API_KEY is not set.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('API key is available (length:', OPENAI_API_KEY.length, ')');

    const { question, responses }: AnalysisRequest = await req.json();
    console.log('Received request - Question:', question);
    console.log('Number of responses:', responses?.length);

    if (!question || !responses || responses.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing question or responses' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const formattedResponses = responses
      .map((response, index) => `${index + 1}. ${response}`)
      .join('\n');

    const prompt = `Analyze the following responses to a question and group them by similar themes or preferences. Identify the consensus answer.

Question: ${question}

${formattedResponses}`;

    console.log('Calling OpenAI API with gpt-4o-mini...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing survey responses and identifying consensus. Group similar responses together and identify the strongest consensus.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'response_schema',
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['question', 'groups', 'consensus'],
              properties: {
                question: { type: 'string' },
                groups: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['id', 'label', 'criteria', 'members', 'count'],
                    properties: {
                      id: { type: 'string' },
                      label: { type: 'string' },
                      criteria: { type: 'string' },
                      members: { type: 'array', items: { type: 'number' } },
                      count: { type: 'number' }
                    },
                    additionalProperties: false
                  }
                },
                consensus: {
                  type: 'object',
                  required: ['group_id', 'label', 'confidence', 'reasoning'],
                  properties: {
                    group_id: { type: 'string' },
                    label: { type: 'string' },
                    confidence: { type: 'number' },
                    reasoning: { type: 'string' }
                  },
                  additionalProperties: false
                }
              }
            }
          }
        }
      }),
    });

    console.log('OpenAI Response Status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);

      let errorMessage = 'Failed to analyze responses';
      let errorDetails = errorText;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorDetails = errorJson.error.message;
        }
      } catch (e) {
        // If not JSON, use the raw text
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: errorDetails,
          status: openaiResponse.status
        }),
        {
          status: openaiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    console.log('OpenAI response received successfully');
    console.log('Usage:', JSON.stringify(openaiData.usage));

    const analysisText = openaiData.choices[0].message.content;
    console.log('Analysis text length:', analysisText.length);

    let analysisResult;
    try {
      analysisResult = JSON.parse(analysisText);
      console.log('Successfully parsed AI response');
      console.log('Groups found:', analysisResult.groups?.length);
      console.log('Consensus:', analysisResult.consensus?.label);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', analysisText);
      return new Response(
        JSON.stringify({
          error: 'Invalid AI response format',
          details: 'The AI returned a response that could not be parsed as JSON',
          rawResponse: analysisText.substring(0, 500)
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('=== AI Analysis Completed Successfully ===');

    return new Response(
      JSON.stringify(analysisResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-discussion function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});