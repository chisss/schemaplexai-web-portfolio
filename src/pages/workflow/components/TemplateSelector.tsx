import { useState } from 'react';
import { Modal, Card, Row, Col, Tag, Typography, Empty, Spin } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useWorkflowTemplates } from '@/api/workflow';
import type { WorkflowTemplate } from '@/types/workflow';

const { Text, Paragraph } = Typography;

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: WorkflowTemplate) => void;
}

const CATEGORY_LABELS: Record<string, { key: string; color: string }> = {
  'feature-development': { key: 'workflow.templateCategoryFeature', color: 'blue' },
  'bug-fix': { key: 'workflow.templateCategoryBugfix', color: 'red' },
  'review': { key: 'workflow.templateCategoryReview', color: 'green' },
  'custom': { key: 'workflow.templateCategoryCustom', color: 'purple' },
};

export default function TemplateSelector({ open, onClose, onSelect }: TemplateSelectorProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: templateData, isLoading } = useWorkflowTemplates({
    page: 1,
    size: 50,
    isBuiltin: true,
  });

  const templates = templateData?.records || [];

  const handleOk = () => {
    const tpl = templates.find((t) => t.id === selectedId);
    if (tpl) {
      onSelect(tpl);
    }
    onClose();
  };

  return (
    <Modal
      title={t('workflow.selectPresetTemplate')}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText={t('workflow.useTemplate')}
      cancelText={t('common.cancel')}
      okButtonProps={{ disabled: !selectedId }}
      width={720}
      destroyOnHidden
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      ) : templates.length === 0 ? (
        <Empty description={t('workflow.noPresetTemplates')} />
      ) : (
        <Row gutter={[12, 12]}>
          {templates.map((tpl) => {
            const catInfo = CATEGORY_LABELS[tpl.category] || CATEGORY_LABELS['custom'];
            const isSelected = selectedId === tpl.id;
            const nodeCount = tpl.definition?.nodes?.length || 0;
            return (
              <Col key={tpl.id} xs={24} sm={12}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => setSelectedId(tpl.id)}
                  style={{
                    border: isSelected ? '2px solid #165DFF' : '1px solid #e2e8f0',
                    borderRadius: 10,
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}
                  styles={{ body: { padding: '12px 14px' } }}
                >
                  {isSelected && (
                    <CheckCircleFilled
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: '#165DFF',
                        fontSize: 18,
                      }}
                    />
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Text strong style={{ fontSize: 13 }}>{tpl.name}</Text>
                    <Tag color={catInfo?.color} style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
                      {t(catInfo?.key)}
                    </Tag>
                  </div>
                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{ fontSize: 11, color: '#4E5969', marginBottom: 6 }}
                  >
                    {tpl.description}
                  </Paragraph>
                  <div className="flex items-center gap-3" style={{ fontSize: 10, color: '#86909C' }}>
                    <span>{t('workflow.templateNodeCount', { count: nodeCount })}</span>
                    {tpl.recommendedAgentSkills?.length > 0 && (
                      <span>{t('workflow.templateSkillCount', { count: tpl.recommendedAgentSkills.length })}</span>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Modal>
  );
}
