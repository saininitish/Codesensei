# CodeSensei — System Architecture Document

> **BMAD Framework** | Version 1.1 | Status: Draft
> Prepared by: AI Architecture Team

---

## BMAD: Approach

### System Overview

CodeSensei is built on a **modern two-tier architecture**: a React frontend and a Node.js API backend. The system uses **Supabase** (PostgreSQL) for persistent user data, profile settings, and code review history, providing a scalable and reliable cloud-hosted data layer.

The intelligence layer is powered by a **standards-grounded RAG (Retrieval-Augmented Generation) pipeline** that ensures every AI review is informed by language-specific best practices (Airbnb JS, PEP8, OWASP, etc.) before calling the Groq LLM.

The core review flow is:
1. User submits code via the React frontend (manual paste, GitHub Repo Browser, or GitHub URL)
2. Backend preprocesses code and retrieves relevant coding standards from the built-in RAG service
3. A context-enriched prompt is sent to the Groq LLM (llama-3.3-70b-versatile)
4. Structured review results are persisted to Supabase and returned to the frontend
5. Users can optionally share the report via email (Resend API) or update their profile settings

---

## 1. Tech Stack with Justification

### Frontend

| Technology | Role | Justification |
|---|---|---|
| **React** | UI framework | Component-based architecture ideal for the review results UI (tabs, scoring). Large ecosystem for charts (Recharts) and syntax highlighting. |
| **React Router** | Client-side routing | SPA navigation between Dashboard, Review, History, and Settings pages. |
| **Recharts** | Data visualization | Progress dashboard charts — lightweight and built for React. |
| **Tailwind CSS** | Styling | Utility-first CSS for rapid UI development without heavy component library dependency. |
| **Vercel** | Deployment | Zero-config deployment for React apps with automatic edge CDN. |

### Backend

| Technology | Role | Justification |
|---|---|---|
| **Node.js + Express** | REST API server | JavaScript across the full stack reduces context-switching. Express is minimal and flexible. |
| **Simple Auth** | Local authentication | Email/password auth handled directly in the API for speed and zero-cost hosting. |
| **Groq SDK** | LLM inference | Groq's LPUs deliver inference speeds 10–20x faster than standard GPUs. |
| **Resend SDK** | Transactional email | Developer-first email API for sharing reports. |

### Data & Infrastructure

| Technology | Role | Justification |
|---|---|---|
| **Supabase** | Primary database | Scalable PostgreSQL storage for users and reviews. Built-in auth capabilities and edge functions. |
| **Local Storage** | Session management | `localStorage` handles user sessions and a Chrome-style multi-account switcher. |
| **GitHub API** | Repo Integration | Enables GitHub raw URL fetching and repository browsing. |
| **Railway / Render** | Hosting | Reliable Node.js hosting with support for environment-based configuration. |

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
║                   (Deployed on Render / Railway)                         ║
║                                                                          ║
║  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  ┌────────────┐  ║
║  │  Auth       │  │  Review      │  │  RAG Service   │  │  Email     │  ║
║  │  (Local)    │  │  Controller  │  │  (standards)   │  │  Service   │  ║
║  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  └─────┬──────┘  ║
╚═════════╪════════════════╪══════════════════╪════════════════╪══════════╝
          │                │                  │                │
          ▼                ▼                  ▼                ▼
  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │   SUPABASE    │  │   GROQ API   │  │   STANDARDS  │  │   RESEND     │
  │ (PostgreSQL   │  │  llama-3.3-  │  │ (JS, Python, │  │  (email      │
  │   Storage)    │  │  70b-        │  │  Java, etc.) │  │   delivery)  │
  │               │  │  versatile)  │  │              │  │              │
  └───────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### Data Flow Summary

