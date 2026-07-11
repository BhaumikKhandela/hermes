<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Completed: Notion Production Node

A full production Notion workflow node is implemented. Five operations, three content modes, 2026-03-11 API, rich text visual blocks, Markdown native API, pagination, content positioning.

### Architecture

```
src/lib/workflow-tools/tools/notion/          ← Backend factory modules
├── types.ts    - VisualBlock, VisualRichText, NotionContent (discriminated union), BlockDefinition, structured results
├── schema.ts   - partialNotionSchema with all fields (dataSourceId, pageId, blockId, parentId, parentType, properties, content 3-mode, filter, sorts, pagination, position, retrieveFormat)
├── client.ts   - createNotionClient() with notionVersion: "2026-03-11"
├── registry.ts - 12 block definitions (paragraph, h1-h3, bulleted/numbered list, to-do, quote, toggle, divider, code, callout)
├── convert.ts  - visualBlocksToNotionJson, tryConvertNotionJsonToVisual (lossy-safe), visualBlocksToMarkdown
├── pagination.ts - queryWithPagination (returnAll with maxItems ceiling) + chunkArray (100-block limit for append)
├── tree.ts     - findBlockById, moveBlock, duplicateBlock, deleteBlock, indentBlock, outdentBlock (tree-aware)
├── handler.ts  - 5 action handlers (query - paginated, create - 3 content modes, update, retrieve - metadata/markdown/blocks, append - markdown vs block/chunked/positioned). All return structured {action, data}
└── index.ts    - exports createNotionTool factory + partialNotionSchema

src/components/workflow/panel/notion/          ← UI panel modules
├── NotionConfig.tsx         - Main panel: credential + 5-action grid + conditional fields per action + Save/Cancel
├── NotionContentEditor.tsx  - 3-mode editor (Visual/Markdown/JSON) with per-mode drafts, lossy conversion warnings
├── VisualBlockEditor.tsx    - Drag-and-drop block list + Add Block dropdown (12 types)
├── BlockCard.tsx            - Block card: drag handle, rich text input, annotation toolbar (B/I/U/<>/S), type-specific fields, ⋮ menu
├── MarkdownEditor.tsx       - Markdown textarea
├── JsonEditor.tsx           - Raw block JSON textarea with validation
├── ModeWarningDialog.tsx    - Lossy conversion warning modal
└── useJsonValidation.ts     - Hook: live JSON validation with expression ({{}}) awareness, line/column errors
```

### Key patterns
- Credential: `"notion"` provider, apiKey auth (Internal Integration Secret `ntn_...`)
- Notion SDK: `@notionhq/client@^5.12.0` with `notionVersion: "2026-03-11"`
- Content modes: `visual | markdown | json` as discriminated union (single source of truth per mode)
- Visual↔JSON: lossy conversion with user-facing warning dialog listing unsupported features
- Markdown → Visual: explicitly blocked with warning (not lossless)
- Append: chunks at 100 blocks, sequential `for...of`, supports `start | end | after_block` position
- Query: supports `returnAll` with auto-pagination up to `maxItems` (default 10000)
- Retrieve: supports `metadata | markdown | blocks` format selection
- All handlers return structured `{ action, data }` objects (not human strings)
- Panel JSON fields use `useJsonValidation` hook for live validation with expression awareness
- Tooltips use project's `Tooltip`/`TooltipContent`/`TooltipTrigger` from `@/components/ui/tooltip`
- Block editor: drag-and-drop + tree operations (move, duplicate, delete, indent, outdent)

### Credential registration
- `src/lib/credentials/types.ts` — `"notion"` added to CredentialProviders
- `src/lib/credentials/credentialSchemas/index.ts` — notion apiKey schema added

### What's next
- No outstanding tasks. Notion node is production-ready with all planned features.
