# Examples

## Full Examples
- **exosome** - Comprehensive exploration of exosome structure with detailed annotations and scientific references
- **motm-01** - Molecule of the Month feature showcasing a complete structural story
- **npc-basket** - Nuclear pore complex basket structure example
- **tbp** - TATA-binding protein structural exploration
- **terms-of-entrapment** - Educational example demonstrating structural trapping concepts

## Learning Examples
- **learning-localfile** - Basic example demonstrating how to load structures from local files
- **learning-simple** - Minimal starter example for learning the MVS fundamentals
- **learning-simple-inline** - Simple example with inline structure data for quick prototyping
- **learning-molviewspec-basics** - Introduction to MolViewSpec basics and configuration
- **learning-mvs-features** - Walkthrough of core MVS features and capabilities

## Test Data
- **test-mvstory** - Test data and fixtures for MVS development and testing

## Running Examples

To serve any example with live reload during development:

```bash
cd ../..  # Navigate to cli directory
./mvs watch examples/exosome
# Or build an example to a specific format:
./mvs build examples/exosome -o exosome.html
./mvs build examples/learning-simple -o simple.mvstory
./mvs build examples/test-mvstory -o test.json
```
