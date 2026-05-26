# Debug Session: ai-no-response-bug

## 📋 Status
- [x] Session ID: `ai-no-response-bug`
- [ ] Status: [OPEN]
- [ ] Created: 2026-05-25

## 🎯 Symptoms
- User asks AI to adjust workout.
- Logs show "submitted" then "ready" but no text response.
- Browser error: `Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received`.

## 🔍 Hypotheses
- **H1: Empty Stream**: The model calls tools but generates no text. (Verified: Gemini returns 404/Empty stream)
- **H2: Tool Execution Loop**: Model stuck in infinite tool loop.
- **H3: Backend Error during Stream**: Error occurs after headers are sent, closing the stream abruptly. (Verified: headersSent logic was preventing fallback)
- **H4: Frontend Parsing Issue**: Frontend fails to process the new stream format.
- **H5: Environment Variable Mismatch**: Groq key using XAI_API_KEY name. (Verified: .env has XAI_API_KEY but code expected GROQ_API_KEY)

## 🧪 Evidence Collection Plan
1. [x] Start Debug Server.
2. [x] Instrument backend `ai.ts` to log tool execution and stream status.
3. [x] Reproduce the issue and collect logs.
4. [x] Fix streaming fallback logic.
5. [x] Fix environment variable mismatch for Groq.
6. [x] Update Google model name.


## 📓 Log Analysis
- **Observation 1**: Google Gemini returned 404 error with `gemini-1.5-flash`.
- **Observation 2**: Manual streaming (`reply.raw`) bypassed Fastify CORS plugin, causing browser to block responses.
- **Observation 3**: Initial implementation of manual stream didn't handle non-200 responses before sending headers, preventing effective fallback.

## 🛠️ Fix & Verification
1. [x] Update Google model name to `gemini-1.5-flash-latest`.
2. [x] Add manual CORS headers in `reply.raw.writeHead`.
3. [x] Add check for `response.status !== 200` to trigger provider fallback before committing to the response.

