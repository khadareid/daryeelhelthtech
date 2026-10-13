# Daryeel Health — Super Admin / News / Approvals deployment

## Audit summary (before this upgrade)

- Existing Prisma `Role` enum and healthcare models were preserved.
- Self-service `PATCH /user/profile/:id/role` previously allowed users to set `DOCTOR` etc. — **locked to USER/PATIENT only**.
- `GET /user/profile/:id` returned medical data to any authenticated caller — **now requires ownership, admin, or verified care relationship + consent**.
- News on web/mobile was static (`HEALTH_NEWS` / `DEMO_NEWS`) — **live API added with static fallback**.
- RBAC helpers existed (`superAdminOnly`) but Super Admin APIs/UI did not.

## Migration

```bash
cd Backend
npx prisma migrate deploy
# or in development:
npx prisma migrate dev
npx prisma generate
npm run build
```

Migration folder: `prisma/migrations/20261010180000_admin_news_features/`

## New API routes (`/api/v1`)

| Area | Routes |
|------|--------|
| Admin | `GET /admin/stats`, `GET/PATCH /admin/users`, `POST /admin/users/:id/password-reset`, `GET/PATCH /admin/features`, `GET/PATCH /admin/professional-applications`, news moderation under `/admin/news/*` |
| Features (user) | `GET /admin/features/me` |
| Applications | `POST /professional-applications`, `GET /professional-applications/mine` |
| News | `GET/POST /news`, `GET/PATCH/DELETE /news/:id`, comments, reactions, `POST /news/reports` |

All privileged admin routes use `decodeToken` + `superAdminOrAdmin`. Feature flags are enforced in services (`isFeatureAllowed`).

## First Super Admin

Promote a trusted user in the database (do not expose this via public API):

```sql
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'you@example.com';
```

## Web

- Dashboard `?section=admin` — Super Admin panel (stats, users, modules, applications, moderation)
- Dashboard `?section=apply-professional` — professional application form
- `/news` — live feed + composer (signed-in)

## Mobile

- `/news` — live feed with curated fallback
- `/apply-professional` — submit professional application

## Remaining limitations

- Image upload for news uses URL fields only (no multipart storage yet).
- Rate limiting is not wired (add reverse-proxy / middleware in production).
- Doctor–patient consent must be granted for clinicians to open another user’s full profile.
- Automated Jest suite for these new routes was not run in CI here; run `npm test` / smoke-test after migrate.
- Password reset token is returned once to the admin API response for secure out-of-band delivery — configure email delivery before relying on it in production.
