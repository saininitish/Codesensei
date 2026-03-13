# CodeSensei — Product Requirements Document (PRD)

> **BMAD Framework** | Version 1.1 | Status: In Development
> Prepared by: Product & AI Architecture Team

---

## BMAD: Background

### The Problem with Code Quality Today

Software development teams lose thousands of engineering hours every year to preventable code quality issues. Bugs that could have been caught at review time slip into production. Junior developers repeat the same anti-patterns because feedback loops are slow, inconsistent, or non-existent. Senior engineers burn out spending 40–60% of their time in code review rather than building.

The global developer community now exceeds 27 million professionals, yet access to quality, expert-level code feedback remains unequal. A developer at a top-tier tech company benefits from rigorous peer review, internal style guides, and institutional knowledge. A self-taught developer, a bootcamp graduate, or a solo founder gets none of that.

**CodeSensei exists to close that gap.** It brings senior-engineer-quality code review — grounded in real industry standards — to every developer, instantly, at zero marginal cost.

---

## BMAD: Motivation & Metrics

### Why Developers Need CodeSensei

| Pain Point | Reality |
|---|---|
| **Slow feedback loops** | Traditional PR reviews can take 24–72 hours. Developers context-switch, lose flow, and forget their own reasoning. |
| **Inconsistent standards** | Code review quality varies wildly by reviewer, team, and time-of-day. Two reviewers on the same team may give contradictory feedback. |
| **No learning component** | Most code review tools tell you *what* is wrong but not *why*, and offer no mechanism for tracking improvement. |
| **Inaccessible for solo devs** | Freelancers, bootcamp students, and indie hackers have no reviewer to turn to at all. |
| **Security blind spots** | Most developers are not security engineers. OWASP vulnerabilities regularly ship to production due to unawareness. |

### Success Metrics (OKRs)

**Objective 1 — Adoption**
- KR1: 500 registered users within 60 days of launch
- KR2: 2,000 code reviews submitted within 90 days
- KR3: 40% of registered users return within 7 days (D7 retention)

**Objective 2 — Learning & Value**
- KR1: Average user improves composite code score by ≥15% across their first 10 reviews
- KR2: ≥70% of users rate review feedback as "useful" or "very useful" in post-review survey
- KR3: Fix Mode applied to ≥30% of all submitted reviews

**Objective 3 — Technical Quality**
- KR1: End-to-end review latency (submission → results) under 10 seconds (p95)
- KR2: System uptime ≥ 99.5% in first 90 days
- KR3: RAG retrieval relevance score ≥ 0.85 on evaluation set

---

## 1. Problem Statement

Developers — especially those early in their careers or working independently — lack access to fast, consistent, standards-grounded code feedback. Existing code review tools are either limited to static analysis (linters, formatters), require human reviewers (slow, costly, unscalable), or provide generic AI feedback with no grounding in authoritative coding standards.

**CodeSensei solves this by combining LLM reasoning with Retrieval-Augmented Generation (RAG)** to deliver instant, expert-level code reviews grounded in the Airbnb JavaScript Style Guide, Python PEP8, and OWASP Top 10 — with actionable findings, scored dimensions, auto-fix capability, and longitudinal progress tracking.

---

## 2. Target Users

### Primary Users

| Persona | Description | Core Need |
|---|---|---|
| **Junior Developer** | 0–2 years experience, bootcamp grad or self-taught | Fast, educational feedback without judgment |
| **Mid-level Developer** | 2–5 years, works on a team | Pre-PR sanity check, security coverage |
| **Solo Founder / Freelancer** | Building alone without teammates | Expert review with no access to senior peers |
| **Bootcamp Student** | Actively learning, submitting projects | Structured learning feedback tied to industry standards |

### Secondary Users

| Persona | Description | Core Need |
|---|---|---|
| **Tech Lead** | Uses CodeSensei to standardize team review culture | Consistency tooling |
| **Engineering Manager** | Monitors team code quality trends | Reporting & dashboard data |

