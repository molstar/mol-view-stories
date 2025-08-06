# API Testing Guide

This guide provides examples for testing each API endpoint using mock data. You can use tools like `curl`, Postman, or any HTTP client to test these endpoints.

## Prerequisites

1. Make sure the server is running locally:
```bash
python app.py
```

2. The server will be available at: `http://localhost:5000`

## Testing Authentication

For testing purposes, you'll need a valid Bearer token. You can obtain one from your OIDC provider.

Example token format in requests:
```
Authorization: Bearer your_token_here
```

## Storage Structure

The backend uses a simplified user-centric hierarchical storage structure:

```
root/
└── {user_id}/
    ├── sessions/
    │   └── {session_id}/
    │       ├── metadata.json
    │       └── data.mvstory
    └── stories/
        └── {story_id}/
            ├── metadata.json
            └── data.{ext}
```

**Key Points:**
- **Sessions** are publicly readable by session ID, but creation/modification requires authentication and ownership
- **Stories** are always public and don't require authentication for read access  
- All user data is organized under their user ID, making it easy to manage per-user storage
- The user ID is automatically extracted from the creator metadata when accessing objects
- Frontend can safely use just the session/story ID in URLs without worrying about clashes

## API Endpoints Testing

### 1. Basic Health Check

```bash
# Check if the server is running
curl http://localhost:5000/ready
```

Expected response:
```
OK
```

### 2. Session Management (Public Read, Private Write)

#### Create a New Session

```bash
# Creating a session (requires authentication)
curl -X POST "http://localhost:5000/api/session" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "filename": "example-session.mvstory",
    "title": "My Test Session",
    "description": "A sample session for testing",
    "tags": ["test", "example"],
    "data": "eJpNjj1Ow0AQRkXrUwwUKNRAueljYo8L0LzFNQvGByTv8w0dI0k"
  }'

# The "data" field accepts ONLY:
# - Base64-encoded string containing msgpack data
# - Automatically handles deflate decompression if present
# - Validates msgpack format integrity
# Note: No "visibility" field needed - sessions are readable by ID but require auth for creation
```

Expected response (201 Created):
```json
{
  "id": "generated_uuid",
  "type": "session",
  "visibility": "private",
  "created_at": "2024-03-21T10:00:00Z",
  "updated_at": "2024-03-21T10:00:00Z",
  "creator": {
    "id": "user_id",
    "name": "Test User",
    "email": "test@example.com"
  },
  "title": "Example Session",
  "description": "This is a test session",
  "tags": [],
  "version": "1.0"
}
```

#### List Sessions

```bash
# List all your sessions (requires authentication - only shows your sessions)
curl http://localhost:5000/api/session \
  -H "Authorization: Bearer your_token_here"
```

Expected response (200 OK):
```json
[
  {
    "id": "session_uuid_1",
    "type": "session",
    "visibility": "private",
    "title": "Example Session 1",
    ...
  },
  {
    "id": "session_uuid_2",
    "type": "session",
    "visibility": "private",
    "title": "Example Session 2",
    ...
  }
]
```

#### Get Session Data

```bash
# Get session data (public access - no authentication required)
curl http://localhost:5000/api/session/session_uuid/data
```

Expected response (200 OK) - the actual data content:
```json
{
  "viewerState": {
    "camera": {
      "position": [0, 0, 100],
      "target": [0, 0, 0]
    },
    "molecules": [
      {
        "id": "mol1",
        "type": "protein",
        "representation": "cartoon"
      }
    ]
  }
}
```

#### Get Session Metadata Only

```bash
# Get session metadata (public access - no authentication required)
curl http://localhost:5000/api/session/session_uuid
```

Expected response (200 OK) - metadata only:
```json
{
  "id": "session_uuid",
  "type": "session", 
  "visibility": "private",
  "created_at": "2024-03-21T10:00:00Z",
  "updated_at": "2024-03-21T10:00:00Z",
  "creator": {
    "id": "user_id",
    "name": "Test User",
    "email": "test@example.com"
  },
  "title": "Example Session",
  "description": "This is a test session",
  "tags": [],
  "version": "1.0"
}
```

### 3. Story Management (Always Public)

#### Create a New Story

