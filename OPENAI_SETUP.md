# OpenAI API Setup - Ready to Test!

## ✅ Changes Made

The Edge Function has been updated to **exactly match your working curl request**:

### What Changed:
1. **Model**: Changed from `gpt-4` → `gpt-5` ✓
2. **Response Format**: Added `json_schema` with strict schema validation ✓
3. **Temperature**: Changed to `1` ✓
4. **API Key**: Updated in `.env` file ✓

## 🚀 Final Step: Set API Key in Supabase

The API key is now in your local `.env` file, but Supabase Edge Functions need it set as a secret.

### Method 1: Supabase Dashboard (Easiest)

1. **Go to**: https://supabase.com/dashboard
2. **Select your project**: `mpsyescbddctmacpeqpe`
3. **Navigate to**: Edge Functions → Settings → Secrets (or Environment Variables)
4. **Add new secret**:
   - Name: `OPENAI_API_KEY`
   
5. **Click "Save"**
6. **Wait 30 seconds** for the secret to propagate

### Method 2: Supabase CLI

```bash
supabase login
supabase link --project-ref mpsyescbddctmacpeqpe
```

## 🧪 Testing

After setting the secret, test immediately:

1. **Open your app**
2. **Go to a closed discussion** with responses (e.g., "Dinner" or "Retreat")
3. **Click "View Results"**
4. **Click "Generate AI Analysis"**
5. **Open Console (F12)** to see detailed logs

### Expected Console Output:

```
=== AI Analysis Request Started ===
API key is available (length: 164)
Received request - Question: Where do you want to go to the retreat?
Number of responses: 3
Calling OpenAI API with gpt-5...
OpenAI Response Status: 200
OpenAI response received successfully
Usage: {"prompt_tokens":211,"completion_tokens":1491,...}
Successfully parsed AI response
Groups found: 3
Consensus: Beach or coastal city retreat
=== AI Analysis Completed Successfully ===
```

### What You'll See in the App:

✅ Beautiful pie chart with response distribution
✅ Consensus highlighted in green with trophy icon
✅ Confidence score (e.g., "62%")
✅ Detailed reasoning
✅ All groups with percentages and member counts

## 🎯 Key Differences from Before

### Old Configuration (Not Working):
- Model: `gpt-4`
- Response format: Plain text in prompt
- Temperature: `0.7`
- Had to parse text manually

### New Configuration (Your Working curl):
- Model: `gpt-5` ✓
- Response format: Structured `json_schema` ✓
- Temperature: `1` ✓
- Guaranteed valid JSON response ✓

## 📊 Response Format

The Edge Function now uses `json_schema` which guarantees:
- Valid JSON structure
- All required fields present
- Correct data types
- No parsing errors

This matches exactly what worked in your curl request!

## ⚠️ Troubleshooting

### If you see: "OpenAI API key not configured"
→ The secret is not set in Supabase. Follow Method 1 or 2 above.

### If you see: "Incorrect API key"
→ Double-check the API key was copied correctly (no spaces or line breaks)

### If you see: "You exceeded your current quota"
→ Add credits to your OpenAI account at https://platform.openai.com/account/billing

### If it works in curl but not in the app:
→ The API key is likely not set as a Supabase secret (only in local `.env`)

## 🔐 Security

The API key is:
- ✅ Stored locally in `.env` (not in git)
- ✅ Needs to be added as Supabase secret for Edge Functions
- ✅ Only accessible server-side (Edge Function)
- ✅ Never exposed to client/browser

## ✨ What Happens After Setup

Once the API key is set in Supabase:

1. **Automatic Analysis**: New discussions will automatically get AI analysis when closed
2. **Manual Trigger**: You can analyze existing closed discussions with the button
3. **Rich Results**: Full visualization with pie charts and consensus
4. **Smart Notifications**: Participants get notified with the consensus result

## 📝 Next Steps

1. ✅ Set the API key in Supabase (see Method 1 above)
2. ✅ Wait 30 seconds
3. ✅ Test with "Generate AI Analysis" button
4. ✅ Check console for success messages
5. ✅ Enjoy the beautiful results visualization!

**The code is ready - just needs the secret configured!** 🚀
