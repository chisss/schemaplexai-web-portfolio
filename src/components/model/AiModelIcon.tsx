import { RobotOutlined } from '@ant-design/icons';
import { lazy, Suspense } from 'react';
import type { ComponentType, CSSProperties } from 'react';

type LobeIconType = 'avatar' | 'mono' | 'color' | 'combine' | 'combine-color';

interface LobeIconBaseProps {
  className?: string;
  shape?: 'circle' | 'square';
  size?: number;
  style?: CSSProperties;
  type?: LobeIconType;
}

interface LazyModelIconProps extends LobeIconBaseProps {
  model: string;
}

interface LazyProviderIconProps extends LobeIconBaseProps {
  provider: string;
}

const LazyModelIcon = lazy(async () => {
  const module = await import('@lobehub/icons');
  return { default: module.ModelIcon as ComponentType<LazyModelIconProps> };
});

const LazyProviderIcon = lazy(async () => {
  const module = await import('@lobehub/icons');
  return { default: module.ProviderIcon as ComponentType<LazyProviderIconProps> };
});

export interface AiModelIconProps {
  className?: string;
  modelId?: string;
  modelName?: string;
  provider?: string;
  providerCode?: string;
  shape?: 'circle' | 'square';
  size?: number;
  style?: CSSProperties;
  type?: LobeIconType;
}

const MAINSTREAM_MODEL_MATCHERS = [
  { provider: 'openai', patterns: [/gpt/i, /\bo1\b/i, /\bo3\b/i, /\bo4\b/i, /chatgpt/i, /whisper/i, /dall-e/i, /codex/i] },
  { provider: 'claude', patterns: [/claude/i] },
  { provider: 'gemini', patterns: [/gemini/i, /learnlm/i] },
  { provider: 'deepseek', patterns: [/deepseek/i] },
  { provider: 'qwen', patterns: [/\bqwen/i, /\bqwq\b/i, /\bqvq\b/i, /tongyi/i] },
  { provider: 'doubao', patterns: [/doubao/i, /豆包/i] },
  { provider: 'moonshot', patterns: [/moonshot/i, /kimi/i] },
  { provider: 'zhipu', patterns: [/\bglm\b/i, /chatglm/i, /zhipu/i, /智谱/i] },
  { provider: 'xai', patterns: [/grok/i, /\bxai\b/i] },
  { provider: 'mistral', patterns: [/mistral/i, /mixtral/i, /codestral/i] },
  { provider: 'meta', patterns: [/llama/i, /\bmeta\b/i] },
];

const PROVIDER_ALIASES: Record<string, string> = {
  alibaba: 'alibaba',
  anthropic: 'anthropic',
  claude: 'claude',
  aws: 'aws',
  azure: 'azure',
  'azure-openai': 'azure',
  'azureopenai': 'azure',
  bailian: 'bailian',
  百炼: 'bailian',
  bedrock: 'bedrock',
  bytedance: 'bytedance',
  cohere: 'cohere',
  deepseek: 'deepseek',
  doubao: 'doubao',
  gemini: 'gemini',
  google: 'google',
  grok: 'xai',
  huggingface: 'huggingface',
  hunyuan: 'hunyuan',
  kimi: 'moonshot',
  llamaindex: 'llamaindex',
  meta: 'meta',
  microsoft: 'microsoft',
  midjourney: 'midjourney',
  minimax: 'minimax',
  mistral: 'mistral',
  moonshot: 'moonshot',
  newapi: 'newapi',
  ollama: 'ollama',
  opencode: 'opencode',
  openai: 'openai',
  openrouter: 'openrouter',
  qwen: 'qwen',
  stepfun: 'stepfun',
  tongyi: 'qwen',
  volcengine: 'volcengine',
  xai: 'xai',
  yuanbao: 'yuanbao',
  zhipu: 'zhipu',
};

function normalizeProviderToken(value?: string): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '')
    .replace(/[()/-]+/g, '');
}

function resolveMainstreamProvider(modelText?: string): string | undefined {
  if (!modelText) {
    return undefined;
  }
  return MAINSTREAM_MODEL_MATCHERS.find((item) => item.patterns.some((pattern) => pattern.test(modelText)))?.provider;
}

function resolveProviderKey(provider?: string, providerCode?: string): string | undefined {
  const normalizedProvider = normalizeProviderToken(provider);
  const normalizedProviderCode = normalizeProviderToken(providerCode);
  return PROVIDER_ALIASES[normalizedProviderCode] ?? PROVIDER_ALIASES[normalizedProvider];
}

export default function AiModelIcon({
  className,
  modelId,
  modelName,
  provider,
  providerCode,
  shape,
  size = 16,
  style,
  type = 'color',
}: AiModelIconProps) {
  const modelText = [modelId, modelName].filter(Boolean).join(' ').trim();
  const matchedMainstreamProvider = resolveMainstreamProvider(modelText);
  const providerKey = matchedMainstreamProvider ?? resolveProviderKey(provider, providerCode);
  const fallbackIcon = <RobotOutlined className={className} style={{ fontSize: size, ...style }} />;

  // 优先让主流模型命中 ModelIcon，其他情况再回退到 ProviderIcon。
  if (matchedMainstreamProvider && modelText) {
    return (
      <Suspense fallback={fallbackIcon}>
        <LazyModelIcon
          className={className}
          model={modelText}
          shape={shape}
          size={size}
          style={style}
          type={type}
        />
      </Suspense>
    );
  }

  if (providerKey) {
    return (
      <Suspense fallback={fallbackIcon}>
        <LazyProviderIcon
          className={className}
          provider={providerKey}
          shape={shape}
          size={size}
          style={style}
          type={type}
        />
      </Suspense>
    );
  }

  if (modelText) {
    return (
      <Suspense fallback={fallbackIcon}>
        <LazyModelIcon
          className={className}
          model={modelText}
          shape={shape}
          size={size}
          style={style}
          type={type}
        />
      </Suspense>
    );
  }

  return fallbackIcon;
}