```bash
# Creating a story (always public, but requires authentication to create)
curl -X POST http://localhost:5000/api/story \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "filename": "example-story.mvsj",
    "title": "Example Story",
    "description": "This is a test story",
    "tags": ["test", "example"],
    "data": <contents of the .mvsj/.mvsx file>
  }'

# Note: No "visibility" field needed - stories are always public
```

Expected response (201 Created):
```json
{
  "id": "generated_uuid",
  "type": "story",
  "visibility": "public",
  "created_at": "2024-03-21T10:00:00Z",
  "updated_at": "2024-03-21T10:00:00Z",
  "creator": {
    "id": "user_id",
    "name": "Test User",
    "email": "test@example.com"
  },
  "title": "Example Story",
  "description": "This is a test story",
  "tags": [],
  "version": "1.0",
  "public_uri": "https://stories.molstar.org/api/story/generated_uuid"
}
```

#### List Stories

```bash
# List all stories (no authentication required - stories are always public)
curl http://localhost:5000/api/story
```

Expected response (200 OK):
```json
[
  {
    "id": "story_uuid_1",
    "type": "story",
    "visibility": "public",
    "title": "Example Story 1",
    "public_uri": "https://stories.molstar.org/api/story/story_uuid_1",
    ...
  },
  {
    "id": "story_uuid_2",
    "type": "story",
    "visibility": "public",
    "title": "Example Story 2",
    "public_uri": "https://stories.molstar.org/api/story/story_uuid_2",
    ...
  }
]
```

#### Get Story Data

```bash
# Get story data (no authentication required - stories are always public)
curl http://localhost:5000/api/story/story_uuid/data
```

Expected response (200 OK) - the actual data content:
```json
{
  "storyData": {
    "version": "1.0",
    "molecules": [
      {
        "id": "mol1",
        "type": "protein"
      }
    ]
  }
}
```

#### Get Story Metadata Only

```bash
# Get story metadata (no authentication required - stories are always public)
curl http://localhost:5000/api/story/story_uuid
```

Expected response (200 OK) - metadata only:
```json
{
  "id": "story_uuid",
  "type": "story",
  "visibility": "public",
  "created_at": "2024-03-21T10:00:00Z",
  "updated_at": "2024-03-21T10:00:00Z",
  "creator": {
    "id": "user_id",
    "name": "Test User",
    "email": "test@example.com"
  },
  "title": "Example Story",
  "description": "This is a test story",
  "tags": [],
  "version": "1.0",
  "public_uri": "https://stories.molstar.org/api/story/story_uuid"
}
```

### 4. Storage Management

#### List Buckets

```bash
curl http://localhost:5000/api/s3/buckets \
  -H "Authorization: Bearer your_token_here"
```

Expected response (200 OK):
```json
{
  "buckets": ["root"]
}
```

#### List Bucket Contents

```bash
# List all contents
curl http://localhost:5000/api/s3/list \
  -H "Authorization: Bearer your_token_here"

# List with prefix
curl "http://localhost:5000/api/s3/list?prefix=sessions" \
  -H "Authorization: Bearer your_token_here"
```

Expected response (200 OK):
```json
{
  "bucket": "root",
  "prefix": "sessions",
  "objects": [
    {
      "key": "user123/sessions/uuid1/metadata.json",
      "size": 512,
      "last_modified": "2024-03-21T10:00:00Z",
      "etag": "\"abc123\""
    },
    {
      "key": "user123/sessions/uuid1/data.mvstory",
      "size": 1024,
      "last_modified": "2024-03-21T10:00:00Z",
      "etag": "\"def456\""
    }
  ]
}
```

## Common Error Cases

### 1. Invalid File Extension

```bash
# Trying to create a session with wrong extension
curl -X POST http://localhost:5000/api/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "filename": "wrong-extension.doc",
    "title": "Test Session"
  }'
```

Expected response (400 Bad Request):
```json
{
  "message": "Session files must have .mvstory extension"
}
```

### 2. Invalid Content Format

```bash
# Trying to create a session with invalid msgpack data
curl -X POST http://localhost:5000/api/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "filename": "test-session.mvstory",
    "title": "Test Session",
    "data": "invalid_base64_data"
  }'
```

Expected response (400 Bad Request):
```json
{
  "message": "Invalid input data",
  "details": {
    "validation_errors": [
      {
        "loc": ["data"],
        "msg": "Invalid base64 encoding: Invalid base64-encoded string",
        "type": "value_error"
      }
    ]
  }
}
```

