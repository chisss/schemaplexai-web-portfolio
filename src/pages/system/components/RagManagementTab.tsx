import { useEffect, useMemo } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudOutlined,
  DatabaseOutlined,
  QuestionCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { AiModel } from '@/types/system';
import { useRagConfig, useUpdateRagConfig } from '@/api/system';
import { formatDateTime } from '@/utils/date';
import { isEmbeddingModel } from '@/utils/aiModel';

const { Text } = Typography;

/** 内置向量模型列表 */
const BUILTIN_EMBEDDING_MODELS = [
  { id: 'all-MiniLM-L6-v2', name: '多语言通用（中英文混合）', dimension: 384 },
  { id: 'bge-small-en-v1.5', name: '英文专项优化', dimension: 384 },
];

interface RagManagementTabProps {
  models: AiModel[];
}

/** 带问号提示的标签 */
function buildTipLabel(label: string, tip: string) {
  return (
    <Space size={6}>
      <span>{label}</span>
      <Tooltip title={tip}>
        <QuestionCircleOutlined style={{ color: 'var(--color-text-tertiary)' }} />
      </Tooltip>
    </Space>
  );
}

/** 分组标题（加粗 + 图标 + 底部分隔线） */
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 0 12px',
        marginBottom: 16,
        borderBottom: '1px solid var(--ant-color-border-secondary, #f0f0f0)',
      }}
    >
      <span style={{ fontSize: 16, color: 'var(--ant-color-primary, #1677ff)' }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ant-color-text, rgba(0,0,0,.88))' }}>{title}</span>
    </div>
  );
}

/**
 * 当前生效信息 - 向量模型卡片
 */
