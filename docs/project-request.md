# Project Brief: DocChat — AI Document Q&A SaaS

## Overview

Build a web app where users upload documents (PDF, DOCX, TXT), and an AI answers questions about them with source citations. Think ChatPDF but simpler and cleaner.

## Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | Next.js 15 + TypeScript + Tailwind + shadcn/ui |
| Auth + DB | Supabase (PostgreSQL + Auth + Storage) |
| Vector DB | pgvector (Supabase extension) |
| LLM | OpenAI GPT-4o-mini |
| RAG | LangChain or LlamaIndex (justify your choice) |
| Payments | Stripe Checkout + Customer Portal + Webhooks |
| Deploy | Vercel |
| Email | Resend (welcome email + subscription confirmation) |

## UI Requirements

**Layout:** sidebar + main area (like ChatGPT or Linear)

```
┌──────────┬──────────────────────────────┐
│          │                              │
│  Docs    │     Chat Area                │
│  List    │                              │
│          │  [AI response with citations] │
│  + Upload│                              │
│          │  ────────────────────         │
│          │  [Type your question...]      │
└──────────┴──────────────────────────────┘
```

- Dark mode by default (Stripe/Linear style)
- Responsive — works on mobile (sidebar collapses)
- Streaming responses — text appears word by word

## Features (MVP)

### Must Have

- [ ] User auth (Google OAuth + email/password via Supabase)
- [ ] Upload documents (PDF, DOCX, TXT) — max 20MB, store in Supabase Storage
- [ ] Document processing pipeline: upload → extract text → chunk → embed → store in pgvector
- [ ] Chat interface with streaming responses
- [ ] Source citations: each answer shows which page/section it came from
- [ ] Chat history: saved per document, user can revisit old conversations
- [ ] Suggested questions: auto-generate 3 questions after upload
- [ ] Document sidebar: list all uploaded docs, click to switch
- [ ] Stripe integration: Free tier (3 docs, 20 questions/day) vs Pro tier ($9/month, unlimited)
- [ ] Landing page with pricing section
- [ ] Deploy to Vercel

### Nice to Have (only if time allows)

- [ ] Thumbs up/down feedback on answers
- [ ] PDF viewer with highlighted citations (split view)
- [ ] Multi-document knowledge base (ask across multiple docs)
- [ ] Export chat as Markdown

## Milestones

| Week | Deliverable | Acceptance Criteria |
|------|-------------|-------------------|
| W1 | RAG pipeline + basic chat | Upload a PDF → ask a question → get correct answer with page reference. Can run locally. |
| W2 | Auth + UI + document management | Login works. Can upload/delete/switch between docs. Chat UI has streaming. Dark mode. |
| W3 | Stripe + landing page + deploy | Free/Pro tiers work. Payment flow complete. Live on Vercel. |
| W4 | Polish + testing + article | Suggested questions work. Error handling. Loading states. At least 5 unit tests on RAG pipeline. README complete. Dev.to article published. |

## Quality Requirements

- TypeScript strict mode — no `any`
- All API routes handle errors gracefully (no blank screens)
- Loading states for all async operations
- Mobile responsive
- Lighthouse performance score > 80
- At least 5 meaningful tests (RAG pipeline accuracy, API routes)
- Conventional Commits
- Clean README with: screenshot, quick start (3 steps), tech stack, architecture diagram

## Evaluation Criteria

1. **Does the RAG actually work?** — Answers should be accurate and cite the right source
2. **Is the UI polished?** — Should feel like a real product, not a hackathon demo
3. **Code quality** — Clean structure, no god files, proper error handling
4. **Can I deploy it from the README?** — `git clone` → `npm install` → `npm run dev` should work

## Environment Variables

```
OPENAI_API_KEY=sk-xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
RESEND_API_KEY=re_xxx
```

Keys with `NEXT_PUBLIC_` prefix are exposed to browser. OpenAI key must stay server-side only.

**Local:** `.env.local` (gitignored)
**Production:** Vercel Dashboard → Settings → Environment Variables

## Git Workflow

```
1. Open Issue: "feat: implement document upload pipeline"
2. Create branch: feat/document-upload
3. Work, commit (3-5 commits per feature)
4. Open PR, link to issue
5. PR description: what, why, how to test, screenshot
6. Self-review: leave comments on own code
7. Merge → Issue auto-closes
```

## References

- [ChatPDF](https://chatpdf.com) — UI simplicity benchmark
- [DocsGPT](https://github.com/arc53/DocsGPT) — open source architecture reference
- [next-supabase-stripe-starter](https://github.com/KolbySisk/next-supabase-stripe-starter) — SaaS boilerplate reference