### 3. User Limit Exceeded

```bash
# Trying to create a session when user has reached the limit
curl -X POST http://localhost:5000/api/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "filename": "test-session.mvstory",
    "title": "Test Session",
    "data": "eJpNjj1Ow0AQRkXrUwwUKNRAueljYo8L0LzFNQvGByTv8w0dI0k"
  }'
```

Expected response (429 Too Many Requests):
```json
{
  "message": "Session limit reached. You have 100 sessions (limit: 100). Please delete some sessions before creating new ones.",
  "details": {
    "current_count": 100,
    "limit": 100,
    "object_type": "session"
  }
}
```

### 4. Invalid Token

```bash
# Invalid or expired token
curl http://localhost:5000/api/session \
  -H "Authorization: Bearer invalid_token"
```

Expected response (401 Unauthorized):
```json
{
  "message": "Invalid token"
}
```

### 5. Session Modification Without Authentication

```bash
# Trying to update a session without token (should fail)
curl -X PUT http://localhost:5000/api/session/session_uuid \
  -H "Content-Type: application/json" \
  -d '{"title": "New Title"}'
```

Expected response (401 Unauthorized):
```json
{
  "message": "Authentication required"
}
```

## Testing with Python

Here's a Python script example for testing the simplified API:

```python
import requests
import json

BASE_URL = "http://localhost:5000"
TOKEN = "your_token_here"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Create a session (always private)
session_data = {
    "filename": "test-session.mvstory",
    "title": "Test Session",
    "description": "Created via Python test script",
    "tags": ["test", "python"],
    "data": "eJpNjj1Ow0AQRkXrUwwUKNRAueljYo8L0LzFNQvGByTv8w0dI0k"
}

response = requests.post(
    f"{BASE_URL}/api/session",
    headers=headers,
    json=session_data
)
print("Create Session Response:", response.status_code)
print(json.dumps(response.json(), indent=2))

# List sessions (requires auth)
response = requests.get(
    f"{BASE_URL}/api/session",
    headers=headers
)
print("\nList Sessions Response:", response.status_code)
print(json.dumps(response.json(), indent=2))

# Create a story (always public)
story_data = {
    "filename": "test-story.mvsj",
    "title": "Test Story",
    "description": "Created via Python test script",
    "tags": ["test", "python"],
    "data": {
        "storyData": {
            "version": "1.0",
            "molecules": []
        }
    }
}

response = requests.post(
    f"{BASE_URL}/api/story",
    headers=headers,
    json=story_data
)
print("\nCreate Story Response:", response.status_code)
print(json.dumps(response.json(), indent=2))

# List stories (no auth required)
response = requests.get(f"{BASE_URL}/api/story")
print("\nList Stories Response:", response.status_code)
print(json.dumps(response.json(), indent=2))

# Get story data (no auth required)
story_id = "your_story_id_here"  # Replace with actual story ID
response = requests.get(f"{BASE_URL}/api/story/{story_id}/data")
print(f"\nGet Story Data Response:", response.status_code)
if response.status_code == 200:
    print(json.dumps(response.json(), indent=2))

# Get session data (no auth required - public read access)
session_id = "your_session_id_here"  # Replace with actual session ID
response = requests.get(f"{BASE_URL}/api/session/{session_id}/data")
print(f"\nGet Session Data Response:", response.status_code)
if response.status_code == 200:
    print(json.dumps(response.json(), indent=2))
```

## Summary of Changes

The simplified API structure:

1. **Sessions**: Publicly readable by ID, require authentication for creation/modification
2. **Stories**: Always public, no authentication required for read access
3. **No visibility field**: Removed from all input schemas
4. **Simplified URIs**: No `/public/` prefix needed
5. **Cleaner storage structure**: No public/private subdirectories
6. **Simplified routes**: Removed separate public endpoint handlers
7. **Renamed from states**: All state/states references changed to story/stories

### Recent Changes (Session Public Read Access)

- **Session GET endpoints** (`/api/session/{id}` and `/api/session/{id}/data`) now work without authentication
- **Session creation/modification** (POST, PUT, DELETE) still require authentication and ownership
- Sessions can now be shared by simply providing the session ID - no authentication needed to view
- This enables public sharing of molecular viewer sessions while maintaining creator control
