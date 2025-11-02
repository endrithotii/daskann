interface ModerationResponse {
  original_text: string;
  status: 'permitted' | 'not_permitted';
  reason: string;
  user_message: string;
}

interface ModerationResult {
  isPermitted: boolean;
  reason: string;
  userMessage: string;
}

export async function moderateContent(
  question: string,
  answer: string
): Promise<ModerationResult> {
  try {
    const openAiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!openAiKey) {
      console.error('OpenAI API key not configured');
      return {
        isPermitted: true,
        reason: 'Moderation unavailable',
        userMessage: ''
      };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'ethical_response_schema',
            schema: {
              type: 'object',
              required: ['original_text', 'status', 'reason', 'user_message'],
              properties: {
                original_text: { type: 'string' },
                status: { type: 'string', enum: ['permitted', 'not_permitted'] },
                reason: { type: 'string' },
                user_message: { type: 'string' }
              }
            }
          }
        },
        messages: [
          {
            role: 'system',
            content: 'You are an Ethical Moderation and Response Filter Agent. Detect if the message contains offensive or discriminatory language and respond strictly in JSON using the schema.'
          },
          {
            role: 'user',
            content: `Question: ${question}\nAnswer: ${answer}`
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return {
        isPermitted: true,
        reason: 'Moderation service error',
        userMessage: ''
      };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return {
        isPermitted: true,
        reason: 'No moderation response',
        userMessage: ''
      };
    }

    const moderation: ModerationResponse = JSON.parse(content);

    return {
      isPermitted: moderation.status === 'permitted',
      reason: moderation.reason,
      userMessage: moderation.user_message
    };

  } catch (error) {
    console.error('Error moderating content:', error);
    return {
      isPermitted: true,
      reason: 'Moderation error',
      userMessage: ''
    };
  }
}
