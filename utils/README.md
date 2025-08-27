# Content Processing Utilities - TDD Approach

This directory contains utility functions for processing HTML content and converting it to clean markdown. We're following Test-Driven Development (TDD) principles.

## Files

- **`contentProcessor.js`** - Utility functions (implementations to be added)
- **`../test/contentProcessor.test.js`** - Comprehensive unit tests
- **`../test/testSetup.js`** - Test environment configuration

## Testing Approach

### 1. Tests First (Red Phase)
All tests are written before implementation. They will initially fail because the functions are empty.

### 2. Implementation (Green Phase)
Implement each function to make all tests pass.

### 3. Refactoring (Refactor Phase)
Clean up the code while keeping tests green.

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

## Test Coverage

The tests cover:

### `createMockElement`
- Basic element creation
- Attributes handling
- Text content
- Child elements

### `isElementVisible`
- Null/undefined handling
- CSS display properties
- CSS visibility properties
- CSS opacity
- Hidden attribute
- Element dimensions
- CSS classes

### `hasRealContent`
- Null/undefined handling
- Depth safety limit
- Text content detection
- Whitespace handling
- Child content analysis
- Deep nesting scenarios
- Empty container detection

### `shouldProcessElement`
- Null/undefined handling
- Visibility checks
- Content validation
- Various content types (text, images, links, lists, headings)

### `removeRepetitiveContent`
- Null/undefined handling
- Empty string handling
- Duplicate line removal
- Whitespace preservation
- Complex patterns

### `cleanupMarkdown`
- Null/undefined handling
- Whitespace normalization
- Newline limiting
- Heading spacing
- List spacing
- Number/text spacing
- Complex cleanup scenarios

## Current Status

- ✅ **Tests Written**: All test cases are defined
- ❌ **Functions Implemented**: Functions are empty stubs
- ❌ **Tests Passing**: Tests will fail until implementation

## Next Steps

1. **Run tests** to see them fail (Red phase)
2. **Implement functions** one by one to make tests pass (Green phase)
3. **Refactor code** while keeping tests green (Refactor phase)
4. **Integrate** working utilities into the content script

## Implementation Order

1. `createMockElement` - Foundation for testing
2. `isElementVisible` - Basic visibility detection
3. `hasRealContent` - Content analysis
4. `shouldProcessElement` - Processing decision logic
5. `removeRepetitiveContent` - Content cleanup
6. `cleanupMarkdown` - Markdown formatting

Once all tests pass, we'll have robust, well-tested utility functions that can be integrated into the main content script to solve the empty container and whitespace issues.
