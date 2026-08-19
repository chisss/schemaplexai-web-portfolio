/**
 * 模型组管理 Tab 组件
 * 支持创建/编辑/删除模型组，拖拽排序成员，按价格/性能自动生成
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Button, Card, Col, Drawer, Empty, Form, Input,
  List, Modal, Popconfirm, Row, Select, Space, Tag, Tooltip,
  message, Typography, Badge,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined,
  ThunderboltOutlined, DragOutlined,
} from '@ant-design/icons';
import {
  useModelGroups, useAllAiModels,
  useCreateModelGroup, useUpdateModelGroup, useDeleteModelGroup,
  useSaveModelGroupItems, useAutoGenerateModelGroup,
  useDictItems,
} from '@/api/system';
import { useAuthStore } from '@/store/useAuthStore';
import AiModelIcon from '@/components/model/AiModelIcon';
import type { AiModelGroup, AiModelGroupCreateDTO, AiModelGroupUpdateDTO } from '@/types/system';
import { formatModelUseCaseLabel, isSameUseCase } from '@/utils/aiModel';

const { Text } = Typography;

const STRATEGY_LABELS: Record<string, string> = {
  manual: 'system.modelGroup.strategy.manual',
  by_price: 'system.modelGroup.strategy.byPrice',
  by_performance: 'system.modelGroup.strategy.byPerformance',
};

const STRATEGY_COLORS: Record<string, string> = {
  manual: 'default',
  by_price: 'green',
  by_performance: 'blue',
};

export default function ModelGroupTab() {
  const { t } = useTranslation();
  const { data: groups = [], isLoading } = useModelGroups();
  const { data: allModels = [] } = useAllAiModels();
  const { data: useCaseItems = [] } = useDictItems('ai_model_use_case');
  const { hasPermission } = useAuthStore();
  const canUpdate = hasPermission('system:config:update');
  const createMutation = useCreateModelGroup();
  const updateMutation = useUpdateModelGroup();
  const deleteMutation = useDeleteModelGroup();
  const saveItemsMutation = useSaveModelGroupItems();
  const autoGenerateMutation = useAutoGenerateModelGroup();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [autoGenerateModalOpen, setAutoGenerateModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AiModelGroup | null>(null);
  const [memberDrawerGroup, setMemberDrawerGroup] = useState<AiModelGroup | null>(null);
  const [memberModelIds, setMemberModelIds] = useState<string[]>([]);

  const [createForm] = Form.useForm();
  const [autoForm] = Form.useForm();

  const handleCreate = () => {
    setEditingGroup(null);
    createForm.resetFields();
    createForm.setFieldsValue({ routingStrategy: 'manual' });
    setCreateModalOpen(true);
  };

  const handleEdit = (group: AiModelGroup) => {
    setEditingGroup(group);
    createForm.setFieldsValue({
      name: group.name,
      description: group.description,
      routingStrategy: group.routingStrategy,
    });
    setCreateModalOpen(true);
  };

  const handleCreateOk = () => {
    createForm.validateFields().then((values: AiModelGroupCreateDTO | AiModelGroupUpdateDTO) => {
      if (editingGroup) {
        updateMutation.mutate(
          { id: editingGroup.id, data: values as AiModelGroupUpdateDTO },
          {
            onSuccess: () => {
              message.success(t('common.updateSuccess'));
              setCreateModalOpen(false);
            },
          },
        );
      } else {
        createMutation.mutate(values as AiModelGroupCreateDTO, {
          onSuccess: () => {
            message.success(t('common.createSuccess'));
            setCreateModalOpen(false);
          },
        });
      }
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => message.success(t('common.deleteSuccess')),
    });
  };

  const handleOpenMembers = (group: AiModelGroup) => {
    setMemberDrawerGroup(group);
    setMemberModelIds(group.items.map((i) => i.modelId));
  };

  const handleSaveMembers = () => {
    if (!memberDrawerGroup) return;
    const selectedModels = allModels.filter((model) => memberModelIds.includes(model.id));
    const normalizedUseCases = selectedModels
      .map((model) => model.useCase)
      .filter((value, index, array) => array.findIndex((candidate) => isSameUseCase(candidate, value)) === index);
    if (normalizedUseCases.length > 1) {
      message.error(t('system.modelGroup.sameUseCaseError'));
      return;
    }
    saveItemsMutation.mutate(
      { id: memberDrawerGroup.id, data: { modelIds: memberModelIds } },
      {
        onSuccess: () => {
          message.success(t('system.modelGroup.memberSaveSuccess'));
          setMemberDrawerGroup(null);
        },
      },
    );
  };

  const handleAutoGenerate = () => {
    autoForm.resetFields();
    setAutoGenerateModalOpen(true);
  };

  const handleAutoGenerateOk = () => {
    autoForm.validateFields().then((values) => {
      autoGenerateMutation.mutate(values, {
        onSuccess: () => {
          message.success(t('system.modelGroup.autoGenerateSuccess'));
          setAutoGenerateModalOpen(false);
        },
      });
    });
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIds = [...memberModelIds];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newIds.length) return;
    [newIds[index], newIds[target]] = [newIds[target], newIds[index]];
    setMemberModelIds(newIds);
  };

  const modelMap = Object.fromEntries(allModels.map((m) => [m.id, m]));
  const selectedGroupUseCase = memberDrawerGroup?.useCase
    || allModels.find((model) => model.id === memberModelIds[0])?.useCase;
  const selectableModels = selectedGroupUseCase
    ? allModels.filter((model) => isSameUseCase(model.useCase, selectedGroupUseCase))
    : allModels;
  const memberSelectOptions = selectableModels.map((model) => ({
    chipLabel: (
      <Space size={6}>
        <AiModelIcon
          modelId={model.modelId}
          modelName={model.name}
          provider={model.provider}
          providerCode={model.providerCode}
          size={16}
          type="color"
        />
        <span>{model.name}</span>
      </Space>
    ),
    label: (
      <div className="flex items-center justify-between gap-3">
        <Space size={8}>
          <AiModelIcon
            modelId={model.modelId}
            modelName={model.name}
            provider={model.provider}
            providerCode={model.providerCode}
            size={18}
            type="color"
          />
          <span>{model.name}</span>
        </Space>
        <Text type="secondary" className="text-xs">{formatModelUseCaseLabel(model.useCase)}</Text>
      </div>
    ),
    searchText: `${model.name} ${model.modelId} ${model.provider ?? ''} ${formatModelUseCaseLabel(model.useCase)}`,
    value: model.id,
  }));

  return (
    <div>
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message={t('system.modelGroup.alert.title')}
        description={t('system.modelGroup.alert.desc')}
      />

      {/* 操作栏 */}
      <div className="mb-4 flex justify-between items-center">
        <Text type="secondary">{t('system.modelGroup.description')}</Text>
        <Space>
          <Button icon={<ThunderboltOutlined />} onClick={handleAutoGenerate} disabled={!canUpdate}>
            {t('system.modelGroup.autoGenerate')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} disabled={!canUpdate}>
            {t('system.modelGroup.createGroup')}
          </Button>
        </Space>
      </div>

      {/* 模型组卡片列表 */}
      {isLoading ? null : groups.length === 0 ? (
        <Empty description={t('system.modelGroup.empty')} />
      ) : (
        <Row gutter={[16, 16]} align="stretch" style={{ minHeight: 300 }}>
          {groups.map((group) => (
              <Col key={group.id} xs={24} sm={12} lg={8} style={{ display: 'flex', flexDirection: 'column' }}>
              <Card
                size="small"
                style={{ flex: 1 }}
                title={
                  <Space>
                    <span className="font-semibold">{group.name}</span>
                    <Tag color={STRATEGY_COLORS[group.routingStrategy] ?? 'default'}>
                      {t(STRATEGY_LABELS[group.routingStrategy] ?? '', { defaultValue: group.routingStrategy })}
                    </Tag>
                    {group.useCase && (
                      <Tag color="blue">{formatModelUseCaseLabel(group.useCase)}</Tag>
                    )}
                  </Space>
                }
                extra={
                  <Space size="small">
                    <Tooltip title={t('system.modelGroup.manageMembers')}>
                      <Button
                        type="text"
                        size="small"
                        icon={<DragOutlined />}
                        onClick={() => handleOpenMembers(group)}
                        disabled={!canUpdate}
                      />
                    </Tooltip>
                    <Tooltip title={t('common.edit')}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(group)}
                        disabled={!canUpdate}
                      />
                    </Tooltip>
                    <Popconfirm
                      title={t('system.modelGroup.deleteConfirm')}
                      onConfirm={() => handleDelete(group.id)}
                    >
                      <Tooltip title={t('common.delete')}>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={!canUpdate} />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                }
                styles={{ body: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } }}
              >
                {group.description && (
                  <Text type="secondary" className="text-xs block mb-2" style={{padding: '0 8px'}}>
                    {group.description}
                  </Text>
                )}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <div className="space-y-1">
                    {group.items.length === 0 ? (
                      <Text type="secondary" className="text-xs">{t('system.modelGroup.noMembers')}</Text>
                    ) : (
                      group.items.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm min-w-0">
                          <Badge count={idx + 1} color={idx === 0 ? '#52c41a' : '#bfbfbf'} style={{ flexShrink: 0 }} />
                          <AiModelIcon
                            modelId={item.modelId}
                            modelName={item.modelName}
                            provider={item.provider}
                            size={16}
                            type="color"
                          />
                          <span className="truncate">{item.modelName ?? item.modelId}</span>
                          {item.provider && (
                            <Text type="secondary" className="text-xs truncate">({item.provider})</Text>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 创建/编辑模型组 Modal */}
      <Modal
        title={editingGroup ? t('system.modelGroup.editTitle') : t('system.modelGroup.createTitle')}
        open={createModalOpen}
        onOk={handleCreateOk}
        onCancel={() => setCreateModalOpen(false)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" className="mt-4">
          <Form.Item name="name" label={t('system.modelGroup.groupName')} rules={[{ required: true, message: t('system.modelGroup.groupNameRequired') }]}>
            <Input placeholder={t('system.modelGroup.groupNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label={t('common.description')}>
            <Input.TextArea rows={2} placeholder={t('system.modelGroup.optionalPlaceholder')} />
          </Form.Item>
          <Form.Item name="routingStrategy" label={t('system.modelGroup.routingStrategy')}>
            <Select>
              <Select.Option value="manual">{t('system.modelGroup.strategy.manualWithHint')}</Select.Option>
              <Select.Option value="by_price">{t('system.modelGroup.strategy.byPriceWithHint')}</Select.Option>
              <Select.Option value="by_performance">{t('system.modelGroup.strategy.byPerformanceWithHint')}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 自动生成 Modal */}
      <Modal
        title={t('system.modelGroup.autoGenerateTitle')}
        open={autoGenerateModalOpen}
        onOk={handleAutoGenerateOk}
        onCancel={() => setAutoGenerateModalOpen(false)}
        confirmLoading={autoGenerateMutation.isPending}
        destroyOnHidden
      >
        <Form form={autoForm} layout="vertical" className="mt-4">
          <Form.Item
            name="useCase"
            label="模型用途"
            rules={[{ required: true, message: '请选择模型用途' }]}
          >
            <Select
              placeholder="请选择自动成组的模型用途"
              options={useCaseItems.map((item) => ({ value: item.itemValue, label: item.itemLabel }))}
            />
          </Form.Item>
          <Form.Item name="strategy" label={t('system.modelGroup.generateStrategy')} rules={[{ required: true }]}>
            <Select placeholder={t('system.modelGroup.selectStrategy')}>
              <Select.Option value="by_price">{t('system.modelGroup.strategy.byPriceFirst')}</Select.Option>
              <Select.Option value="by_performance">{t('system.modelGroup.strategy.byPerformanceFirst')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="name" label={t('system.modelGroup.groupNameOptional')}>
            <Input placeholder={t('system.modelGroup.autoNamePlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 成员管理 Drawer */}
      <Drawer
        title={t('system.modelGroup.manageMembersTitle', { name: memberDrawerGroup?.name ?? '' })}
        open={!!memberDrawerGroup}
        onClose={() => setMemberDrawerGroup(null)}
        width={480}
        style={{ marginTop: '20px' }}
        footer={
          <div className="text-right">
            <Space>
              <Button onClick={() => setMemberDrawerGroup(null)}>{t('common.cancel')}</Button>
              <Button
                type="primary"
                loading={saveItemsMutation.isPending}
                onClick={handleSaveMembers}
              >
                {t('system.modelGroup.saveOrder')}
              </Button>
            </Space>
          </div>
        }
      >
        <div className="mb-4">
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder={t('system.modelGroup.selectModelsPlaceholder')}
            value={memberModelIds}
            onChange={setMemberModelIds}
            optionLabelProp="chipLabel"
            options={memberSelectOptions}
            optionFilterProp="searchText"
            disabled={!canUpdate}
          />
          <Text type="secondary" className="text-xs mt-1 block">
            {selectedGroupUseCase
              ? `当前仅可选择“${formatModelUseCaseLabel(selectedGroupUseCase)}”模型，保存后的顺序即降级顺序`
              : t('system.modelGroup.memberSortHint')}
          </Text>
        </div>

        <List
          dataSource={memberModelIds}
          renderItem={(modelId, index) => {
            const model = modelMap[modelId];
            return (
              <List.Item
                actions={[
                  <Button
                    key="up"
                    size="small"
                    type="text"
                    disabled={!canUpdate || index === 0}
                    onClick={() => moveItem(index, 'up')}
                  >
                    ↑
                  </Button>,
                  <Button
                    key="down"
                    size="small"
                    type="text"
                    disabled={!canUpdate || index === memberModelIds.length - 1}
                    onClick={() => moveItem(index, 'down')}
                  >
                    ↓
                  </Button>,
                  <Button
                    key="remove"
                    size="small"
                    type="text"
                    danger
                    disabled={!canUpdate}
                    onClick={() => setMemberModelIds(memberModelIds.filter((id) => id !== modelId))}
                  >
                    {t('system.modelGroup.remove')}
                  </Button>,
                ]}
              >
                <Space>
                  <Badge count={index + 1} color={index === 0 ? '#52c41a' : '#bfbfbf'} />
                  <AiModelIcon
                    modelId={model?.modelId}
                    modelName={model?.name}
                    provider={model?.provider}
                    providerCode={model?.providerCode}
                    size={18}
                    type="color"
                  />
                  <div className="min-w-0">
                    <div className="truncate max-w-[200px]">{model?.name ?? modelId}</div>
                    {model?.provider && (
                      <Text type="secondary" className="text-xs">{model.provider}</Text>
                    )}
                  </div>
                </Space>
              </List.Item>
            );
          }}
        />
      </Drawer>
    </div>
  );
}