function EmbeddingEffectiveInfo({ ragConfig, t }: { ragConfig: any; t: any }) {
  if (!ragConfig) return null;
  const isBuiltin = ragConfig.embeddingSource === 'builtin';
  return (
    <Card
      size="small"
      className="h-full"
      styles={{
        body: { padding: '16px 20px' },
        header: { borderBottom: 'none', paddingBottom: 0 },
      }}
      style={{ borderRadius: 12, border: '1px solid var(--ant-color-border-secondary, #f0f0f0)' }}
      title={
        <div className="flex items-center gap-2">
          <DatabaseOutlined style={{ color: 'var(--ant-color-primary, #1677ff)' }} />
          <span style={{ fontWeight: 600 }}>{t('system.rag.effectiveEmbedding', { defaultValue: '向量模型' })}</span>
          <Tag color={isBuiltin ? 'blue' : 'green'} style={{ marginLeft: 4 }}>
            {isBuiltin ? t('system.rag.sourceBuiltin', { defaultValue: '系统内置' }) : t('system.rag.sourceApi', { defaultValue: '外部 API' })}
          </Tag>
        </div>
      }
    >
      <Descriptions column={1} size="small" colon={false} style={{ marginTop: 4 }}>
        <Descriptions.Item label={t('system.rag.modelName', { defaultValue: '模型名称' })}>
          <Text strong>
            {isBuiltin ? (ragConfig.builtinEmbeddingModelName || ragConfig.builtinEmbeddingModelId || '-') : (ragConfig.vectorModelName || t('system.rag.unbound', { defaultValue: '未绑定' }))}
          </Text>
        </Descriptions.Item>
        {isBuiltin && (
          <Descriptions.Item label={t('system.rag.modelId', { defaultValue: '模型标识' })}>
            <Text code>{ragConfig.builtinEmbeddingModelId || '-'}</Text>
          </Descriptions.Item>
        )}
        {!isBuiltin && ragConfig.provider && (
          <Descriptions.Item label={t('system.rag.providerLabel', { defaultValue: '提供商' })}>
            {ragConfig.provider} / {ragConfig.modelId || '-'}
          </Descriptions.Item>
        )}
        <Descriptions.Item label={t('system.rag.dimension', { defaultValue: '向量维度' })}>
          {(isBuiltin ? ragConfig.builtinEmbeddingDimension : ragConfig.embeddingDimension) || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('system.rag.collection', { defaultValue: '集合' })}>
          {ragConfig.collectionName || '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

/**
 * 当前生效信息 - 评分模型卡片
 */
function ScoringEffectiveInfo({ ragConfig, t }: { ragConfig: any; t: any }) {
  if (!ragConfig) return null;
  const isBuiltin = ragConfig.rerankerSource === 'builtin';
  const enabled = ragConfig.rerankerEnabled;
  return (
    <Card
      size="small"
      className="h-full"
      styles={{
        body: { padding: '16px 20px' },
        header: { borderBottom: 'none', paddingBottom: 0 },
      }}
      style={{ borderRadius: 12, border: '1px solid var(--ant-color-border-secondary, #f0f0f0)' }}
      title={
        <div className="flex items-center gap-2">
          <ThunderboltOutlined style={{ color: enabled ? 'var(--ant-color-success, #52c41a)' : 'var(--ant-color-text-quaternary, #bbb)' }} />
          <span style={{ fontWeight: 600 }}>{t('system.rag.effectiveScoring', { defaultValue: '评分模型' })}</span>
          {enabled ? (
            <Tag icon={<CheckCircleOutlined />} color="success">{t('system.rag.rerankerOn', { defaultValue: '已启用' })}</Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />}>{t('system.rag.rerankerOff', { defaultValue: '未启用' })}</Tag>
          )}
        </div>
      }
    >
      {enabled ? (
        <Descriptions column={1} size="small" colon={false} style={{ marginTop: 4 }}>
          <Descriptions.Item label={t('system.rag.scoringSource', { defaultValue: '来源' })}>
            <Tag color={isBuiltin ? 'blue' : 'green'}>
              {isBuiltin ? t('system.rag.sourceBuiltin', { defaultValue: '系统内置' }) : t('system.rag.sourceApi', { defaultValue: '外部 API' })}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('system.rag.modelName', { defaultValue: '模型名称' })}>
            <Text strong>{isBuiltin ? (ragConfig.builtinScoringModelName || 'ONNX Cross-Encoder Reranker') : '-'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="TopN">
            {ragConfig.rerankerTopN ?? 5}
          </Descriptions.Item>
          <Descriptions.Item label={t('system.rag.minScore', { defaultValue: '最小评分' })}>
            {ragConfig.rerankerMinScore ?? 0}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Text type="secondary" style={{ display: 'block', marginTop: 4, lineHeight: 1.6 }}>
          {t('system.rag.rerankerDisabledHint', { defaultValue: '开启后可使用 Cross-Encoder 对检索结果二阶段精排，提升相关性。' })}
        </Text>
      )}
    </Card>
  );
}

export default function RagManagementTab({ models }: RagManagementTabProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { data: ragConfig, isLoading } = useRagConfig();
  const updateMutation = useUpdateRagConfig();

  const embeddingModels = useMemo(
    () => models.filter((model) => isEmbeddingModel(model) && model.status?.toLowerCase() === 'active'),
    [models]
  );

  // 监听表单中的来源切换
  const embeddingSource = Form.useWatch('embeddingSource', form) ?? ragConfig?.embeddingSource ?? 'builtin';
  const rerankerSource = Form.useWatch('rerankerSource', form) ?? ragConfig?.rerankerSource ?? 'builtin';
  const rerankerEnabled = Form.useWatch('rerankerEnabled', form) ?? ragConfig?.rerankerEnabled ?? false;

  useEffect(() => {
    if (!ragConfig) return;
    form.setFieldsValue({
      enabled: ragConfig.enabled,
      embeddingSource: ragConfig.embeddingSource || 'builtin',
      builtinEmbeddingModelId: ragConfig.builtinEmbeddingModelId || BUILTIN_EMBEDDING_MODELS[0].id,
      vectorModelId: ragConfig.vectorModelId,
      collectionName: ragConfig.collectionName,
      chunkSize: ragConfig.chunkSize,
      chunkOverlap: ragConfig.chunkOverlap,
      retrievalTopK: ragConfig.retrievalTopK,
      retrievalMinScore: ragConfig.retrievalMinScore,
      embeddingDimension: ragConfig.embeddingDimension,
      textCleaningEnabled: ragConfig.textCleaningEnabled,
      rerankerEnabled: ragConfig.rerankerEnabled,
      rerankerSource: ragConfig.rerankerSource || 'builtin',
      rerankerTopN: ragConfig.rerankerTopN,
      rerankerMinScore: ragConfig.rerankerMinScore,
    });
  }, [form, ragConfig]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await updateMutation.mutateAsync(values);
      message.success(t('system.rag.saveSuccess', { defaultValue: 'RAG 配置已保存' }));
    } catch {
      // 表单校验错误交由控件内展示
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 顶部：当前生效信息（左=向量模型，右=评分模型） */}
      <Row gutter={[20, 20]}>
        <Col xs={24} md={12}>
          <EmbeddingEffectiveInfo ragConfig={ragConfig} t={t} />
        </Col>
        <Col xs={24} md={12}>
          <ScoringEffectiveInfo ragConfig={ragConfig} t={t} />
        </Col>
      </Row>

      {/* 配置表单 */}
      <Card
        title={
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            {t('system.rag.configCardTitle', { defaultValue: 'RAG 运行时配置' })}
          </span>
        }
        variant="borderless"
        style={{ borderRadius: 12 }}
        className="shadow-sm"
        loading={isLoading}
        extra={
          <Space size={16}>
            {ragConfig?.updatedAt && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('system.rag.lastUpdated', { defaultValue: '最近更新' })}: {formatDateTime(ragConfig.updatedAt)}
              </Text>
            )}
            <Button type="primary" onClick={handleSave} loading={updateMutation.isPending}>
              {t('common.save')}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" style={{ maxWidth: 960 }}>
          {/* 基础开关 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item name="enabled" label={t('system.rag.enabled', { defaultValue: '启用 RAG' })} valuePropName="checked">
              <Switch checkedChildren={t('common.enable')} unCheckedChildren={t('common.disable')} />
            </Form.Item>
            <Form.Item name="textCleaningEnabled" label={t('system.rag.textCleaningEnabled', { defaultValue: '启用文本清洗' })} valuePropName="checked">
              <Switch checkedChildren={t('common.enable')} unCheckedChildren={t('common.disable')} />
            </Form.Item>
          </div>

          {/* ===== 向量模型配置 ===== */}
          <div style={{ marginTop: 8 }}>
            <SectionTitle
              icon={<DatabaseOutlined />}
              title={t('system.rag.embeddingSection', { defaultValue: '向量模型配置' })}
            />
          </div>

          <Form.Item name="embeddingSource" label={t('system.rag.embeddingSourceLabel', { defaultValue: '向量模型来源' })}>
            <Radio.Group>
              <Radio.Button value="builtin">{t('system.rag.sourceBuiltin', { defaultValue: '系统内置' })}</Radio.Button>
              <Radio.Button value="api">{t('system.rag.sourceApi', { defaultValue: '外部 API' })}</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {embeddingSource === 'builtin' ? (
            <Form.Item
              name="builtinEmbeddingModelId"
              label={t('system.rag.builtinEmbeddingModel', { defaultValue: '内置向量模型' })}
              rules={[{ required: true, message: t('system.rag.builtinEmbeddingModelRequired', { defaultValue: '请选择内置向量模型' }) }]}
            >
              <Select
                options={BUILTIN_EMBEDDING_MODELS.map((m) => ({
                  value: m.id,
                  label: `${m.id} — ${m.name}（${m.dimension} 维）`,
                }))}
              />
            </Form.Item>
          ) : (
            <>
              <Form.Item
                name="vectorModelId"
                label={t('system.rag.vectorModel', { defaultValue: '向量模型' })}
                rules={[{ required: true, message: t('system.rag.vectorModelRequired', { defaultValue: '请选择向量模型' }) }]}
                extra={t('system.rag.vectorModelHelper', { defaultValue: '仅展示 use_case 为"向量模型"的激活模型' })}
              >
                <Select
                  showSearch
                  placeholder={t('system.rag.vectorModelPlaceholder', { defaultValue: '请选择向量模型' })}
                  optionFilterProp="label"
                  options={embeddingModels.map((model) => ({
                    value: model.id,
                    label: `${model.name} (${model.modelId})`,
                  }))}
                  notFoundContent={
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('system.rag.noEmbeddingModels', { defaultValue: '暂无可用向量模型' })} />
                  }
                />
              </Form.Item>
              <Form.Item
                name="embeddingDimension"
                label={buildTipLabel(
                  t('system.rag.embeddingDimension', { defaultValue: '向量维度' }),
                  t('system.rag.embeddingDimensionTip', { defaultValue: '向量长度，必须与当前向量模型输出一致。不填写时默认按模型维度。' })
                )}
              >
                <InputNumber min={128} max={8192} className="w-full" placeholder={t('system.rag.embeddingDimensionPlaceholder', { defaultValue: '留空则按模型默认值' })} />
              </Form.Item>
            </>
          )}

          {/* ===== 检索与分块配置 ===== */}
          <div style={{ marginTop: 8 }}>
            <SectionTitle
              icon={<CloudOutlined />}
              title={t('system.rag.retrievalSection', { defaultValue: '检索与分块配置' })}
            />
          </div>

          <Form.Item
            name="collectionName"
            label={buildTipLabel(
              t('system.rag.collectionName', { defaultValue: 'Milvus 集合名' }),
              t('system.rag.collectionNameTip', { defaultValue: 'Milvus 中存放向量数据的集合名称。' })
            )}
            rules={[{ required: true, message: t('system.rag.collectionNameRequired', { defaultValue: '请输入集合名' }) }]}
          >
            <Input placeholder={t('system.rag.collectionNamePlaceholder', { defaultValue: '例如：sf_context_items' })} />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item
              name="chunkSize"
              label={buildTipLabel(
                t('system.rag.chunkSize', { defaultValue: 'CHUNK_SIZE' }),
                t('system.rag.chunkSizeTip', { defaultValue: '单个文本分块的目标长度。中文知识库常用 500-1200。' })
              )}
              rules={[{ required: true, message: t('system.rag.chunkSizeRequired', { defaultValue: '请输入分块大小' }) }]}
            >
              <InputNumber min={100} max={10000} className="w-full" />
            </Form.Item>
            <Form.Item
              name="chunkOverlap"
              label={buildTipLabel(
                t('system.rag.chunkOverlap', { defaultValue: 'CHUNK_OVERLAP' }),
                t('system.rag.chunkOverlapTip', { defaultValue: '相邻分块的重叠长度，通常取 CHUNK_SIZE 的 10%-20%。' })
              )}
              rules={[{ required: true, message: t('system.rag.chunkOverlapRequired', { defaultValue: '请输入分块重叠' }) }]}
            >
              <InputNumber min={0} max={5000} className="w-full" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item
              name="retrievalTopK"
              label={buildTipLabel(
                t('system.rag.retrievalTopK', { defaultValue: '检索 TopK' }),
                t('system.rag.retrievalTopKTip', { defaultValue: '每次查询最多召回的向量片段数，常用 3-10。' })
              )}
              rules={[{ required: true, message: t('system.rag.retrievalTopKRequired', { defaultValue: '请输入检索 TopK' }) }]}
            >
              <InputNumber min={1} max={50} className="w-full" />
            </Form.Item>
            <Form.Item
              name="retrievalMinScore"
              label={buildTipLabel(
                t('system.rag.retrievalMinScore', { defaultValue: '最小相似度阈值' }),
                t('system.rag.retrievalMinScoreTip', { defaultValue: '过滤低相关结果的最小相似度，常用 0.4-0.8。' })
              )}
              rules={[{ required: true, message: t('system.rag.retrievalMinScoreRequired', { defaultValue: '请输入最小相似度阈值' }) }]}
            >
              <InputNumber min={0} max={1} step={0.01} className="w-full" />
            </Form.Item>
          </div>

          {/* ===== Reranker 评分模型配置 ===== */}
          <div style={{ marginTop: 8 }}>
            <SectionTitle
              icon={<ThunderboltOutlined />}
              title={t('system.rag.rerankerSection', { defaultValue: 'Reranker 评分模型（二阶段精排）' })}
            />
          </div>

          <Form.Item
            name="rerankerEnabled"
            label={buildTipLabel(
              t('system.rag.rerankerEnabled', { defaultValue: '启用 Reranker' }),
              t('system.rag.rerankerEnabledTip', { defaultValue: '启用后，向量检索结果会经过 Cross-Encoder 模型进行二阶段精排，提升结果相关性。' })
            )}
            valuePropName="checked"
          >
            <Switch checkedChildren={t('common.enable')} unCheckedChildren={t('common.disable')} />
          </Form.Item>

          {rerankerEnabled && (
            <>
              <Form.Item name="rerankerSource" label={t('system.rag.rerankerSourceLabel', { defaultValue: '评分模型来源' })}>
                <Radio.Group>
                  <Radio.Button value="builtin">{t('system.rag.sourceBuiltin', { defaultValue: '系统内置' })}</Radio.Button>
                  <Radio.Button value="api">{t('system.rag.sourceApi', { defaultValue: '外部 API' })}</Radio.Button>
                </Radio.Group>
              </Form.Item>

              {rerankerSource === 'builtin' && (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 20, borderRadius: 8 }}
                  message={t('system.rag.builtinScoringHint', { defaultValue: '系统内置 ONNX Cross-Encoder Reranker，无需额外配置即可使用。' })}
                />
              )}

              {rerankerSource === 'api' && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 20, borderRadius: 8 }}
                  message={t('system.rag.apiScoringHint', { defaultValue: '外部 API 评分模型功能开发中，当前请使用系统内置模型。' })}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <Form.Item
                  name="rerankerTopN"
                  label={buildTipLabel(
                    t('system.rag.rerankerTopN', { defaultValue: 'Reranker TopN' }),
                    t('system.rag.rerankerTopNTip', { defaultValue: '精排后最终返回的结果数量，通常小于向量检索 TopK。' })
                  )}
                >
                  <InputNumber min={1} max={50} className="w-full" />
                </Form.Item>
                <Form.Item
                  name="rerankerMinScore"
                  label={buildTipLabel(
                    t('system.rag.rerankerMinScore', { defaultValue: 'Reranker 最小评分' }),
                    t('system.rag.rerankerMinScoreTip', { defaultValue: 'Cross-Encoder 输出通常为 0~1 之间。设为 0 则不过滤。' })
                  )}
                >
                  <InputNumber min={0} max={1} step={0.01} className="w-full" />
                </Form.Item>
              </div>
            </>
          )}
        </Form>
      </Card>
    </div>
  );
}
