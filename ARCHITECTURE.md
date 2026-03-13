# CodeSensei — System Architecture Document

> **BMAD Framework** | Version 1.0 | Status: Draft
> Prepared by: AI Architecture Team

---

## BMAD: Approach

### System Overview

CodeSensei is built on a **three-tier architecture**: a React frontend, a Node.js API backend, and a set of external managed services (Supabase, Groq, Voyage AI, FAISS, Resend). The intelligence layer is powered by a **RAG (Retrieval-Augmented Generation) pipeline** that grounds every AI review in authoritative coding standards before calling the LLM.

The core review flow is:
1. User submits code via the React frontend
2. Backend preprocesses code and retrieves relevant coding standards from the FAISS vector store
3. A context-enriched prompt is sent to the Groq LLM (llama-3.3-70b-versatile)
4. Structured review results are stored in Supabase and returned to the frontend
5. Email notification is dispatched via Resend

---

## 1. Tech Stack with Justification

### Frontend

| Technology | Role | Justification |
|---|---|---|
| **React** | UI framework | Component-based architecture ideal for the review results UI (tabs, scoring, diff view). Large ecosystem for charts (Recharts), syntax highlighting (Prism/Shiki), and state management. |
| **React Router** | Client-side routing | SPA navigation between Dashboard, Review, History pages |
| **Recharts** | Data visualization | Progress dashboard charts — lightweight, composable, built for React |
| **Tailwind CSS** | Styling | Utility-first CSS for rapid UI development without a heavy component library dependency |
| **Vercel** | Deployment | Zero-config deployment for React apps, automatic preview deploys per branch, edge CDN |

### Backend

| Technology | Role | Justification |
|---|---|---|
| **Node.js + Express** | REST API server | JavaScript across the full stack reduces context-switching. Express is minimal and flexible for an API-first backend. |
| **Supabase JS Client** | DB + Auth SDK | Type-safe access to PostgreSQL with built-in RLS (Row Level Security) for user data isolation |
| **Groq SDK** | LLM inference | Groq's hardware (LPUs) delivers inference speeds 10–20x faster than standard GPU APIs. llama-3.3-70b-versatile provides excellent code reasoning at low latency. |
| **Voyage AI SDK** | Text embeddings | voyage-3-large is purpose-built for high-accuracy semantic search, outperforming OpenAI embeddings on code-related retrieval benchmarks. |
| **FAISS** | Vector store | Facebook AI Similarity Search is an in-process, zero-cost, extremely fast vector database. Perfect for a bounded knowledge base (coding standards documents) that doesn't require horizontal scaling at MVP. |
| **Resend SDK** | Transactional email | Developer-first email API with React Email template support. Generous free tier, high deliverability. |

### Data & Infrastructure

| Technology | Role | Justification |
|---|---|---|
| **Supabase (PostgreSQL)** | Primary database + auth | Managed Postgres with built-in Auth (JWT), Row Level Security, real-time subscriptions, and a generous free tier. Eliminates the need to manage auth infrastructure separately. |
| **FAISS Index (local file)** | Vector store for RAG | The coding standards corpus is small and static (Airbnb JS, PEP8, OWASP). A local FAISS index loaded into memory at server startup is the most efficient and cost-free option for MVP. |
| **GitHub** | Version control | Industry standard. Also enables GitHub raw URL fetching for code submission. |
| **Vercel** | Frontend hosting | Automatic CI/CD from GitHub, global CDN, serverless function support if needed in future. |

---

## 2. System Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════════════╗
║                          USER (Browser)                                  ║
║                     React SPA on Vercel CDN                              ║
║  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  ┌────────────┐  ║
║  │  Submit Code │  │ Review Result │  │   History    │  │ Dashboard  │  ║
║  │    Page      │  │    Page       │  │    Page      │  │   Page     │  ║
║  └──────┬───────┘  └───────────────┘  └──────────────┘  └────────────┘  ║
╚═════════╪════════════════════════════════════════════════════════════════╝
          │  HTTPS REST API calls
          ▼
