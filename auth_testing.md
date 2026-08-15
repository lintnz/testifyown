# Auth Testing Playbook — Testify

## Auth model
Testify uses JWT Bearer tokens (not cookies). Both email/password and Emergent Google login issue an app JWT returned in the `token` field of the response, stored by the frontend in `localStorage` under key `testify_token`, and sent as `Authorization: Bearer <token>`.

## Test account
- Email: `admin@testify.com`
- Password: `admin123`
- Seeded with demo workspace "Testify Demo", collection slug `testify-demo` (published), 6 testimonials (5 approved, 1 pending), tags, and a grid widget.

## Backend checks
```
API=https://customer-voice-44.preview.emergentagent.com
TOKEN=$(curl -s -X POST "$API/api/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@testify.com","password":"admin123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s "$API/api/auth/me" -H "Authorization: Bearer $TOKEN"
curl -s "$API/api/overview" -H "Authorization: Bearer $TOKEN"
curl -s "$API/api/public/collection/testify-demo"
```

## Endpoints
- Auth: /api/auth/register|login|google|me|logout|profile|forgot-password|reset-password
- Workspace: /api/workspace (GET/PUT), /api/onboarding (POST)
- Collections: /api/collections (GET/POST), /api/collections/{id} (GET/PUT/DELETE)
- Testimonials: /api/testimonials (GET), /{id} (GET/PUT/DELETE), /{id}/status, /{id}/feature, /{id}/tags
- Widgets: /api/widgets (GET/POST), /{id} (GET/PUT/DELETE)
- Public: /api/public/collection/{slug} (GET), /api/public/collection/{slug}/submit (POST), /api/public/widget/{id} (GET), /api/widget.js
- Upload: POST /api/upload (multipart), GET /api/media/{path}
- Analytics: GET /api/analytics, GET /api/overview, POST /api/analytics/event

## Authorization isolation
A user must never access another workspace's data via ID manipulation. All owned-resource routes filter by the authenticated user's workspace_id and return 404 otherwise.
