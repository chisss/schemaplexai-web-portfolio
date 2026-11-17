# Semantic Catalog UI Design

## Design Goal

Provide a dense, predictable governance workspace where data teams can build a small ontology without exposing RDF storage details. The interface must support repeated editing, validation, and publishing on desktop while keeping the same workflow usable on a narrow screen.

## Chosen Approach

The module uses a catalog plus workbench structure.

- The catalog is a server-paginated table because model governance depends on comparison, filtering, and repeated actions.
- The workbench uses a node directory, unframed graph canvas, inspector, and issue panel because those four surfaces correspond to finding, understanding, editing, and validating ontology elements.
- AntV G6 uses a left-to-right `antv-dagre` layout. It produces stable separation for directed semantic relationships and avoids the convergence and overlap risk of a force layout.
- Mobile moves the node directory and inspector into drawers. The graph and validation results remain the primary page surface.

Card dashboards and a raw RDF editor were considered. Cards make comparison slower at scale, while raw RDF exposes tenant graph identifiers and bypasses the structured API constraints. Both were rejected.

## State And Data Flow

TanStack Query owns remote state. Page-local state is limited to filters, the selected version, graph depth, focus node, selected node, the latest validation report, and drawer visibility.

```text
catalog filter -> GET /semantic/models -> paginated table
model route -> model + versions -> selected version
selected version + focus/depth -> bounded graph -> G6 canvas
selected node -> structured PUT -> invalidate version and graph
validate -> issue panel -> focus node
publish -> invalidate model, versions, and active version
```

The requested version can be carried in the URL query string. If it is absent or stale, the workbench chooses an editable draft, then the active version, then the first available version.

## Key Decisions

### Structured commands only

The browser sends DTOs defined in `src/types/semantic.ts`. It never sends `tenantId`, named graph IRIs, SPARQL, or Turtle. The authenticated request interceptor supplies tenant identity, and the server owns graph naming and validation.

### Bounded graph reads

Graph requests use depth 1 or 2 and a maximum page size of 500. The UI shows a truncation notice when the response reports more nodes. This keeps layout cost and memory bounded.

### Optimistic concurrency

Node edits, validation, and publishing carry `expectedRevision`. A failed mutation asks the user to refresh instead of silently overwriting a newer version.

### Version-aware editing

Only `draft` and `invalid` versions are editable. Published and archived versions keep the directory, graph, and inspector visible in read-only mode so users can inspect production semantics.

### Validation before activation

Validation issues remain in a fixed lower panel and can focus their related graph node. Publishing is still enforced by the backend, which performs SHACL validation and bounded inference before activation.

### Responsive interaction

At widths below 1024px, side panels become drawers. Fixed graph and toolbar dimensions prevent controls or dynamic labels from resizing the workspace. At mobile width, action buttons wrap without hiding validation or publish commands.

## Error And Empty States

- Catalog and workbench bootstrap failures render retry actions.
- A model without versions offers draft creation.
- An empty graph keeps search and depth controls available and renders a clear empty state.
- Failed mutations preserve the current form and report a refresh-oriented message.
- Production code does not include demo data or silently fall back to local storage.

## Accessibility

Buttons keep visible labels or accessible names. Node and issue collections use list semantics, graph controls have tooltips, status does not rely on color alone, and forms use explicit labels. Colors use the application theme variables and Ant Design semantic states.

## Known Limitations

- Phase 1 assumes the backend HTTP controllers implement the contract in `src/api/semantic.ts`.
- Graph creation and relationship editing are not yet exposed; this delivery edits metadata and mappings for nodes returned by the backend.
- Validation results are page-local until the backend returns a persisted report with version details.
- Natural-language query planning and result visualization are Phase 2 work.

## Change History

### 2026-09-17 - Phase 1 catalog and ontology workbench

**Change**: Replaced the model and workbench placeholders with paginated catalog, versioned G6 workbench, responsive drawers, validation issue navigation, and publish actions.

**Reason**: Give administrators a usable governance surface over the Phase 1 semantic model APIs.

**Impact**: Changes the two semantic model routes, route labels, bilingual copy, and semantic module documentation. The semantic query route remains a Phase 2 placeholder.
