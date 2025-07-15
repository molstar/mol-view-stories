## MolViewStories

A webapp to create beautiful, interactive molecular stories.

## Environment Setup

This project requires several environment variables to be set up for authentication with Life Science AAI:

1. Create a `.env.local` file in the project root with the following variables:
```env
NEXT_PUBLIC_OIDC_AUTHORITY=<link to the IdP>
NEXT_PUBLIC_OIDC_CLIENT_ID=<client ID>
NEXT_PUBLIC_API_BASE_URL=<backend URL>
```
2. Run
```bash
# dev server on http://localhost:3000
npm run dev
```

## Authentication Flow

MolViewStories uses OAuth2 with PKCE for secure authentication via Life Science AAI.

### User Experience

**Login Process:**
1. User clicks "Log in with Life Science AAI" 
2. Current work (story, scenes, view state) is automatically saved
3. User is redirected to Life Science AAI for authentication
4. After login, user returns to exactly where they left off with all work restored

**State Preservation:**
- Complete story state (title, metadata, all scenes)
- Current view and editor selections
- Scene content (code, descriptions, settings)
- Application position (builder, file operations, etc.)

### Session Management

- Sessions last 8-12 hours (Life Science AAI default)
- Tokens stored in browser sessionStorage
- Automatic token refresh when possible
- Login status synchronized across browser tabs
- Sessions expire automatically when tokens become invalid

### Logout

- **Manual:** User avatar → "Log Out" clears all tokens immediately
- **Automatic:** Expired sessions are detected and cleared automatically
- User can continue with public features after logout

### Feature Access

**Requires Authentication:** Cloud saves, personal library, sharing, CRUD operations  
**Public Access:** Local editing, story builder, previews, exports, examples
