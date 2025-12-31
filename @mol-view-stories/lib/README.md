# mol-view-stories library

Core, reusable classes for creating and distributing Molecular Stories

## Features

- **StoryManager**: Create, manage, and export molecular visualization stories
- **Monaco Editor Utilities**: Framework-agnostic utilities for configuring
  Monaco Editor
- **MVS Type Definitions**: TypeScript definitions for Mol* viewer API code
  completion

## Monaco Editor Utilities

The library provides framework-agnostic utilities for configuring Monaco Editor
for MVS development:

### setupMonacoCodeCompletion

Configures Monaco for MVS JavaScript code completion with TypeScript
IntelliSense.

```typescript
import { MVSTypes, setupMonacoCodeCompletion } from "@mol-view-stories/lib";

// In your Monaco onMount callback
setupMonacoCodeCompletion(monaco, MVSTypes, commonCode);
```

### clearMonacoEditHistory

Clears Monaco editor's undo/redo history (useful when switching scenes).

```typescript
import { clearMonacoEditHistory } from "@mol-view-stories/lib";

// When switching scenes
useEffect(() => {
  clearMonacoEditHistory(editorRef.current);
}, [activeSceneId]);
```

### MVSTypes

Auto-generated TypeScript definitions for the MVS API, suitable for Monaco
IntelliSense.

```typescript
import { MVSTypes } from "@mol-view-stories/lib";

// Add to Monaco as extra library
monaco.languages.typescript.javascriptDefaults.addExtraLib(
  MVSTypes,
  "ts:mvs.d.ts",
);
```

### Default Editor Options

Pre-configured options for code and markdown editors:

```typescript
import {
  defaultCodeEditorOptions,
  defaultMarkdownEditorOptions,
} from "@mol-view-stories/lib";

// Use in Monaco Editor
<Editor options={defaultCodeEditorOptions} />;
```

## Building

The library uses Deno for building and includes a build step that generates MVS
type definitions:

```bash
deno task build      # Generates MVS types and type-checks
deno task mvs-types  # Generate MVS types only
deno task check      # Type-check only
```
