# AI Analysis Troubleshooting Guide

## How to Test AI Analysis

### Method 1: Use the "Generate AI Analysis" Button

1. **Navigate to a closed discussion** that has responses
2. **Click "View Results"** from the dashboard
3. If you see "AI analysis is not available", **click the "Generate AI Analysis" button**
4. The button will show "Analyzing..." while processing
5. Check the browser console for detailed logs:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for messages starting with "Calling AI analysis" and "AI Analysis Response"

### Method 2: Use Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run this command (replace the ID with your discussion ID):
```javascript
window.testAI('YOUR_DISCUSSION_ID_HERE')
```

Example:
```javascript
window.testAI('c6713c6f-5ac5-4f92-91e1-462994350798')
```

## Common Issues & Solutions

### Issue 1: "AI analysis is not available"

**Possible Causes:**
1. The discussion was closed before AI integration was added
2. The OpenAI API call failed silently
3. The OPENAI_API_KEY is not set in Supabase

**Solution:**
- Click the "Generate AI Analysis" button on the Results page
- Check the console for error messages
- Verify the API key is set (see below)

### Issue 2: API Error Responses

**Check the console for these errors:**

#### "Missing question or responses"
- The discussion has no responses to analyze
- Solution: Add at least 2 responses before closing the discussion

#### "Failed to analyze responses"
- OpenAI API returned an error
- Possible causes:
  - Invalid API key
  - API key not set in Supabase environment
  - Rate limiting
  - OpenAI service issue

#### "Invalid AI response format"
- OpenAI returned a response but not in expected JSON format
- Check console for the actual response text

### Issue 3: OPENAI_API_KEY Not Set in Supabase

The API key needs to be set as a Supabase secret (not just in local .env).

**To verify:**
1. The Edge Function logs will show "undefined" for OPENAI_API_KEY if not set
2. You'll see 401 Unauthorized errors from OpenAI

**According to Supabase documentation:**
Environment variables should be automatically configured when deploying Edge Functions.

## Checking Edge Function Logs

To see what's happening in the Edge Function:

1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Click on "analyze-discussion"
4. View the Logs tab
5. Look for:
   - "OpenAI API error" messages
   - Request/response details
   - Any console.error outputs

## Testing the Flow End-to-End

### Step 1: Create a Test Discussion

1. Create a new discussion with an interesting question
2. Assign at least 2 participants
3. Have each participant submit different responses

Example:
- Question: "Where should we go for the company retreat?"
- Response 1: "I prefer the mountains for hiking"
- Response 2: "Beach resort for relaxation"
- Response 3: "City tour with cultural activities"

### Step 2: Close the Discussion

The discussion will auto-close when:
- All participants respond, OR
- The deadline expires

### Step 3: Check Results

1. Go to Dashboard → Past tab
2. Click on the closed discussion
3. Click "View Results"
4. Look for either:
   - Full AI analysis with pie chart, OR
   - "Generate AI Analysis" button

### Step 4: Trigger Analysis Manually

If analysis didn't run automatically:
1. Click "Generate AI Analysis" button
2. Watch the console for logs
3. Wait for analysis to complete (usually 5-10 seconds)

## Expected AI Response Format

The OpenAI API should return JSON in this format:

```json
{
  "question": "Where should we go for the company retreat?",
  "groups": [
    {
      "id": "1",
      "label": "Mountain Retreat",
      "criteria": "Prefers nature-based activities in mountains",
      "members": [1],
      "count": 1
    },
    {
      "id": "2",
      "label": "Beach Resort",
      "criteria": "Wants relaxation at a beach destination",
      "members": [2],
      "count": 1
    },
    {
      "id": "3",
      "label": "City Tour",
      "criteria": "Interested in cultural and urban experiences",
      "members": [3],
      "count": 1
    }
  ],
  "consensus": {
    "group_id": "2",
    "label": "Beach Resort",
    "confidence": 0.6,
    "reasoning": "While preferences are diverse, beach resorts offer the best balance of relaxation and activities for the majority."
  }
}
```

## Console Commands for Debugging

### Get Discussion Info
```javascript
// Replace ID with your discussion ID
const id = 'YOUR_DISCUSSION_ID';
const { data } = await supabase.from('discussions').select('*').eq('id', id).single();
console.log('Discussion:', data);
```

### Get Responses
```javascript
const id = 'YOUR_DISCUSSION_ID';
const { data } = await supabase.from('responses').select('*').eq('discussion_id', id);
console.log('Responses:', data);
```

### Test Edge Function Directly
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const response = await fetch(
  `${supabaseUrl}/functions/v1/analyze-discussion`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      question: "Test question?",
      responses: ["Response 1", "Response 2", "Response 3"],
    }),
  }
);

console.log('Status:', response.status);
console.log('Response:', await response.text());
```

## Verification Checklist

- [ ] Discussion has at least 2 responses
- [ ] Discussion status is 'closed'
- [ ] OpenAI API key is set in Supabase
- [ ] Edge Function is deployed and active
- [ ] Browser console shows no CORS errors
- [ ] "Generate AI Analysis" button appears on Results page
- [ ] Button click shows "Analyzing..." state
- [ ] Console logs show API call and response
- [ ] Database updated with ai_analysis data

## Next Steps if Still Not Working

1. **Check Browser Console** for error messages
2. **Check Supabase Logs** for Edge Function errors
3. **Verify API Key** is valid and has credits
4. **Try with Different Responses** to rule out content issues
5. **Check OpenAI Status** at status.openai.com

## Support

If you continue to have issues:
1. Copy the console error messages
2. Check the Edge Function logs in Supabase Dashboard
3. Verify the discussion has responses in the database
4. Share the error details for further assistance
