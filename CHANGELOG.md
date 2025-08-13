# Change Log
All notable changes to this project will be documented in this file, following the suggestions of [Keep a CHANGELOG](http://keepachangelog.com/). This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

### Added
- **Backend API Service**: REST API backend for storing and managing molecular visualization stories and states
  - Flask-based service with Pydantic validation and MinIO S3 storage
  - OIDC authentication, session/state management with metadata handling
  - File format validation for `.mvstory`, `.mvsj`, and `.mvsx` files
  - User quota management (100 sessions/states per user)
  - Docker containerization with production deployment configuration
  - Comprehensive test suite with pytest coverage
- `Vec3`, `Mat3`, `Mat4`, `Quat` accessible in the code editor

### Changed
- **Session Upload Optimization**: Replaced base64 encoding with native FormData uploads
  - Reduced payload size by ~33% (eliminated base64 overhead)
  - Simplified frontend/backend data handling with direct binary processing
  - Maintained backward compatibility for existing sessions and JSON updates
  - Session creation now requires FormData format (JSON creation deprecated)

## [v1.0.0]

- Initial release