---

## 3. User Stories

### Authentication & Onboarding

**US-01 — Sign Up** ✅ *Implemented*
> As a new developer, I want to create an account with my name, email and password so that I can access CodeSensei and have my review history saved.

*Acceptance Criteria:*
- ✅ User can register with name + email + password
- ✅ Validation: duplicate email blocked, password min 6 chars, real-time password strength indicator
- ✅ On successful signup, user is auto-logged in and directed to Dashboard
- ✅ Account data persisted in `data.json` (survives server restarts)
- ⬜ Email verification via Resend *(post-MVP)*
- ⬜ Onboarding screen explaining 5 review dimensions *(post-MVP)*

*Implementation Notes:*
- Frontend: `SignupView` component in `App.jsx` with form validation
- Backend: `POST /v1/auth/signup` in `server.js`
- Session stored in `localStorage` via `authStorage` helper in `api.js`

---

**US-02 — Login / Session Persistence** ✅ *Implemented*
> As a returning user, I want to log in and have my session persist so that I don't have to re-authenticate on every visit.

*Acceptance Criteria:*
- ✅ Login with email + password, session persists via `localStorage`
- ✅ User is redirected to Dashboard on successful login
- ✅ Logout button available in Sidebar
- ✅ Review history persists between login sessions (file-based storage)
- ⬜ JWT expiry / 7-day session timeout *(post-MVP)*

*Implementation Notes:*
- Frontend: `LoginView` component in `App.jsx` with show/hide password toggle
- Backend: `POST /v1/auth/login` in `server.js`
- Demo account pre-seeded: `demo@codesensei.ai` / `demo1234`

---

### Core Review Flow

**US-03 — Submit Code for Review**
> As a developer, I want to paste my code or provide a GitHub raw file URL so that I can receive an AI-powered review without setting up any tools locally.

*Acceptance Criteria:*
- Text area accepts pasted code up to 500 lines (MVP)
- GitHub raw URL input fetches the file and populates the code area
- User selects the programming language (JavaScript, Python, TypeScript)
- Review is submitted with a single click

---

**US-04 — Receive Scored Review**
> As a developer, I want to receive a structured review with a score (1–10) for each of the 5 dimensions so that I can quickly understand where my code is strong and where it needs work.

*Acceptance Criteria:*
- Review displays 5 dimension scores: Bugs, Security, Performance, Readability, Best Practices
- Each dimension shows individual findings with line number references
- Each finding includes: severity (low/medium/high), description, and recommended fix
- A composite score (average of 5 dimensions) is displayed prominently

---

**US-05 — Apply Fix Mode**
> As a developer, I want to see a rewritten version of my code with all AI-suggested fixes applied so that I can understand what the corrected code looks like without manually applying each change.

*Acceptance Criteria:*
- "Apply Fix Mode" button is available on every completed review
- Fixed code is displayed in a syntax-highlighted diff view (original vs. fixed)
- User can copy the fixed code to clipboard in one click

---

**US-06 — Read Code Explanation**
> As a developer learning a new language or pattern, I want a plain-English explanation of what my code does so that I can validate my understanding and learn from the review.

*Acceptance Criteria:*
- "Explain This Code" section is included in every review result
- Explanation is written at an accessible level (no assumed deep expertise)
- Explanation references the specific logic, patterns, and any notable constructs in the submitted code

---

### History & Progress

**US-07 — View Review History**
> As a developer, I want to see a list of all my past reviews so that I can revisit feedback and track what I've been working on.

*Acceptance Criteria:*
- Review history page lists all past submissions with: date, language, composite score, and snippet preview
- User can click any past review to open the full results
- Reviews are paginated (10 per page)

---

**US-08 — Track Progress on Dashboard**
> As a developer, I want to see a dashboard showing how my code scores have changed over time so that I can measure my improvement and stay motivated.

