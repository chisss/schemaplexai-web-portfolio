export interface EvalDatasetItem {
  id?: string;
  inputText: string;
  expectedOutput?: string;
  metadata?: Record<string, any>;
  sortOrder?: number;
}

export interface EvalDataset {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
  lastUsedAt?: string;
  createdAt?: string;
  items: EvalDatasetItem[];
}

export interface EvalDatasetCreateDTO {
  name: string;
  description?: string;
  items?: EvalDatasetItem[];
}

export interface EvalDatasetUpdateDTO {
  name?: string;
  description?: string;
}

export interface EvalDatasetItemSaveDTO {
  items: EvalDatasetItem[];
}

export interface EvalDatasetQueryDTO {
  page?: number;
  size?: number;
  keyword?: string;
}

export interface EvalTaskModelSummary {
  modelId: string;
  modelName: string;
  avgLatencyMs: number;
  avgCost: number;
  avgScore: number;
  successRate: number;
  avgOutputLength: number;
}

export interface EvalTaskItemModelResult {
  modelId: string;
  modelName: string;
  outputText?: string;
  latencyMs?: number;
  cost?: number;
  score?: number;
  status: string;
  errorMessage?: string;
  outputLength?: number;
}

export interface EvalTaskResultItem {
  itemId: string;
  inputText: string;
  expectedOutput?: string;
  modelResults: EvalTaskItemModelResult[];
}

export interface EvalTask {
  id: string;
  name: string;
  datasetId: string;
  datasetName?: string;
  modelIds?: string[];
  modelNames: string[];
  status: string;
  totalItems?: number;
  completedItems?: number;
  progress: number;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
  modelSummaries: EvalTaskModelSummary[];
  resultItems: EvalTaskResultItem[];
}

export interface EvalTaskCreateDTO {
  name?: string;
  datasetId: string;
  modelIds: string[];
}

export interface EvalTaskQueryDTO {
  page?: number;
  size?: number;
  status?: string;
}
