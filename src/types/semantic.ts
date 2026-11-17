export type SemanticModelStatus = 'active' | 'archived';
export type SemanticVersionStatus = 'draft' | 'validating' | 'invalid' | 'published' | 'archived';
export type SemanticNodeKind = 'concept' | 'property';
export type SemanticMappingKind = 'table' | 'column' | 'collection' | 'field';
export type SchemaScanStatus = 'scanning' | 'completed' | 'partial' | 'failed';
export type SemanticValidationSeverity = 'info' | 'warning' | 'error';

export interface SemanticModel {
  id: string;
  name: string;
  domain: string;
  description?: string;
  status: SemanticModelStatus;
  activeVersionId?: string;
  activeVersionNo?: number;
  mappingCoverage?: number;
  validationStatus?: SemanticVersionStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface SemanticModelQueryDTO {
  page?: number;
  size?: number;
  keyword?: string;
  domain?: string;
  status?: SemanticModelStatus;
}

export interface SemanticModelCreateDTO {
  name: string;
  domain: string;
  description?: string;
}

export interface SemanticModelUpdateDTO extends SemanticModelCreateDTO {
  expectedRevision: number;
}

export interface SemanticVersion {
  id: string;
  modelId: string;
  versionNo: number;
  status: SemanticVersionStatus;
  sourceSnapshotId?: string;
  checksum?: string;
  tripleCount: number;
  validationReport?: string;
  revision: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SemanticVersionCreateDTO {
  sourceSnapshotId?: string;
}

export interface SemanticGraphQueryDTO {
  focusNodeId?: string;
  keyword?: string;
  nodeKind?: SemanticNodeKind;
  depth?: 1 | 2;
  page?: number;
  size?: number;
}

export interface SemanticGraphNode {
  id: string;
  iri: string;
  name: string;
  label?: string;
  description?: string;
  kind: SemanticNodeKind;
  synonyms: string[];
  dataType?: string;
  required?: boolean;
  mapping?: SemanticPhysicalMapping;
}

export interface SemanticGraphEdge {
  id: string;
  source: string;
  target: string;
  predicate: string;
  label?: string;
  inferred?: boolean;
}

export interface SemanticGraphPage {
  nodes: SemanticGraphNode[];
  edges: SemanticGraphEdge[];
  totalNodes: number;
  hasMore: boolean;
  focusNodeId?: string;
}

export interface SemanticNodeUpdateDTO {
  name: string;
  label?: string;
  description?: string;
  synonyms?: string[];
  dataType?: string;
  required?: boolean;
  mapping?: SemanticPhysicalMapping;
  expectedRevision: number;
}

export interface SemanticNodeUpdateResult {
  versionId: string;
  revision: number;
  node: SemanticGraphNode;
}

export interface SemanticPhysicalMapping {
  id?: string;
  sourceId: string;
  semanticIri: string;
  physicalObject: string;
  physicalField?: string;
  mappingKind: SemanticMappingKind;
}

export interface SchemaSnapshot {
  id: string;
  sourceId: string;
  sourceName?: string;
  databaseType: string;
  fingerprint?: string;
  status: SchemaScanStatus;
  objectCount: number;
  fieldCount: number;
  driftDetected?: boolean;
  warningCount?: number;
  errorMessage?: string;
  scannedAt?: string;
  createdAt: string;
}

export interface SchemaScanDTO {
  catalog?: string;
  schema?: string;
  includeObjects?: string[];
}

export interface SemanticValidationIssue {
  code: string;
  severity: SemanticValidationSeverity;
  message: string;
  nodeId?: string;
  semanticIri?: string;
  path?: string;
}

export interface SemanticValidationResult {
  valid: boolean;
  versionId: string;
  revision: number;
  issues: SemanticValidationIssue[];
  validatedAt: string;
}

export interface SemanticVersionActionDTO {
  expectedRevision: number;
}

export interface SemanticPublishResult {
  modelId: string;
  version: SemanticVersion;
  activated: boolean;
}

export type SemanticQueryInterpretationStatus = 'READY' | 'CLARIFICATION' | 'REJECTED';

export interface SemanticQueryInterpretRequest {
  question: string;
  semanticVersionId: string;
  sourceId: string;
  context?: string;
}

export interface SemanticQueryMetric {
  iri: string;
  alias: string;
  aggregation: string;
  physicalObject: string;
  physicalField: string;
}

export interface SemanticQueryDimension {
  iri: string;
  alias: string;
  timeGrain?: string;
  physicalObject: string;
  physicalField: string;
}

export interface SemanticQueryFilter {
  iri: string;
  alias: string;
  operator: string;
  value: string;
  physicalObject: string;
  physicalField: string;
}

export interface SemanticQueryTimeRange {
  fieldIri: string;
  relativeDays?: number;
  from?: string;
  to?: string;
}

export interface SemanticQueryOutput {
  view: string;
  reason: string;
}

export interface SemanticQueryIntent {
  semanticVersionId: string;
  sourceId: string;
  metrics: SemanticQueryMetric[];
  dimensions: SemanticQueryDimension[];
  filters: SemanticQueryFilter[];
  timeRange?: SemanticQueryTimeRange;
  limit: number;
  output: SemanticQueryOutput;
}

export interface SemanticQueryClarification {
  code: string;
  question: string;
  options: string[];
  candidateIris: string[];
}

export interface SemanticQueryInterpretation {
  status: SemanticQueryInterpretationStatus;
  question: string;
  semanticVersionId: string;
  sourceId: string;
  intent?: SemanticQueryIntent;
  clarifications: SemanticQueryClarification[];
  reasons: string[];
}

export interface SemanticQueryExecutionRequest {
  question: string;
  semanticVersionId: string;
  sourceId: string;
  context?: string;
  expectedPlanHash?: string;
  maxRows?: number;
  timeoutSeconds?: number;
}

export interface SemanticQueryPlanColumn {
  role: string;
  alias: string;
  expression: string;
  semanticIri: string;
}

export interface SemanticQueryPlanLineage {
  semanticIri: string;
  sourceId: string;
  physicalObject: string;
  physicalField: string;
}

export interface SemanticQueryPlan {
  status: SemanticQueryInterpretationStatus;
  question: string;
  semanticVersionId: string;
  sourceId: string;
  databaseType?: string;
  planHash?: string;
  language?: string;
  statement?: string;
  parameterNames: string[];
  columns: SemanticQueryPlanColumn[];
  lineage: SemanticQueryPlanLineage[];
  warnings: string[];
  clarifications: SemanticQueryClarification[];
  reasons: string[];
}

export interface SemanticQueryExplain {
  planHash: string;
  language: string;
  statement: string;
  parameterNames: string[];
  columns: SemanticQueryPlanColumn[];
  lineage: SemanticQueryPlanLineage[];
  warnings: string[];
}

export interface SemanticQueryExecutionResult {
  planHash: string;
  rows: Array<Record<string, unknown>>;
  columns: SemanticQueryPlanColumn[];
  lineage: SemanticQueryPlanLineage[];
  rowCount: number;
  truncated: boolean;
  elapsedMs: number;
  auditId?: string;
  warnings: string[];
}