*Acceptance Criteria:*
- Dashboard displays a line chart of composite scores over time
- Radar chart showing average scores per dimension (to identify consistent weaknesses)
- "Total Reviews Submitted" and "Average Score This Month" KPI cards displayed

---

### Notifications

**US-09 — Receive Review Completion Email**
> As a developer who submitted a long review, I want to receive an email notification when my review is complete so that I don't have to wait on the page.

*Acceptance Criteria:*
- Email sent via Resend when review status transitions to `completed`
- Email contains: summary of scores, link back to full review
- User can opt out of email notifications in settings

---

**US-10 — Weekly Progress Digest**
> As an active user, I want to receive a weekly email summarizing my code quality trends so that I stay engaged and aware of my improvement.

*Acceptance Criteria:*
- Optional weekly digest email sent every Monday
- Digest includes: reviews completed that week, average score vs. prior week, top improvement area
- Unsubscribe link included in every digest

---

## 4. MVP Feature List

### Must Have (Launch)
- [x] User authentication — **Sign Up** (`POST /v1/auth/signup`)
- [x] User authentication — **Login** (`POST /v1/auth/login`) 
- [x] User authentication — **Logout** (sidebar button + localStorage clear)
- [x] Session persistence via `localStorage` (survives page refresh)
- [x] Review history persistence via `data.json` (survives server restart)
- [ ] Code submission via paste or GitHub raw URL
- [ ] AI code review across 5 dimensions with scores (1–10)
- [ ] Per-finding details with line number references and severity
- [ ] Fix Mode: AI-rewritten code with diff view
- [ ] Code explanation section
- [ ] Review history (list + detail view)
- [ ] Progress dashboard (score over time, per-dimension radar chart)
- [ ] RAG pipeline grounded in Airbnb JS, PEP8, and OWASP Top 10
- [ ] Email notification on review completion (Resend)

### Should Have (Post-Launch Sprint 1)
- [ ] Support for TypeScript and Python (in addition to JavaScript at launch)
- [ ] Weekly progress digest email
- [ ] Shareable review links (public permalink)
- [ ] Review comment/annotation by the user

### Nice to Have (Backlog)
- [ ] GitHub OAuth login
- [ ] Direct GitHub PR integration (review PRs without copy-paste)
- [ ] Team workspace with shared review history
- [ ] Custom style guide ingestion (upload your own coding standards)
- [ ] IDE plugin (VS Code extension)

---

## 5. Out of Scope (MVP)

The following are explicitly **not** in scope for the MVP release:

- Real-time collaborative code editing
- In-browser code execution or sandboxed runtime
- Support for languages beyond JavaScript, TypeScript, and Python
- CI/CD pipeline integrations (GitHub Actions, GitLab CI)
- Team management, org-level billing, or SSO
- Mobile native application (iOS/Android)
- Plagiarism or AI-generated code detection
- Code coverage analysis or test generation

---

## 6. Success Criteria

The MVP will be considered successful when all of the following are true within **90 days of launch**:

| Criterion | Target | Measurement Method |
|---|---|---|
| User Acquisition | ≥ 500 registered users | Supabase auth records |
| Review Volume | ≥ 2,000 reviews submitted | `reviews` table row count |
| D7 Retention | ≥ 40% of users return within 7 days | Session analytics |
| Score Improvement | Users improve avg score ≥15% over first 10 reviews | Dashboard query on `reviews` table |
| User Satisfaction | ≥ 70% rate feedback "useful"/"very useful" | In-app post-review survey |
| Review Latency | p95 latency < 10 seconds | Backend response time logs |
| System Uptime | ≥ 99.5% | Vercel + uptime monitoring |
| Fix Mode Adoption | ≥ 30% of reviews trigger Fix Mode | `fix_mode_used` boolean in `reviews` |

---

*Document Version: 1.0 | Last Updated: March 2026 | Owner: CodeSensei Product Team*
