import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import request from './request';
import type { PageResult, R } from '@/types/common';
import type {
  SchemaScanDTO,
  SchemaSnapshot,
  SemanticGraphPage,
  SemanticGraphQueryDTO,
  SemanticModel,
  SemanticModelCreateDTO,
  SemanticModelQueryDTO,
  SemanticModelUpdateDTO,
  SemanticNodeUpdateDTO,
  SemanticNodeUpdateResult,
  SemanticPublishResult,
  SemanticQueryInterpretRequest,
  SemanticQueryInterpretation,
  SemanticQueryExecutionResult,
  SemanticQueryExecutionRequest,
  SemanticQueryExplain,
  SemanticQueryPlan,
  SemanticValidationResult,
  SemanticVersion,
  SemanticVersionActionDTO,
  SemanticVersionCreateDTO,
} from '@/types/semantic';

const semanticKeys = {
  models: ['semantic-models'] as const,
  model: (id: string) => ['semantic-model', id] as const,
  versions: (modelId: string) => ['semantic-versions', modelId] as const,
  version: (id: string) => ['semantic-version', id] as const,
  graph: (versionId: string) => ['semantic-graph', versionId] as const,
  snapshots: (sourceId: string) => ['schema-snapshots', sourceId] as const,
};

export const fetchSemanticModels = (params: SemanticModelQueryDTO) =>
  request.get<unknown, R<PageResult<SemanticModel>>>('/semantic/models', { params });

export const fetchSemanticModel = (id: string) =>
  request.get<unknown, R<SemanticModel>>(`/semantic/models/${id}`);

export const createSemanticModel = (data: SemanticModelCreateDTO) =>
  request.post<unknown, R<SemanticModel>>('/semantic/models', data);

export const updateSemanticModel = (id: string, data: SemanticModelUpdateDTO) =>
  request.patch<unknown, R<SemanticModel>>(`/semantic/models/${id}`, data);

export const deleteSemanticModel = (id: string) =>
  request.delete<unknown, R<void>>(`/semantic/models/${id}`);

export const fetchSemanticVersions = (modelId: string) =>
  request.get<unknown, R<SemanticVersion[]>>(`/semantic/models/${modelId}/versions`);

export const fetchSemanticVersion = (id: string) =>
  request.get<unknown, R<SemanticVersion>>(`/semantic/versions/${id}`);

export const createSemanticVersion = (modelId: string, data: SemanticVersionCreateDTO) =>
  request.post<unknown, R<SemanticVersion>>(`/semantic/models/${modelId}/versions`, data);

export const fetchSemanticGraph = (versionId: string, params: SemanticGraphQueryDTO) =>
  request.get<unknown, R<SemanticGraphPage>>(`/semantic/versions/${versionId}/graph`, { params });

export const updateSemanticNode = (versionId: string, nodeId: string, data: SemanticNodeUpdateDTO) =>
  request.put<unknown, R<SemanticNodeUpdateResult>>(
    `/semantic/versions/${versionId}/nodes/${encodeURIComponent(nodeId)}`,
    data,
  );

export const validateSemanticVersion = (versionId: string, data: SemanticVersionActionDTO) =>
  request.post<unknown, R<SemanticValidationResult>>(`/semantic/versions/${versionId}/validate`, data);

export const publishSemanticVersion = (versionId: string, data: SemanticVersionActionDTO) =>
  request.post<unknown, R<SemanticPublishResult>>(`/semantic/versions/${versionId}/publish`, data);

export const interpretSemanticQuery = (data: SemanticQueryInterpretRequest) =>
  request.post<unknown, R<SemanticQueryInterpretation>>('/semantic/query/interpret', data);

export const prepareSemanticQueryPlan = (data: SemanticQueryExecutionRequest) =>
  request.post<unknown, R<SemanticQueryPlan>>('/semantic/query/plan', data);

export const explainSemanticQuery = (data: SemanticQueryExecutionRequest) =>
  request.post<unknown, R<SemanticQueryExplain>>('/semantic/query/explain', data);

export const executeSemanticQuery = (data: SemanticQueryExecutionRequest) =>
  request.post<unknown, R<SemanticQueryExecutionResult>>('/semantic/query/execute', data);

export const scanDatabaseSchema = (sourceId: string, data: SchemaScanDTO = {}) =>
  request.post<unknown, R<SchemaSnapshot>>(`/database-sources/${sourceId}/schema/scan`, data);

export const fetchSchemaSnapshots = (sourceId: string) =>
  request.get<unknown, R<SchemaSnapshot[]>>(`/database-sources/${sourceId}/schema/snapshots`);

