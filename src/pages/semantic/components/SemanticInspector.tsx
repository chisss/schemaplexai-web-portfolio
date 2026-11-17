import { useEffect } from 'react';
import { ApartmentOutlined, SaveOutlined } from '@ant-design/icons';
import { Alert, Button, Divider, Form, Input, Select, Space, Switch, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { SemanticGraphNode, SemanticNodeUpdateDTO } from '@/types/semantic';

interface SemanticInspectorProps {
  node?: SemanticGraphNode;
  revision: number;
  editable: boolean;
  saving: boolean;
  onSave: (nodeId: string, data: SemanticNodeUpdateDTO) => Promise<void>;
}

interface InspectorFormValues {
  name: string;
  label?: string;
  description?: string;
  synonyms?: string[];
  dataType?: string;
  required?: boolean;
  sourceId?: string;
  physicalObject?: string;
  physicalField?: string;
  mappingKind?: 'table' | 'column' | 'collection' | 'field';
}

const { Text, Paragraph } = Typography;

export default function SemanticInspector({ node, revision, editable, saving, onSave }: SemanticInspectorProps) {
  const { t } = useTranslation();
  if (!node) {
    return (
      <div className="semantic-inspector-empty">
        <ApartmentOutlined />
        <strong>{t('semantic.workbench.inspector.emptyTitle')}</strong>
        <span>{t('semantic.workbench.inspector.emptyDescription')}</span>
      </div>
    );
  }

  return <SemanticInspectorForm node={node} revision={revision} editable={editable} saving={saving} onSave={onSave} />;
}

function SemanticInspectorForm({ node, revision, editable, saving, onSave }: Required<Pick<SemanticInspectorProps, 'node'>> & Omit<SemanticInspectorProps, 'node'>) {
  const { t } = useTranslation();
  const [form] = Form.useForm<InspectorFormValues>();

  useEffect(() => {
    form.setFieldsValue({
      name: node.name,
      label: node.label,
      description: node.description,
      synonyms: node.synonyms,
      dataType: node.dataType,
      required: node.required,
      sourceId: node.mapping?.sourceId,
      physicalObject: node.mapping?.physicalObject,
      physicalField: node.mapping?.physicalField,
      mappingKind: node.mapping?.mappingKind,
    });
  }, [form, node]);

  const submit = async () => {
    const values = await form.validateFields();
    const hasMapping = values.sourceId && values.physicalObject && values.mappingKind;
    await onSave(node.id, {
      name: values.name.trim(),
      label: values.label?.trim(),
      description: values.description?.trim(),
      synonyms: values.synonyms,
      dataType: values.dataType,
      required: values.required,
      mapping: hasMapping ? {
        id: node.mapping?.id,
        sourceId: values.sourceId as string,
        semanticIri: node.iri,
        physicalObject: values.physicalObject as string,
        physicalField: values.physicalField?.trim(),
        mappingKind: values.mappingKind as 'table' | 'column' | 'collection' | 'field',
      } : undefined,
      expectedRevision: revision,
    });
  };

  return (
    <div className="semantic-inspector">
      <div className="semantic-panel-heading">
        <div>
          <strong>{t('semantic.workbench.inspector.title')}</strong>
          <span>{t(`semantic.workbench.nodes.${node.kind === 'concept' ? 'concept' : 'property'}`)}</span>
        </div>
        <Tag color={node.kind === 'concept' ? 'blue' : 'green'}>{node.kind}</Tag>
      </div>
      {!editable && <Alert showIcon type="info" message={t('semantic.workbench.inspector.readOnly')} />}
      <Paragraph className="semantic-iri" copyable={{ text: node.iri }}>{node.iri}</Paragraph>
      <Form form={form} layout="vertical" disabled={!editable} requiredMark="optional">
        <Form.Item name="name" label={t('semantic.workbench.inspector.name')} rules={[{ required: true }, { max: 100 }]}>
          <Input />
        </Form.Item>
        <Form.Item name="label" label={t('semantic.workbench.inspector.label')} rules={[{ max: 100 }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label={t('common.description')} rules={[{ max: 500 }]}>
          <Input.TextArea rows={3} maxLength={500} showCount />
        </Form.Item>
        <Form.Item name="synonyms" label={t('semantic.workbench.inspector.synonyms')}>
          <Select mode="tags" tokenSeparators={[',']} />
        </Form.Item>
        {node.kind === 'property' && (
          <Space orientation="vertical" size={0} className="semantic-form-stack">
            <Form.Item name="dataType" label={t('semantic.workbench.inspector.dataType')}>
              <Select allowClear options={['string', 'integer', 'decimal', 'boolean', 'date', 'dateTime'].map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item name="required" label={t('semantic.workbench.inspector.required')} valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        )}
        <Divider>{t('semantic.workbench.inspector.mapping')}</Divider>
        <Text type="secondary" className="semantic-section-help">{t('semantic.workbench.inspector.mappingHint')}</Text>
        <Form.Item name="sourceId" label={t('semantic.workbench.inspector.sourceId')}>
          <Input />
        </Form.Item>
        <Form.Item name="mappingKind" label={t('semantic.workbench.inspector.mappingKind')}>
          <Select allowClear options={['table', 'column', 'collection', 'field'].map((value) => ({ value, label: value }))} />
        </Form.Item>
        <Form.Item name="physicalObject" label={t('semantic.workbench.inspector.physicalObject')}>
          <Input />
        </Form.Item>
        <Form.Item name="physicalField" label={t('semantic.workbench.inspector.physicalField')}>
          <Input />
        </Form.Item>
        <Button block type="primary" icon={<SaveOutlined />} loading={saving} disabled={!editable} onClick={() => void submit()}>
          {t('common.save')}
        </Button>
      </Form>
    </div>
  );
}
