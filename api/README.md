# Mol-View Stories Backend

Backend service for storing and managing molecular visualization stories and states.

## Overview

This service provides a REST API for storing and retrieving molecular visualization sessions and states using MinIO S3-compatible storage. It supports both public and private storage with proper metadata management and file format validation.

## Security Features

### Field Validation & Data Integrity

The backend implements strict field validation to prevent users from storing arbitrary data through direct API calls:

#### ✅ **Pydantic Models with `extra="forbid"`**
- All upload/update endpoints use Pydantic models with `extra="forbid"` 
- This **prevents arbitrary fields** from being accepted in API requests
- Only supported fields matching the frontend `BaseItem` interface are allowed:
  - `filename` (required)
  - `visibility` ("public" or "private")
  - `title` (max 200 chars)
  - `description` (max 2000 chars) 
  - `tags` (max 20 tags, 50 chars each)
  - `data` (actual content payload)

#### ✅ **Strict Input Validation**
- **Session files**: Must have `.mvstory` extension
- **State files**: Must have `.mvsj` or `.mvsx` extension
- **Field length limits**: Enforced on title, description, tags
- **Type validation**: All fields must match expected types
- **Required fields**: Filename is mandatory

#### ✅ **Content Format Validation**
To ensure data integrity and proper format compliance:
- **Session data**: Only accepts base64-encoded strings containing msgpack data with optional deflate compression
- **MVSJ files**: Must contain valid JSON data
- **MVSX files**: Must be valid zip-compatible structure with index.mvsj
- **Content validation**: Occurs during API request processing
- **Format enforcement**: Prevents storage of malformed molecular data

#### ✅ **User Limit Validation**
To prevent resource abuse and ensure fair usage:
- **Sessions per user**: 100 maximum (configurable via `MAX_SESSIONS_PER_USER` env var)
- **States per user**: 100 maximum (configurable via `MAX_STATES_PER_USER` env var)
- Limit validation occurs before creating new sessions/states
- Users must delete existing items before creating new ones when at limit

#### ✅ **Server-Generated Metadata**
User input **cannot override** server-generated fields:
- `id` - Auto-generated UUID
- `type` - Determined by endpoint
- `created_at` / `updated_at` - Server timestamps
- `creator` - From authenticated user token
- `version` - Server-managed

#### ✅ **Update Endpoints (Planned)**
- `PUT /api/session/<id>` - Update session with validation
- `PUT /api/state/<id>` - Update state with validation
- Uses `BaseItemUpdate` model that prevents modification of immutable fields

### Example: Blocked Arbitrary Data

❌ **This would be REJECTED:**
```json
{
  "filename": "test.js",
  "title": "My Session",
  "malicious_field": "arbitrary_data",
  "backdoor": {"sql": "DROP TABLE users"}
}
```

❌ **This would be REJECTED (user limit exceeded):**
```json
{
  "filename": "test.js",
  "title": "My Session",
  "data": {
    "viewerState": {...}
  }
}
```
Response: `429 Too Many Requests - Session limit reached. You have 100 sessions (limit: 100). Please delete some sessions before creating new ones.`

✅ **This would be ACCEPTED:**
```json
{
  "filename": "test.js", 
  "title": "My Session",
  "description": "A valid session",
  "visibility": "private",
  "tags": ["molecular", "protein"],
  "data": {
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
}
```

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

Key dependencies include:
- **Flask** for the web framework
- **MinIO** for S3-compatible storage
- **Pydantic** for data validation
- **msgpack** for efficient session data serialization
- **jsonschema** for metadata validation
- **Authlib** for OIDC authentication
- **requests** and **flask-cors** for API communication
- **boto3** and **botocore** for AWS S3 compatibility
- **python-jose** for JWT token handling
- **gunicorn** for production deployment

2. Configure environment variables:
```bash
# MinIO Configuration (Required)
MINIO_ENDPOINT=your-minio-endpoint
MINIO_BUCKET=root
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key

# Flask Configuration (Required)
OIDC_USERINFO_URL=https://login.aai.lifescience-ri.eu/oidc/userinfo
FRONTEND_URL=https://molstar.org/mol-view-stories/

# Application Configuration (Optional - defaults shown)
BASE_URL=https://stories.molstar.org
ENVIRONMENT=production
MAX_SESSIONS_PER_USER=100
MAX_STATES_PER_USER=100
MAX_UPLOAD_SIZE_MB=50
```

## Storage Structure

The storage system uses a user-centric hierarchical structure:

```
root/
└── {user_id}/
    ├── sessions/
    │   └── {session_id}/
    │       ├── data.mvstory
    │       └── metadata.json
    └── states/
        └── {state_id}/
            ├── data.mvsj
            └── metadata.json
```

Each object (session or state) contains:
- `metadata.json`: Object metadata
- `data.{ext}`: Actual object data

## File Formats

### Sessions
- Must use `.mvstory` extension
- Content must be msgpack-serializable
- Example: `my-session.mvstory`

### States
- Must use either `.mvsj` or `.mvsx` extension
- `.mvsj` files must contain valid JSON data
- `.mvsx` files must be valid zip format with index.mvsj
- Example: `my-state.mvsj` or `my-state.mvsx`

## API Endpoints

### Create Objects
- `POST /api/session` - Create new session (with validation)
- `POST /api/state` - Create new state (with validation)

### Update Objects  
- `PUT /api/session/<id>` - Update existing session (with validation)
- `PUT /api/state/<id>` - Update existing state (with validation)

### List Objects
- `GET /api/session` - List sessions
- `GET /api/state` - List states
- `GET /api/public/sessions` - List all public sessions
- `GET /api/public/states` - List all public states

### Public Access
- `GET /api/public/state/<id>` - Get public state data

## Metadata Schema

All objects (sessions and states) conform to this metadata schema:

```json
{
    "id": "unique_uuid",
    "type": "session|state", 
    "visibility": "public|private",
    "created_at": "ISO8601_timestamp",
    "updated_at": "ISO8601_timestamp",
    "creator": {
        "id": "user_id",
        "name": "user_name", 
        "email": "user_email"
    },
    "title": "object_title",
    "description": "object_description",
    "tags": ["tag1", "tag2"],
    "version": "1.0"
}
```

**Note:** This metadata structure matches the frontend `BaseItem` interface and is strictly enforced to prevent arbitrary data storage.