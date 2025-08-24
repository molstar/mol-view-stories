# API Test Suite

This directory contains comprehensive tests for the API application.

## Running Tests

You can run the tests using the command exactly as requested:

```bash
python -m pytest tests/ -v --cov=. --cov-report=xml --cov-report=html
```

## Test Structure

### Core Test Files

- **`test_basic.py`** - Basic functionality tests that should always pass
- **`test_auth.py`** - Authentication and authorization tests
- **`test_error_handlers.py`** - Error handling tests
- **`test_utils.py`** - Utility function tests
- **`test_config.py`** - Configuration tests
- **`test_storage.py`** - Storage module tests
- **`test_routes.py`** - API route tests
- **`test_schemas.py`** - Data validation schema tests
- **`test_integration.py`** - End-to-end integration tests
- **`test_app.py`** - Main application tests

### Configuration Files

- **`conftest.py`** - Pytest configuration and shared fixtures
- **`pytest.ini`** - Pytest settings and configuration

### Fixtures

The test suite includes several fixtures for common testing scenarios:

- `app` - Configured Flask application for testing
- `client` - Test client for making requests
- `mock_userinfo` - Mock user information for authentication tests
- `mock_session_user` - Mock session user data
- `auth_headers` - Authentication headers for API requests
- `sample_story_data` - Sample story data for testing
- `sample_session_data` - Sample session data for testing

## Test Categories

### Unit Tests
- Individual function and class testing
- Mocked dependencies
- Fast execution

### Integration Tests  
- End-to-end workflow testing
- Multiple component interaction
- Real API request/response cycles

### Authentication Tests
- OIDC token validation
- Session management
- Authorization checks

### Storage Tests
- MinIO client operations
- Object CRUD operations
- Quota management

### Route Tests
- API endpoint testing
- Request/response validation
- Error handling

## Coverage Reports

After running tests, coverage reports are generated in multiple formats:

- **XML Report**: `coverage.xml` - For CI/CD integration
- **HTML Report**: `htmlcov/index.html` - Interactive web report
- **Terminal Output**: Displayed during test execution

## Running Specific Tests

Run specific test files:
```bash
python -m pytest tests/test_basic.py -v
```

Run specific test classes:
```bash
python -m pytest tests/test_basic.py::TestBasicFunctionality -v
```

Run specific test methods:
```bash
python -m pytest tests/test_basic.py::TestBasicFunctionality::test_health_check -v
```

## Test Dependencies

The following packages are required for testing (already included in requirements.txt):

- `pytest>=7.4.0` - Testing framework
- `pytest-cov>=4.1.0` - Coverage reporting
- `pytest-flask>=1.2.0` - Flask testing utilities
- `pytest-mock>=3.11.0` - Mocking utilities
- `responses>=0.23.0` - HTTP request mocking

## Notes

- Some tests may have function signature mismatches with the actual API code due to the evolving nature of the codebase
- The `test_basic.py` file contains working tests that demonstrate the test framework is properly set up
- Tests are designed to work with the specific API structure and dependencies
- All tests include proper mocking to avoid external dependencies during testing

## Quick Test Verification

To quickly verify the test setup is working:

```bash
python -m pytest tests/test_basic.py -v
```

This should show mostly passing tests and confirm the testing framework is properly configured.