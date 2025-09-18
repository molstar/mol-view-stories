# Change Log
All notable changes to this project will be documented in this file, following the suggestions of [Keep a CHANGELOG](http://keepachangelog.com/). This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

### Added
- **Backend API Service**: REST API backend for storing and managing molecular visualization stories and states
  - Flask-based service with Pydantic validation and MinIO S3 storage
  - OIDC authentication, session/state management with metadata handling
  - File format validation for `.mvstory`, `.mvsj`, and `.mvsx` files
  - User quota management (100 sessions/states per user)
  - Docker containerization with production and deployment configuration
  - CI/CD pipeline for development and production deployment
  - Comprehensive test suite with pytest coverage
- **Health Monitoring System**: Automated monitoring of dev/prod API services with email alerts on status changes and UI status indicator
- `Vec3`, `Mat3`, `Mat4`, `Quat`, `Euler` accessible in the code editor
- Self-hosting support (in Export and Publish)

### Changed
- **Session Upload Optimization**: Replaced base64 encoding with native FormData uploads
  - Reduced payload size by ~33% (eliminated base64 overhead)
  - Simplified frontend/backend data handling with direct binary processing
  - Maintained backward compatibility for existing sessions and JSON updates
  - Session creation now requires FormData format (JSON creation deprecated)
- **Story Format Enhancement**: Extended stories to include interactive session data
  - Stories now combine visualization content (.mvsj/.mvsx) with session state (.mvstory)
  - **BREAKING**: Story creation now requires FormData format only (JSON deprecated)
  - New FormData structure: `['mvsx']` OR `['mvsj']`, `['session']`, metadata fields  
  - Added public session access endpoint `/api/story/{id}/session-data`
  - Enhanced PublishedStoryModal with session viewer integration
  - Maintained full backward compatibility for existing story access (GET operations)
  - .mvsx files now use direct binary upload instead of base64 encoding
- **Assets**:
  - Ability to upload additional formats
  - Add Download button
- **Scene Markdown**:
  - Properly render Mol* specific extensions and locally uploaded assets
  - Asset list and docs link
- **Scene editor**:
  - Mol* log under viewer

### Fixed
- **Auth Page**: Fixed infinite loop when no code or error is present

## [v1.0.0]

- Initial release