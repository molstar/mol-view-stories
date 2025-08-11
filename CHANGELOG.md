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

## [v1.0.0]

- Initial release