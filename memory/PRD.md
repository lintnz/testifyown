# Testify — Testimonial Collection & Showcase SaaS

## Original Problem Statement
Build a modern SaaS (like Testimonial.to, own branding) for businesses/creators/agencies to collect video + written customer testimonials via shareable public pages, manage/approve them, and showcase them via embeddable widgets on any website.

## Architecture
- **Backend**: FastAPI (modular: server.py routes, auth.py, storage.py, email_service.py, captcha.py, models.py, db.py), MongoDB (motor). All routes /api prefixed.
- **Frontend**: React + React Router + TanStack Query + Tailwind + shadcn/ui + framer-motion. Fonts: Outfit (heading) / Manrope (body). Dark-first premium aesthetic, accent #ff5722.
- **Auth**: JWT Bearer (localStorage `testify_token`) — email/password + Emergent-managed Google login unified into one app JWT.
- **Storage**: Emergent object storage (video, images, logos) served via /api/media/{path}.
- **Email**: Resend service abstraction (currently MOCKED — logs only until RESEND_API_KEY set).
- **Spam**: Google reCAPTCHA v2 abstraction (currently graceful-skip until keys set) + honeypot + in-memory rate limiting.

## User Personas
- Business owner (SaaS, agency, coach, creator, freelancer) — collects & showcases testimonials.
- Customer/testimonial giver — submits video/written testimonial with no account.

## Core Requirements (static)
Auth, workspaces, collection pages, public mobile-first submission (video record/upload + written), testimonial management (approve/reject/archive/edit/tag/feature), embeddable widgets (grid/carousel/masonry/single/video-wall) with live preview + embed code, analytics, landing page, onboarding.

## Implemented (2026-06)
- Auth: register/login/logout/me/profile/forgot+reset password; Google OAuth; brute-force lockout.
- Onboarding wizard (business name → color → collection → shareable link).
- Dashboard: sidebar shell, Overview (stats + recent + approve), Testimonials (filters/search/approve/reject/tag/feature/delete), Testimonial detail (edit public content, notes, tags, consent), Collection pages (CRUD, publish, share dialog w/ QR + email/WhatsApp/LinkedIn), Collection editor (branding, fields, custom questions, thank-you/redirect), Widgets (CRUD), Widget Builder (live preview + all config + embed code), Analytics (recharts timeseries + type pie), Settings (profile, workspace branding + logo upload, theme, plan).
- Public collection submission page (mobile-first, video recorder w/ upload fallback, written, rating, consent, avatar upload, honeypot, optional reCAPTCHA).
- Widget embed system: /api/widget.js script injects auto-resizing iframe → /embed/{id} rendering approved-only public testimonials; live sync from dashboard.
- Landing page (hero, marquee wall, how-it-works, features, use cases, pricing, FAQ, CTA).
- Seed demo data (admin@testify.com / admin123, 6 testimonials, tags, widget).
- Tested: 26/26 backend pytest + frontend flows PASS (iteration_1.json). Full E2E propagation verified.

## Backlog / Remaining
- P1: Wire real Resend key (emails) + real reCAPTCHA keys (spam) — currently MOCKED.
- P1: Browser video recording verified via upload path; live camera record needs device QA.
- P2: Team members / multi-user roles, custom domain, white-label, admin panel, Stripe billing, video processing/thumbnails/transcoding, SEO/OG meta for public pages, Redis rate limiting for prod.

## Next Tasks
See finish summary Next Action Items.
