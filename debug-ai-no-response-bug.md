# Debug Session: ai-no-response-bug

- **Status**: [OPEN]
- **Symptoms**: AI does not respond in the chat drawer, even after setting `OPENAI_API_KEY` in `.env`.
- **Created at**: 2026-05-25

## 📋 Hypotheses

1. **H1 (Env Loading)**: The backend is not loading the `.env` file correctly, leaving `process.env.OPENAI_API_KEY` empty.
2. **H2 (Auth Failure)**: The `auth` middleware is returning a 401/403 before the AI logic is even reached.
3. **H3 (OpenAI SDK Error)**: The OpenAI SDK is throwing an error (invalid key, quota, etc.) that isn't being caught or logged clearly.
4. **H4 (CORS/URL Mismatch)**: The frontend is attempting to call a different URL than where the backend is running (e.g., Production vs Localhost).
5. **H5 (Streaming Blocked)**: Fastify or the network is buffering/blocking the RSC/AI stream response.
6. **H6 (Invalid Hook Usage)**: `useChat` is being used with `sendMessage` which does not exist in the installed version, and `transport` might be misconfigured. [NEW]

## 🛠️ Instrumentation Plan

1. **Backend Route (`ai.ts`)**:
    - Log when a request is received.
    - Log the session status (auth).
    - Log if `OPENAI_API_KEY` is present (masking most of it).
    - Log any errors caught during `streamText`.
2. **Frontend Chat (`chat.tsx`)**:
    - Log the `api` URL being used.
    - Log when `sendMessage` is called.
    - Log any errors caught by `useChat`.

## 📈 Evidence Collection

| Timestamp | Source | Event | Data | Hypothesis |
|-----------|--------|-------|------|------------|
| | | | | |

## 🧪 Fix Verification

- [ ] H1: Checked env loading.
- [ ] H2: Checked auth status.
- [ ] H3: Checked OpenAI SDK response.
- [ ] H4: Checked request URL/CORS.
- [ ] H5: Checked streaming response.

## 🧹 Cleanup Checklist

- [ ] Remove instrumentation from `ai.ts`
- [ ] Remove instrumentation from `chat.tsx`
- [ ] Delete `debug-ai-no-response-bug.md`
- [ ] Stop Debug Server
