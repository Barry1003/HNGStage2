# Backend Wizards Stage 2 — Intelligence Query Engine

REST API for Insighta Labs with advanced filtering, sorting, pagination, and natural language search.

## Tech Stack
- Node.js + TypeScript, Express, PostgreSQL (Neon), Prisma, Railway

## Base URL
https://your-app.railway.app

## Setup
```bash
pnpm install
cp .env.example .env
pnpm dlx prisma migrate deploy
pnpm seed
pnpm build && pnpm start
```

## Endpoints

### POST /api/profiles
Create a profile. Returns existing if name already exists.

### GET /api/profiles
Filters: gender, country_id, age_group, min_age, max_age, min_gender_probability, min_country_probability
Sorting: sort_by=age|created_at|gender_probability, order=asc|desc
Pagination: page (default 1), limit (default 10, max 50)

### GET /api/profiles/search?q=...
Natural language search (rule-based only, no AI).

### GET /api/profiles/:id
Get single profile by UUID.

### DELETE /api/profiles/:id
Delete profile. Returns 204.

## Natural Language Parsing

Rule-based only. No AI or LLMs used.

### Supported Keywords

| Pattern | Filter |
|---|---|
| males / male | gender=male |
| females / female | gender=female |
| male and female | no gender filter |
| young | min_age=16, max_age=24 |
| children / kids | age_group=child |
| teenagers / teens | age_group=teenager |
| adults | age_group=adult |
| seniors / elderly | age_group=senior |
| above X / over X / older than X | min_age=X |
| below X / under X / younger than X | max_age=X |
| between X and Y | min_age=X, max_age=Y |
| aged X | min_age=X, max_age=X |
| from nigeria / from kenya etc. | country_id=NG/KE etc. |

### How It Works
1. Query lowercased and trimmed
2. Gender detected via word boundary regex
3. Age group keywords map to stored values
4. "young" maps to 16-24 for parsing only (not a stored age_group)
5. Numeric age ranges extracted via regex
6. Countries matched against static map, longest match first
7. No filters parsed = returns "Unable to interpret query"

### Limitations
- English only
- ~70 pre-mapped countries; unmapped countries won't filter
- No spelling correction or typo handling
- Multiple countries in one query not supported (first match used)
- Relative terms like "middle-aged" not supported
- "both genders" not handled

## Error Responses

| Status | Meaning |
|---|---|
| 400 | Missing parameter or uninterpretable query |
| 404 | Profile not found |
| 422 | Invalid parameter type |
| 502 | External API failure |
| 500 | Internal server error |
