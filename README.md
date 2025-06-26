## MolViewStories

A webapp to create beautiful, interactive molecular stories.

## Environment Setup

This project requires several environment variables to be set up for authentication with Life Science AAI:

1. Create a `.env.local` file in the project root with the following variables:
```env
NEXT_PUBLIC_OIDC_AUTHORITY=<link to the IdP>
NEXT_PUBLIC_OIDC_CLIENT_ID=<client ID>
```
2. Run
```bash
# dev server on http://localhost:3000
npm run dev
```
