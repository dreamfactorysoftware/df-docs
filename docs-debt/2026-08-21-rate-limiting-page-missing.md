<!-- docs-debt from link audit 2026-08-21; found while fixing broken links -->

## Rate limiting has no docs page

Four pages linked to `/api-security/rate-limiting`, which does not exist and
appears to never have been migrated. DreamFactory's Limits feature (per-user,
per-service, per-endpoint rate limits) currently has zero coverage in the docs.
Links were retargeted to `/Security/authenticating-your-apis` as a stopgap.

Needed: a `docs/Security/rate-limiting.md` page covering limit types, creation
via admin UI and `/api/v2/system/limit`, limit periods, and cache backing.