╔══════════════════════════════════════════════════════════════════════════╗
║                       NODE.JS EXPRESS API                                ║
║                   (Deployed on Railway / Render)                         ║
║                                                                          ║
║  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  ┌────────────┐  ║
║  │  Auth       │  │  Review      │  │  RAG Service   │  │  Email     │  ║
║  │  Middleware │  │  Controller  │  │  (retriever)   │  │  Service   │  ║
║  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  └─────┬──────┘  ║
╚═════════╪════════════════╪══════════════════╪════════════════╪══════════╝
          │                │                  │                │
          ▼                ▼                  ▼                ▼
  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │   SUPABASE    │  │   GROQ API   │  │  FAISS INDEX │  │   RESEND     │
  │  (Postgres    │  │  llama-3.3-  │  │  (coding     │  │  (email      │
  │   + Auth)     │  │  70b-        │  │   standards  │  │   delivery)  │
  │               │  │  versatile)  │  │   vectors)   │  │              │
  │  ┌──────────┐ │  │              │  │  ┌─────────┐ │  └──────────────┘
  │  │ users    │ │  │  < 10s       │  │  │Airbnb JS│ │
  │  │ reviews  │ │  │  response    │  │  │PEP8     │ │
  │  │ findings │ │  │              │  │  │OWASP    │ │
  │  └──────────┘ │  └──────┬───────┘  │  └─────────┘ │
  └───────────────┘         │          └──────┬────────┘
                            │                 │
                            └────────┬────────┘
                                     │
                              ┌──────▼──────┐
                              │  VOYAGE AI  │
                              │ (embedding  │
                              │  queries    │
                              │  at ingest  │
                              │  + retrieval│
                              └─────────────┘
```

### Data Flow Summary

```
[User submits code]
        │
        ▼
[Backend validates + extracts language]
        │
        ├──► [Voyage AI embeds the code query]
        │              │
        │              ▼
        │    [FAISS retrieves top-K relevant
        │     coding standard chunks]
        │              │
        ▼              ▼
[Prompt assembled: code + standards context + review instructions]
        │
        ▼
[Groq LLM generates structured JSON review]
        │
        ├──► [Review stored in Supabase]
        ├──► [Email sent via Resend]
        └──► [JSON returned to React frontend]
```

---

## 3. Database Schema

### Tables

#### `users`
> Managed primarily by Supabase Auth. Extended with a public profile table.

```sql
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  weekly_digest_enabled        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### `reviews`
> One row per code review submission.

```sql
CREATE TABLE public.reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language          TEXT NOT NULL CHECK (language IN ('javascript', 'typescript', 'python')),
  code_input        TEXT NOT NULL,          -- raw submitted code
  source_url        TEXT,                   -- GitHub raw URL if used
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Dimension Scores (1–10)
  score_bugs             NUMERIC(4,2),
  score_security         NUMERIC(4,2),
  score_performance      NUMERIC(4,2),
  score_readability      NUMERIC(4,2),
  score_best_practices   NUMERIC(4,2),
  score_composite        NUMERIC(4,2),      -- computed average

  -- AI Outputs
  fixed_code        TEXT,                   -- Fix Mode output
  explanation       TEXT,                   -- plain-English explanation
  fix_mode_used     BOOLEAN DEFAULT FALSE,

  -- RAG metadata
  rag_chunks_used   JSONB,                  -- which standard chunks were retrieved

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

-- Index for user history queries
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
```

---

#### `findings`
> Individual findings per review, per dimension.

```sql
CREATE TABLE public.findings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id       UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  dimension       TEXT NOT NULL
                  CHECK (dimension IN ('bugs', 'security', 'performance', 'readability', 'best_practices')),
  severity        TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  line_start      INTEGER,                  -- starting line number
  line_end        INTEGER,                  -- ending line number (nullable for single-line)
  title           TEXT NOT NULL,            -- short finding title
  description     TEXT NOT NULL,            -- detailed explanation
  suggestion      TEXT NOT NULL,            -- how to fix it
  standard_ref    TEXT,                     -- e.g. "OWASP A03:2021", "PEP8 E501"
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching all findings for a review
CREATE INDEX idx_findings_review_id ON public.findings(review_id);
CREATE INDEX idx_findings_dimension ON public.findings(dimension);
```

---

#### `rag_documents`
> Metadata table for ingested coding standard documents.

```sql
CREATE TABLE public.rag_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name     TEXT NOT NULL,            -- e.g. "Airbnb JavaScript Style Guide"
  source_url      TEXT,
  language        TEXT,                     -- javascript | python | general
  total_chunks    INTEGER,
  ingested_at     TIMESTAMPTZ DEFAULT NOW(),
  faiss_index_id  TEXT                      -- reference to the FAISS index file used
);
```

---

### Row Level Security (RLS) Policies

```sql
-- Users can only read/write their own profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Users can only read/write their own reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reviews"
  ON public.reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Findings visible to review owner only
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view findings for own reviews"
  ON public.findings FOR SELECT
  USING (review_id IN (
    SELECT id FROM public.reviews WHERE user_id = auth.uid()
  ));
```

---

### Entity Relationship Diagram (ERD)

```
┌─────────────────┐          ┌──────────────────────┐
│  auth.users     │          │  rag_documents        │
│  (Supabase)     │          │─────────────────────  │
│─────────────────│          │  id (PK)              │
│  id (PK)        │          │  source_name          │
│  email          │          │  source_url           │
│  ...            │          │  language             │
└────────┬────────┘          │  total_chunks         │
         │ 1                 │  faiss_index_id       │
         │                   └──────────────────────┘
         ▼ N
┌─────────────────┐
│  profiles       │
│─────────────────│
│  id (PK/FK)     │
│  display_name   │
│  email_notifs   │
└────────┬────────┘
         │ 1
         ▼ N
┌─────────────────────────────┐
│  reviews                    │
│─────────────────────────────│
│  id (PK)                    │
│  user_id (FK → profiles)    │
│  language                   │
│  code_input                 │
│  status                     │
│  score_bugs                 │
│  score_security             │
│  score_performance          │
│  score_readability          │
│  score_best_practices       │
│  score_composite            │
│  fixed_code                 │
│  explanation                │
│  fix_mode_used              │
└────────────┬────────────────┘
             │ 1
             ▼ N
┌────────────────────────────┐
│  findings                  │
│────────────────────────────│
│  id (PK)                   │
│  review_id (FK → reviews)  │
│  dimension                 │
│  severity                  │
│  line_start / line_end     │
│  title                     │
│  description               │
│  suggestion                │
│  standard_ref              │
└────────────────────────────┘
```

---

## 4. RAG Pipeline Design

The RAG pipeline is the intelligence backbone of CodeSensei. It ensures AI feedback is grounded in real, authoritative coding standards rather than relying solely on the LLM's parametric memory.

### 4.1 Ingest Phase (Offline — Run Once / On Update)

```
[Source Documents]
│   • Airbnb JavaScript Style Guide (HTML/MD)
│   • Python PEP8 (python.org)
│   • OWASP Top 10 (owasp.org)
│
▼
[Document Loader]         → Fetch and parse raw text from sources
│
▼
[Text Chunker]            → Split into 512-token chunks with 50-token overlap
│   Strategy: Recursive character text splitter
│   Chunk size: 512 tokens
│   Overlap: 50 tokens
│   Metadata: {source, section, language, rule_id}
│
▼
[Voyage AI Embedder]      → voyage-3-large model
│   Input: chunk text
│   Output: 1024-dimensional float32 vector per chunk
│   Batch size: 128 chunks per API call
│
▼
[FAISS Index Builder]     → IndexFlatIP (Inner Product / cosine similarity)
│   Stores: vectors + chunk metadata
│   Saved to: /data/faiss/codesensei.index
│              /data/faiss/codesensei_metadata.json
│
▼
[Index Persisted to Disk] → Loaded into memory at API server startup
```

### 4.2 Retrieval Phase (Online — Per Review Request)

```
[User submits code + language]
│
▼
[Query Construction]
│   query = "Code review context: {language}\n\n{code_snippet_first_200_tokens}"
│
▼
[Voyage AI Embed Query]   → Same model (voyage-3-large) for embedding symmetry
│   Output: 1024-dim query vector
│
▼
[FAISS Similarity Search]
│   Method: cosine similarity (Inner Product on normalized vectors)
│   Top-K: 8 chunks retrieved
│   Filter: prefer chunks matching submitted language
│
▼
[Context Assembly]
│   Retrieved chunks formatted as:
│   "--- [Airbnb JS Rule 3.2] ---\n{chunk_text}\n"
│   Total context: ~2,000 tokens of standards
│
▼
[Prompt Assembly]
│   System: You are a senior code reviewer...
│   Context: {retrieved_standards_chunks}
│   User: Review this {language} code: {full_code}
│         Return JSON with scores and findings.
│
▼
[Groq LLM — llama-3.3-70b-versatile]
│   Temperature: 0.2 (low for consistent, factual output)
│   Max tokens: 4096
│   Response format: Structured JSON
│
▼
[Parse + Validate JSON Response]
│   Validate schema, fill defaults for missing fields
│
▼
[Store to Supabase + Return to Frontend]
```

### 4.3 RAG Prompt Template

```
SYSTEM:
You are CodeSensei, a senior software engineer and code review expert.
You review code against industry standards and provide structured, actionable feedback.
Always ground your feedback in the provided coding standards context below.

CODING STANDARDS CONTEXT:
{retrieved_chunks}

REVIEW INSTRUCTIONS:
Analyze the following {language} code across these 5 dimensions:
1. Bugs (logic errors, unhandled exceptions, null references)
2. Security (OWASP Top 10 vulnerabilities, injection risks, auth issues)
3. Performance (algorithmic complexity, unnecessary re-renders, N+1 queries)
4. Readability (naming, comments, code structure, cognitive complexity)
5. Best Practices (style guide adherence, patterns, error handling)

For each dimension:
- Assign a score from 1 (very poor) to 10 (excellent)
- List specific findings with line numbers, severity, and fix suggestions
- Reference the relevant coding standard rule where applicable

Return ONLY valid JSON in this exact schema:
{
  "scores": {
    "bugs": 0,
    "security": 0,
    "performance": 0,
    "readability": 0,
    "best_practices": 0,
    "composite": 0
  },
  "findings": [
    {
      "dimension": "bugs|security|performance|readability|best_practices",
      "severity": "low|medium|high|critical",
      "line_start": 0,
      "line_end": 0,
      "title": "",
      "description": "",
      "suggestion": "",
      "standard_ref": ""
    }
  ],
  "explanation": "",
  "fixed_code": ""
}

USER:
Language: {language}
Code:
\`\`\`{language}
{code}
\`\`\`
```

---

## 5. API Endpoints

### Base URL: `https://api.codesensei.dev/v1`

### Authentication
All protected routes require `Authorization: Bearer <supabase_jwt_token>` header.

---

#### Auth Endpoints (Proxied via Supabase)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/signup` | Public | Register new user, triggers verification email |
| `POST` | `/auth/login` | Public | Login, returns JWT |
| `POST` | `/auth/logout` | Protected | Invalidate session |
| `GET` | `/auth/me` | Protected | Get current user profile |
| `PATCH` | `/auth/me` | Protected | Update display name, notification preferences |

---

#### Review Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/reviews` | Protected | Submit new code review |
| `GET` | `/reviews` | Protected | List all reviews for current user (paginated) |
| `GET` | `/reviews/:id` | Protected | Get full review result including findings |
| `POST` | `/reviews/:id/fix` | Protected | Trigger Fix Mode for a completed review |
| `DELETE` | `/reviews/:id` | Protected | Delete a review |

**POST `/reviews` — Request Body:**
```json
{
  "language": "javascript",
  "code_input": "function hello() { ... }",
  "source_url": "https://raw.githubusercontent.com/user/repo/main/index.js"
}
```

**POST `/reviews` — Response (202 Accepted):**
```json
{
  "review_id": "uuid",
  "status": "processing",
  "estimated_seconds": 8
}
```

**GET `/reviews/:id` — Response (200 OK, when completed):**
```json
{
  "id": "uuid",
  "language": "javascript",
  "status": "completed",
  "scores": {
    "bugs": 7.5,
    "security": 4.0,
    "performance": 8.0,
    "readability": 6.5,
    "best_practices": 7.0,
    "composite": 6.6
  },
  "findings": [...],
  "explanation": "This code implements...",
  "fixed_code": "// Fixed version...",
  "created_at": "2026-03-01T10:00:00Z",
  "completed_at": "2026-03-01T10:00:08Z"
}
```

---

#### Dashboard Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/dashboard/stats` | Protected | Aggregate stats for current user |
| `GET` | `/dashboard/progress` | Protected | Score history over time (for line chart) |

**GET `/dashboard/stats` — Response:**
```json
{
  "total_reviews": 24,
  "avg_composite_score": 6.8,
  "avg_composite_this_month": 7.4,
  "avg_scores_by_dimension": {
    "bugs": 7.2,
    "security": 5.1,
    "performance": 7.8,
    "readability": 6.9,
    "best_practices": 7.0
  },
  "most_improved_dimension": "security",
  "weakest_dimension": "security"
}
```

---

#### GitHub URL Fetch Endpoint

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/fetch-github` | Protected | Fetch code from a GitHub raw URL |

**Request:**
```json
{ "url": "https://raw.githubusercontent.com/user/repo/main/app.js" }
```
**Response:**
```json
{ "code": "// fetched code content...", "filename": "app.js", "detected_language": "javascript" }
```

---

## 6. Frontend Pages & Screens

### Page Map

```
/                       → Landing Page (marketing, CTA to sign up)
/signup                 → Sign Up Page
/login                  → Login Page
/dashboard              → Main Dashboard (stats + recent reviews)
/review/new             → Submit Code Page
/review/:id             → Review Results Page
/review/:id/fix         → Fix Mode Diff View
/history                → Review History (paginated list)
/settings               → User Settings (profile, notifications)
```

---

### Page Specifications

#### `/review/new` — Submit Code Page
- Language selector dropdown (JavaScript, TypeScript, Python)
- Code input: large textarea with syntax highlighting
- GitHub URL input field + "Fetch" button (populates textarea)
- Character/line count indicator
- "Run Review" CTA button
- Loading state: animated progress indicator with estimated time

#### `/review/:id` — Review Results Page
- Composite score prominently displayed (large number + color band: red/amber/green)
- 5 dimension score cards in a horizontal grid
- Radar chart of the 5 dimensions
- Findings accordion: expandable per-finding cards grouped by dimension
  - Each finding: severity badge, line reference, description, suggestion, standard ref
- "Explain This Code" collapsible section
- "Apply Fix Mode" button (bottom of page)
- Share review link button

#### `/dashboard` — Main Dashboard
- KPI cards: Total Reviews, Avg Score This Month, Most Improved Dimension
- Line chart: Composite score over time (all-time)
- Radar chart: Average score per dimension
- Recent Reviews table (last 5, link to full result)

#### `/history` — Review History
- Sortable table: Date, Language, Composite Score, Status
- Pagination (10 per page)
- Search/filter by language or date range
- Click row → navigate to review result

---

## 7. Deployment Plan

### Environments

| Environment | Frontend | Backend | Database |
|---|---|---|---|
| **Development** | `localhost:5173` (Vite) | `localhost:3000` | Supabase local / dev project |
| **Staging** | Vercel preview URL | Railway dev service | Supabase staging project |
| **Production** | `codesensei.dev` on Vercel | Railway production | Supabase production project |

---

### Frontend Deployment (Vercel)

```yaml
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_BASE_URL": "@api_base_url",
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

- Push to `main` → auto-deploys to production
- Push to any branch → creates preview deployment
- Custom domain with SSL configured in Vercel dashboard

---

### Backend Deployment (Railway)

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
# Copy FAISS index files
COPY data/faiss ./data/faiss
EXPOSE 3000
CMD ["node", "src/server.js"]
```

**Environment Variables (Railway):**
```
NODE_ENV=production
PORT=3000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
VOYAGE_API_KEY=
RESEND_API_KEY=
FAISS_INDEX_PATH=./data/faiss/codesensei.index
FAISS_METADATA_PATH=./data/faiss/codesensei_metadata.json
```

---

### FAISS Index Deployment Strategy

Since FAISS runs in-process, the index file is bundled with the backend Docker image. For updates to the knowledge base:

1. Run the ingest script locally: `npm run rag:ingest`
2. Commit updated index files to the `data/faiss/` directory
3. Railway automatically redeploys from the updated Docker image
4. Zero downtime: Railway performs rolling deploy

---

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: railway-app/railway-github-action@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 8. Recommended Project Folder Structure

```
codesensei/
│
├── .github/
│   └── workflows/
│       └── deploy.yml               # CI/CD pipeline
│
├── docs/
│   ├── PRD.md                       # Product Requirements Document
│   └── ARCHITECTURE.md              # This document
│
├── frontend/                        # React application
│   ├── public/
│   ├── src/
│   │   ├── api/                     # API client functions
│   │   │   ├── reviews.js
│   │   │   ├── dashboard.js
│   │   │   └── auth.js
│   │   ├── components/              # Reusable UI components
│   │   │   ├── ScoreCard.jsx
│   │   │   ├── FindingCard.jsx
│   │   │   ├── RadarChart.jsx
│   │   │   ├── DiffViewer.jsx
│   │   │   └── CodeEditor.jsx
│   │   ├── pages/                   # Route-level page components
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── NewReview.jsx
│   │   │   ├── ReviewResult.jsx
│   │   │   ├── History.jsx
│   │   │   └── Settings.jsx
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useReview.js
│   │   │   └── useDashboard.js
│   │   ├── context/                 # React context providers
│   │   │   └── AuthContext.jsx
│   │   ├── utils/                   # Helper functions
│   │   │   ├── scoreColors.js
│   │   │   └── languageDetect.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.local
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── backend/                         # Node.js Express API
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── reviewController.js
│   │   │   ├── dashboardController.js
│   │   │   └── githubController.js
│   │   ├── services/
│   │   │   ├── reviewService.js     # Orchestrates the full review flow
│   │   │   ├── ragService.js        # RAG retrieval logic
│   │   │   ├── groqService.js       # Groq LLM API calls
│   │   │   ├── voyageService.js     # Voyage AI embedding calls
│   │   │   ├── faissService.js      # FAISS index load + search
│   │   │   └── emailService.js      # Resend email dispatch
│   │   ├── middleware/
│   │   │   ├── auth.js              # Supabase JWT verification
│   │   │   ├── validate.js          # Request body validation
│   │   │   └── rateLimit.js         # Per-user rate limiting
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── reviews.js
│   │   │   ├── dashboard.js
│   │   │   └── github.js
│   │   ├── config/
│   │   │   ├── supabase.js
│   │   │   └── constants.js
│   │   └── server.js                # Express app entry point
│   ├── data/
│   │   └── faiss/
│   │       ├── codesensei.index     # FAISS binary index file
│   │       └── codesensei_metadata.json
│   ├── scripts/
│   │   ├── ingest.js                # RAG ingest pipeline (run offline)
│   │   └── rebuildIndex.js          # Rebuild FAISS from scratch
│   ├── tests/
│   │   ├── reviewService.test.js
│   │   ├── ragService.test.js
│   │   └── api.integration.test.js
│   ├── Dockerfile
│   ├── .env
│   └── package.json
│
├── database/
│   └── migrations/
│       ├── 001_create_profiles.sql
│       ├── 002_create_reviews.sql
│       ├── 003_create_findings.sql
│       ├── 004_create_rag_documents.sql
│       └── 005_rls_policies.sql
│
├── .gitignore
├── README.md
└── docker-compose.yml               # Local dev environment
```

---

## 9. BMAD: Deliverables Summary

| Deliverable | Description | Status |
|---|---|---|
| `docs/PRD.md` | Full product requirements document | ✅ Complete |
| `docs/ARCHITECTURE.md` | Full system architecture document | ✅ Complete |
| Database schema + migrations | SQL migrations for all tables + RLS | ✅ Defined |
| API specification | All endpoints with request/response shapes | ✅ Defined |
| RAG pipeline spec | Full ingest → retrieve → generate flow | ✅ Defined |
| Deployment plan | Vercel + Railway + CI/CD via GitHub Actions | ✅ Defined |
| Project folder structure | Complete monorepo layout | ✅ Defined |

---

*Document Version: 1.0 | Last Updated: March 2026 | Owner: CodeSensei Architecture Team*
