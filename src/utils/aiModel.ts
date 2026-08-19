import {
  DatabaseOutlined,
  EyeOutlined,
  RobotOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import type { ComponentType } from 'react';

type UseCaseMeta = {
  key: string;
  label: string;
  icon: ComponentType;
  gradient: string;
  accent: string;
};

const DEFAULT_META: UseCaseMeta = {
  key: 'general_llm',
  label: '通用大语言模型',
  icon: RobotOutlined,
  gradient: 'linear-gradient(135deg, #165DFF 0%, #0f766e 100%)',
  accent: '#165DFF',
};

const USE_CASE_META_MAP: Record<string, UseCaseMeta> = {
  general_llm: DEFAULT_META,
  embedding: {
    key: 'embedding',
    label: '向量模型',
    icon: DatabaseOutlined,
    gradient: 'linear-gradient(135deg, #0f766e 0%, #059669 100%)',
    accent: '#0f766e',
  },
  vision: {
    key: 'vision',
    label: '视觉模型',
    icon: EyeOutlined,
    gradient: 'linear-gradient(135deg, #FF7D00 0%, #F53F3F 100%)',
    accent: '#FF7D00',
  },
  audio: {
    key: 'audio',
    label: '语音模型',
    icon: SoundOutlined,
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)',
    accent: '#7c3aed',
  },
};

export function normalizeModelUseCase(useCase?: string): string {
  const normalized = (useCase ?? '').trim().toLowerCase();
  if (!normalized) {
    return DEFAULT_META.key;
  }
  if (normalized.includes('embedding') || normalized.includes('向量')) {
    return 'embedding';
  }
  if (normalized.includes('vision') || normalized.includes('visio') || normalized.includes('视觉')) {
    return 'vision';
  }
  if (normalized.includes('audio') || normalized.includes('speech') || normalized.includes('voice') || normalized.includes('语音')) {
    return 'audio';
  }
  if (normalized.includes('general') || normalized.includes('llm') || normalized.includes('chat') || normalized.includes('通用')) {
    return 'general_llm';
  }
  return normalized;
}

export function getModelUseCaseMeta(useCase?: string): UseCaseMeta {
  const key = normalizeModelUseCase(useCase);
  return USE_CASE_META_MAP[key] ?? {
    ...DEFAULT_META,
    key,
    label: useCase?.trim() || DEFAULT_META.label,
  };
}

export function formatModelUseCaseLabel(useCase?: string): string {
  return getModelUseCaseMeta(useCase).label;
}

export function isEmbeddingUseCase(useCase?: string): boolean {
  return normalizeModelUseCase(useCase) === 'embedding';
}

export function isEmbeddingModel(model?: { useCase?: string; modelId?: string }): boolean {
  if (!model) {
    return false;
  }
  return isEmbeddingUseCase(model.useCase)
    || (model.modelId ?? '').toLowerCase().includes('embedding');
}

export function isSameUseCase(left?: string, right?: string): boolean {
  return normalizeModelUseCase(left) === normalizeModelUseCase(right);
}
