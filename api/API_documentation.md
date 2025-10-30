## Mol* View Stories API — Concise Reference

### Base
- **base URL**: `https://stories.molstar.org` (configurable via `BASE_URL`)
- **content type**: JSON unless noted
- **upload limit**: `MAX_UPLOAD_SIZE_MB` (default 100 MB)

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

  Minimal payloads
  - `.mvsj` (JSON inline):
    ```json
    {
      "filename": "example.mvsj",
      "title": "My Story",
      "description": "Optional description",
      "tags": ["tag1", "tag2"],
      "data": {
        "story": {
          "title": "My Story",
          "scenes": []
        }
      }
    }
    ```
  - `.mvsx` (zip-as-base64). The zip must contain at least `index.mvsj` at the root. Example to produce base64 using Python:
    ```bash
    # Create a minimal index.mvsj
    cat > index.mvsj << 'JSON'
    { "story": { "title": "My Story", "scenes": [] } }
    JSON
    # Zip it (Git Bash: use 'zip'; if unavailable, use any zip tool)
    zip -q story.zip index.mvsj
    # Base64-encode with Python (portable)
    python - << 'PY'
import base64,sys
with open('story.zip','rb') as f:
    print(base64.b64encode(f.read()).decode('utf-8'))
PY
    ```
    Use the printed string as `data` and set `filename` to `example.mvsx`:
    ```json
    {
      "filename": "example.mvsx",
      "title": "My Story",
      "description": "Optional",
      "tags": [],
      "data": "<BASE64_OF_ZIP>"
    }
    ```

  Example request (mvsj):
  ```bash
  curl -s -X POST "$BASE_URL/api/story" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{
      "filename": "example.mvsj",
      "title": "My Story",
      "description": "",
      "tags": [],
      "data": { "story": { "title": "My Story", "scenes": [] } }
    }'
  ```

  Example 201 response (metadata):
  ```json
  {
    "id": "a1b2c3d4",
    "type": "story",
    "created_at": "2024-01-01T00:00:00+00:00",
    "updated_at": "2024-01-01T00:00:00+00:00",
    "creator": { "id": "sub-123", "name": "Jane", "email": "j@example.com" },
    "title": "My Story",
    "description": "",
    "tags": [],
    "version": "1.0",
    "public_uri": "https://stories.molstar.org/api/story/a1b2c3d4"
  }
  ```

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

  Example request (update title + tags only):
  ```bash
  curl -s -X PUT "$BASE_URL/api/story/$STORY_ID" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{ "title": "New Title", "tags": ["updated"] }'
  ```

  Example request (update data for existing .mvsj):
  ```bash
  curl -s -X PUT "$BASE_URL/api/story/$STORY_ID" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{ "data": { "story": { "title": "New Title", "scenes": [] } } }'
  ```

- **DELETE** `/api/story/{story_id}` [auth, owner]
  - Deletes metadata and data file(s)
  - 200 OK; 401/403/404

- **GET** `/api/story/{story_id}/data`
  - Return raw story content (public)
  - Query: `format=mvsj|mvsx` (optional). If unspecified, tries both
  - Response: `.mvsj` → JSON; `.mvsx` → binary ZIP download
  - 200 OK; 404 if data not found

  Examples:
  - JSON: `curl -s "$BASE_URL/api/story/$STORY_ID/data?format=mvsj"`
  - ZIP: `curl -sL "$BASE_URL/api/story/$STORY_ID/data?format=mvsx" -o story.mvsx`

- **GET** `/api/story/{story_id}/format`
  - Returns `{ "format": "mvsj" | "mvsx" }`
  - 200 OK; 404 if no data file

### Sessions (private)
- **POST** `/api/session` [auth]
  - Create session (private for write)
  - Body: `{ filename: "*.mvstory", title, description, tags[], data }`
    - `data`: base64-encoded msgpack payload
  - 201 Created

  Minimal payload
  1) Build msgpack and base64 encode (Python one-liner):
  ```bash
  python - << 'PY'
import base64, msgpack, sys
payload = {"k": 1}  # your session data structure
b = msgpack.packb(payload, use_bin_type=True)
print(base64.b64encode(b).decode('utf-8'))
PY
  ```
  2) Use the printed string as `data`:
  ```json
  {
    "filename": "session.mvstory",
    "title": "My Session",
    "description": "Optional",
    "tags": [],
    "data": "<BASE64_OF_MSGPACK>"
  }
  ```
  3) Create via curl:
  ```bash
  curl -s -X POST "$BASE_URL/api/session" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{ "filename": "session.mvstory", "title": "My Session", "description": "", "tags": [], "data": "<BASE64_OF_MSGPACK>" }'
  ```

- **GET** `/api/session` [auth]
  - List the authenticated user’s sessions
  - 200 OK

- **GET** `/api/session/{session_id}` [auth, owner]
  - Get session metadata
  - 200 OK; 401/403/404

- **PUT** `/api/session/{session_id}` [auth, owner]
  - Update: `{ title?, description?, tags?, data? }`
  - 200 OK; 401/403/404

  Example update (title only):
  ```bash
  curl -s -X PUT "$BASE_URL/api/session/$SESSION_ID" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{ "title": "New Session Title" }'
  ```

- **DELETE** `/api/session/{session_id}` [auth, owner]
  - 200 OK; 401/403/404

- **GET** `/api/session/{session_id}/data` [auth, owner]
  - Return decoded session data as JSON. Bytes are base64 in JSON
  - 200 OK; 401/403/404

  Example:
  ```bash
  curl -s "$BASE_URL/api/session/$SESSION_ID/data" -H "Authorization: Bearer $TOKEN"
  ```

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
- Stories are public for reads; sessions are private (read/write require authentication and ownership).