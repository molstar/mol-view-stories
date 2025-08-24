#!/usr/bin/env python3
"""Test runner script for the API."""
import os
import subprocess
import sys


def run_command(cmd, description):
    """Run a command and print the result."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print(f"{'='*60}")

    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running {description}:")
        print(f"Return code: {e.returncode}")
        print(f"STDOUT: {e.stdout}")
        print(f"STDERR: {e.stderr}")
        return False


def main():
    """Run all tests with coverage."""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    print("Starting API test suite...")

    # Install dependencies
    if not run_command(
        [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
        "Installing dependencies",
    ):
        return 1

    # Run tests with coverage
    test_cmd = [
        sys.executable,
        "-m",
        "pytest",
        "tests/",
        "-v",
        "--cov=.",
        "--cov-report=xml",
        "--cov-report=html",
        "--cov-report=term-missing",
        "--tb=short",
    ]

    if not run_command(test_cmd, "Running tests with coverage"):
        return 1

    print(f"\n{'='*60}")
    print("✅ All tests completed successfully!")
    print("Coverage reports generated:")
    print("  - XML: coverage.xml")
    print("  - HTML: htmlcov/index.html")
    print("  - Terminal output above")
    print(f"{'='*60}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