```
[User submits code]
        │
        ▼
[Backend validates + detects language]
        │
        ├──► [RAG retrieves language-specific standards]
        │              │
        ▼              ▼
[Prompt assembled: code + standards context + review instructions]
        │
        ▼
[Groq LLM generates structured JSON review]
        │
        ├──► [Review persisted to Supabase]
        ├──► [Email sent via Resend (on share/notify)]
        └──► [JSON returned to React frontend]
```

---

## 3. Data Schema

### Supabase Database (PostgreSQL)

The application uses Supabase for structured data persistence.

#### Table: `profiles`
| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key (generated on signup) |
| `name` | text | User's display name |
| `email` | text | Unique email identifier |
| `password` | text | Password (plain text for MVP) |
| `notifications` | jsonb | User notification preferences |

#### Table: `reviews`
| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Reference to `profiles.id` |
| `language` | text | Programming language detected/selected |
| `code_input` | text | The original source code |
| `source_url` | text | URL if submitted via GitHub |
| `source_type` | text | `pasted` or `github` |
| `source_display`| text | Filename or friendly label |
| `status` | text | `processing`, `completed`, `failed` |
| `scores` | jsonb | Detailed dimension scores |
| `findings` | jsonb | AI-identified issues array |
| `explanation` | text | Natural language code summary |
| `fixed_code` | text | AI-rewritten code |
| `created_at` | timestamp | ISO creation time |
| `completed_at` | timestamp | ISO completion time |

---

## 4. RAG Pipeline Design (MVP State)

### 4.1 Retrieval Phase
1. **Language Detection**: Identified from selection or URL.
2. **Context Matching**: predefined best practices combined with language-specific rules.
3. **Context Injection**: selected standards are injected into the LLM system prompt.

### 4.2 Supported Standards
- JavaScript (Airbnb), Python (PEP8), TypeScript, Java (Google), Go, Rust, etc.

---

## 5. API Endpoints

### Base URL: `http://localhost:3000/v1`

#### Auth Endpoints
- `POST /auth/signup`: Register new user.
- `POST /auth/login`: Login, returns profile.
- `DELETE /user/account`: Delete user data.

#### Review Endpoints
- `POST /reviews`: Submit new code review.
- `GET /reviews`: List reviews for current user.
- `GET /reviews/:id`: Get full review results.
- `PATCH /reviews/:id`: Rename review title.
- `POST /reviews/:id/share`: Share report via email.

---

## 6. Frontend Pages

- `/`: Landing Page
- `/signup` / `/login`: Auth
- `/dashboard`: Stats & Recent Activity
- `/review/new`: Submission Page
- `/review/:id`: Result Page (including Fix Mode)
- `/history`: Full Review History
- `/settings`: Profile & Account Management

---

## 7. Deployment Plan

| Environment | Frontend | Backend | Storage |
|---|---|---|---|
| **Development** | `localhost:5173` | `localhost:3000` | Local `data.json` |
| **Production** | Vercel | Railway / Render | Persistent `data.json` |

---

## 8. Project Folder Structure

```
codesensei/
├── ARCHITECTURE.md        # System architecture
├── PRD.md                 # Product requirements
├── backend/               # Node.js API
│   ├── src/
│   │   ├── services/      # Review, RAG, Email, Supabase logic
│   │   └── server.js      # Express entry point
│   └── .env               # API Keys (Groq, Resend, Supabase)
└── frontend/              # React SPA (Vite)
    ├── src/
    │   ├── components/    # UI elements (Atomic components)
    │   ├── views/         # Page containers (Dashboard, Submit, Result)
    │   └── api.js         # API & Auth storage interface
    └── tailwind.config.js
```

---

## 9. BMAD: Deliverables Summary

| Deliverable | Description | Status |
|---|---|---|
| `PRD.md` | Product Requirements Document | ✅ Updated |
| `ARCHITECTURE.md` | System Architecture Document | ✅ Updated |
| Local Store | Persistence in `data.json` | ✅ Complete |
| RAG System | Language-specific standards | ✅ Complete |

---

*Document Version: 1.1 | Last Updated: March 2026*
