## Mol* View Stories API — Concise Reference

### Base
- **base URL**: `https://stories.molstar.org` (configurable via `BASE_URL`)
- **content type**: JSON unless noted
- **upload limit**: `MAX_UPLOAD_SIZE_MB` (default 50 MB)

### Auth
- **header**: `Authorization: Bearer <OIDC_access_token>`
- Required for create/update/delete; many reads are public.

### Error shape
```json
{ "error": true, "message": "string", "status_code": 400, "details": {} }
```

### Stories (public read)
- **POST** `/api/story` [auth]
  - Create public story
  - Body: `{ filename: "*.mvsj|*.mvsx", title, description, tags[], data }`
    - `.mvsj`: `data` is JSON
    - `.mvsx`: `data` is base64 ZIP string
  - Query: `return_data=true` to return full story data; otherwise returns metadata with `public_uri`
  - 201 Created

- **POST** `/api/story/mvsj` [auth]
  - Same validation; always returns the full `.mvsj`-style JSON data object
  - 201 Created

- **GET** `/api/story`
  - List stories: with valid token → only that user’s stories; without → all public stories
  - 200 OK

- **GET** `/api/story/{story_id}`
  - Get story metadata (public)
  - 200 OK; 404 if not found

- **PUT** `/api/story/{story_id}` [auth, owner]
  - Update: `{ title?, description?, tags?, data? }`
  - If `data` provided, overwrites existing data file, preserving extension
  - 200 OK; 401/403/404

- **DELETE** `/api/story/{story_id}` [auth, owner]
  - Deletes metadata and data file(s)
  - 200 OK; 401/403/404

- **GET** `/api/story/{story_id}/data`
  - Return raw story content (public)
  - Query: `format=mvsj|mvsx` (optional). If unspecified, tries both
  - Response: `.mvsj` → JSON; `.mvsx` → binary ZIP download
  - 200 OK; 404 if data not found

- **GET** `/api/story/{story_id}/format`
  - Returns `{ "format": "mvsj" | "mvsx" }`
  - 200 OK; 404 if no data file

### Sessions (write private; reads public via API)
- **POST** `/api/session` [auth]
  - Create session (private for write)
  - Body: `{ filename: "*.mvstory", title, description, tags[], data }`
    - `data`: base64-encoded msgpack payload
  - 201 Created

- **GET** `/api/session` [auth]
  - List the authenticated user’s sessions
  - 200 OK

- **GET** `/api/session/{session_id}`
  - Get session metadata (public read)
  - 200 OK; 404

- **PUT** `/api/session/{session_id}` [auth, owner]
  - Update: `{ title?, description?, tags?, data? }`
  - 200 OK; 401/403/404

- **DELETE** `/api/session/{session_id}` [auth, owner]
  - 200 OK; 401/403/404

- **GET** `/api/session/{session_id}/data`
  - Return decoded session data as JSON (public read). Bytes are base64 in JSON
  - 200 OK; 404 if data not found

### User utilities
- **DELETE** `/api/user/delete-all` [auth]
  - Deletes all of the user’s sessions and stories
  - 200 with deletion summary

- **GET** `/api/user/quota` [auth]
  - Returns usage and limits for sessions/stories
  - 200 OK

### Admin/Utility
- **GET** `/api/userinfo` [auth]
  - Validate token via OIDC `/userinfo`; returns profile
  - 200 OK

- **GET** `/verify` [auth]
  - Verifies token; returns `{ authenticated: true, user }`
  - 200 OK

- **GET** `/api/s3/buckets`
  - Lists MinIO buckets; 200 OK

- **GET** `/api/s3/list?prefix=<path>`
  - Lists objects under a prefix; 200 OK

### Status codes (common)
- 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden,
  404 Not Found, 413 Payload Too Large, 500 Server Error

### Examples
```bash
# Fetch public story data (auto-detect format)
curl -s https://stories.molstar.org/api/story/<id>/data

# Create a story (.mvsj)
curl -s -X POST https://stories.molstar.org/api/story \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{ "filename": "example.mvsj", "title": "T", "description": "", "tags": [], "data": { "story": {} } }'
```

Notes
- Stories are public for reads; sessions are write-private but readable via the API endpoints above.