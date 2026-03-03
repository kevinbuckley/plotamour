# Reliability — plotamour

## Error Handling Strategy

### Layers

1. **Database errors** — Caught in service layer, translated to user-friendly messages
2. **Google API errors** — Caught in google-docs service, with retry for transient failures
3. **Validation errors** — Caught at API/action boundary with Zod
4. **UI errors** — React Error Boundaries per route segment

### Error Categories

| Category | Handling |
|---|---|
| Network error | Toast: "Connection lost. Your changes will save when you're back online." |
| Auth expired | Redirect to login with return URL |
| Google token revoked | Inline prompt: "Reconnect Google Docs" |
| Google API rate limit | Queue and retry with backoff |
| Validation error | Inline field errors (no toasts for form validation) |
| Not found | 404 page or "This project was deleted" |
| Permission denied | 403 page (shouldn't happen with RLS, but defensive) |
| Unknown server error | Generic toast + log to console. No stack traces shown. |

### User Data Protection

- All destructive actions use soft deletes
- Google Docs are NEVER deleted by plotamour (only unlinked)
- Drag-and-drop operations use optimistic UI with rollback on failure
- Forms save drafts to localStorage as a fallback (Phase 4)

## Monitoring

### Phase 1 (Minimal)
- Vercel Analytics (built-in, free)
- Console error logging
- Supabase dashboard for DB monitoring

### Future
- Sentry for error tracking
- Custom analytics for product metrics

## Uptime

- Vercel provides automatic failover and edge caching
- Supabase free tier: no SLA, but historically reliable
- Google Docs API: 99.9% SLA from Google
- Our target: if Google and Supabase are up, we're up