export function useSemanticModels(params: SemanticModelQueryDTO) {
  return useQuery({
    queryKey: [...semanticKeys.models, params],
    queryFn: () => fetchSemanticModels(params),
    select: (response) => response.data,
  });
}

export function useSemanticModel(id?: string) {
  return useQuery({
    queryKey: semanticKeys.model(id ?? ''),
    queryFn: () => fetchSemanticModel(id as string),
    select: (response) => response.data,
    enabled: !!id,
  });
}

export function useSemanticVersions(modelId?: string) {
  return useQuery({
    queryKey: semanticKeys.versions(modelId ?? ''),
    queryFn: () => fetchSemanticVersions(modelId as string),
    select: (response) => response.data,
    enabled: !!modelId,
  });
}

export function useSemanticVersion(id?: string) {
  return useQuery({
    queryKey: semanticKeys.version(id ?? ''),
    queryFn: () => fetchSemanticVersion(id as string),
    select: (response) => response.data,
    enabled: !!id,
  });
}

export function useSemanticGraph(versionId: string | undefined, params: SemanticGraphQueryDTO) {
  return useQuery({
    queryKey: [...semanticKeys.graph(versionId ?? ''), params],
    queryFn: () => fetchSemanticGraph(versionId as string, params),
    select: (response) => response.data,
    enabled: !!versionId,
  });
}

export function useSchemaSnapshots(sourceId?: string) {
  return useQuery({
    queryKey: semanticKeys.snapshots(sourceId ?? ''),
    queryFn: () => fetchSchemaSnapshots(sourceId as string),
    select: (response) => response.data,
    enabled: !!sourceId,
  });
}

export function useCreateSemanticModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSemanticModel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: semanticKeys.models }),
  });
}

export function useUpdateSemanticModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SemanticModelUpdateDTO }) =>
      updateSemanticModel(id, data),
    onSuccess: (_response, { id }) => {
      queryClient.invalidateQueries({ queryKey: semanticKeys.models });
      queryClient.invalidateQueries({ queryKey: semanticKeys.model(id) });
    },
  });
}

export function useDeleteSemanticModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSemanticModel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: semanticKeys.models }),
  });
}

export function useCreateSemanticVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ modelId, data }: { modelId: string; data: SemanticVersionCreateDTO }) =>
      createSemanticVersion(modelId, data),
    onSuccess: (_response, { modelId }) => {
      queryClient.invalidateQueries({ queryKey: semanticKeys.versions(modelId) });
      queryClient.invalidateQueries({ queryKey: semanticKeys.model(modelId) });
    },
  });
}

export function useUpdateSemanticNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      versionId,
      nodeId,
      data,
    }: {
      versionId: string;
      nodeId: string;
      data: SemanticNodeUpdateDTO;
    }) => updateSemanticNode(versionId, nodeId, data),
    onSuccess: (_response, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: semanticKeys.version(versionId) });
      queryClient.invalidateQueries({ queryKey: semanticKeys.graph(versionId) });
    },
  });
}

export function useValidateSemanticVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ versionId, data }: { versionId: string; data: SemanticVersionActionDTO }) =>
      validateSemanticVersion(versionId, data),
    onSuccess: (_response, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: semanticKeys.version(versionId) });
    },
  });
}

export function usePublishSemanticVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ versionId, data }: { versionId: string; data: SemanticVersionActionDTO }) =>
      publishSemanticVersion(versionId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: semanticKeys.models });
      queryClient.invalidateQueries({ queryKey: semanticKeys.model(response.data.modelId) });
      queryClient.invalidateQueries({ queryKey: semanticKeys.versions(response.data.modelId) });
      queryClient.invalidateQueries({ queryKey: semanticKeys.version(response.data.version.id) });
    },
  });
}

export function useInterpretSemanticQuery() {
  return useMutation({
    mutationFn: interpretSemanticQuery,
  });
}

export function usePrepareSemanticQueryPlan() {
  return useMutation({ mutationFn: prepareSemanticQueryPlan });
}

export function useExplainSemanticQuery() {
  return useMutation({ mutationFn: explainSemanticQuery });
}

export function useExecuteSemanticQuery() {
  return useMutation({ mutationFn: executeSemanticQuery });
}

export function useScanDatabaseSchema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceId, data }: { sourceId: string; data?: SchemaScanDTO }) =>
      scanDatabaseSchema(sourceId, data),
    onSuccess: (_response, { sourceId }) => {
      queryClient.invalidateQueries({ queryKey: semanticKeys.snapshots(sourceId) });
    },
  });
}
