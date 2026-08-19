/**
 * 成员上下文配置弹窗
 * 用于为 Team Agent 的团队成员配置专属上下文
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Button, Empty, Input, Modal, Select, Space, Tag, message,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSaveMemberContextBindings } from '@/api/agent';
import { useContextList } from '@/api/context';
import type {
  AgentTeamMemberContextBinding,
  MemberContextBindingDTO,
} from '@/types/agent';
import type { Context } from '@/types/context';

const { TextArea } = Input;

interface MemberContextConfigModalProps {
  open: boolean;
  memberId: string;
  memberName: string;
  memberRoleType: string;
  existingBindings: AgentTeamMemberContextBinding[];
  onCancel: () => void;
  onSuccess: () => void;
}

function createDefaultBinding(sourceType: 'manual' | 'context_module'): AgentTeamMemberContextBinding {
  return {
    sourceType,
    title: '',
    content: '',
    sortOrder: 0,
  };
}

export default function MemberContextConfigModal({
  open,
  memberId,
  memberName,
  memberRoleType,
  existingBindings = [],
  onCancel,
  onSuccess,
}: MemberContextConfigModalProps) {
  const { t } = useTranslation();
  const saveMutation = useSaveMemberContextBindings();
  const { data: contextListData, isLoading: isLoadingContexts } = useContextList({ page: 1, size: 100 });
  const [bindings, setBindings] = useState<AgentTeamMemberContextBinding[]>([]);
  const requiresDedicatedContext = memberRoleType !== 'lead_agent';

  useEffect(() => {
    if (!open) {
      return;
    }
    setBindings(existingBindings.map((item, index) => ({
      ...item,
      sortOrder: item.sortOrder ?? index,
    })));
  }, [existingBindings, open]);

  const contextOptions = useMemo(
    () => (contextListData?.records ?? []).map((item: Context) => ({
      value: item.id,
      label: item.name,
    })),
    [contextListData],
  );

  const handleAddBinding = (sourceType: 'manual' | 'context_module') => {
    setBindings((prev) => [
      ...prev,
      {
        ...createDefaultBinding(sourceType),
        sortOrder: prev.length,
      },
    ]);
  };

  const handleBindingChange = (
    index: number,
    patch: Partial<AgentTeamMemberContextBinding>,
  ) => {
    setBindings((prev) => prev.map((item, currentIndex) => (
      currentIndex === index ? { ...item, ...patch } : item
    )));
  };

  const handleSourceTypeChange = (index: number, sourceType: 'manual' | 'context_module') => {
    handleBindingChange(index, {
      sourceType,
      contextId: sourceType === 'context_module' ? bindings[index]?.contextId : undefined,
      content: sourceType === 'manual' ? bindings[index]?.content : undefined,
    });
  };

  const handleContextChange = (index: number, contextId?: string) => {
    const target = contextOptions.find((item) => item.value === contextId);
    const current = bindings[index];
    handleBindingChange(index, {
      contextId,
      title: current?.title?.trim() ? current.title : target?.label,
    });
  };

  const handleRemoveBinding = (index: number) => {
    setBindings((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSave = async () => {
    const payload: MemberContextBindingDTO[] = [];
    for (let index = 0; index < bindings.length; index += 1) {
      const item = bindings[index];
      if (!item?.sourceType) {
        message.warning(t('agent.memberContexts.validationSource'));
        return;
      }
      if (item.sourceType === 'context_module' && !item.contextId) {
        message.warning(t('agent.memberContexts.validationContext'));
        return;
      }
      if (item.sourceType === 'manual' && !item.content?.trim()) {
        message.warning(t('agent.memberContexts.validationContent'));
        return;
      }
      const matchedContext = contextOptions.find((option) => option.value === item.contextId);
      payload.push({
        contextId: item.contextId,
        sourceType: item.sourceType,
        sourceConfig: item.sourceConfig,
        content: item.sourceType === 'manual' ? item.content?.trim() : undefined,
        title: item.title?.trim()
          || matchedContext?.label
          || t('agent.memberContexts.defaultTitle', { index: index + 1 }),
        sortOrder: index,
      });
    }
    if (requiresDedicatedContext && payload.length === 0) {
      message.warning('非 Leader 成员至少需要绑定一个专属上下文');
      return;
    }

    try {
      await saveMutation.mutateAsync({ memberId, data: payload });
      message.success(t('agent.memberContexts.saveSuccess'));
      onSuccess();
    } catch {
      message.error(t('agent.memberContexts.saveFail'));
    }
  };

  return (
    <Modal
      open={open}
      title={t('agent.memberContexts.configureFor', { roleName: memberName })}
      onCancel={onCancel}
      onOk={handleSave}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      confirmLoading={saveMutation.isPending}
      width={760}
      destroyOnHidden
    >
      <Alert
        type={requiresDedicatedContext ? 'warning' : 'info'}
        showIcon
        className="mb-4"
        title={t('agent.memberContexts.helperTitle')}
        description={requiresDedicatedContext
          ? '当前成员必须至少绑定一个专属上下文，Leader 可按需补充。'
          : t('agent.memberContexts.helperDesc')}
      />

      <Space className="mb-4" wrap>
        <Button icon={<PlusOutlined />} onClick={() => handleAddBinding('context_module')}>
          {t('agent.memberContexts.addContextModule')}
        </Button>
        <Button icon={<PlusOutlined />} onClick={() => handleAddBinding('manual')}>
          {t('agent.memberContexts.addManual')}
        </Button>
      </Space>

      {bindings.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={requiresDedicatedContext ? '当前成员尚未绑定专属上下文' : t('agent.memberContexts.empty')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 480, overflowY: 'auto' }}>
          {bindings.map((binding, index) => (
            <div
              key={`${binding.id ?? 'draft'}-${index}`}
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 16,
                background: '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Space size={8} wrap>
                  <Tag color={binding.sourceType === 'manual' ? 'gold' : 'blue'}>
                    {binding.sourceType === 'manual'
                      ? t('agent.create.manualInput')
                      : t('agent.create.fromContext')}
                  </Tag>
                  <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                    {t('agent.memberContexts.bindingLabel', { index: index + 1 })}
                  </span>
                </Space>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveBinding(index)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, marginBottom: 12 }}>
                <Select
                  value={binding.sourceType}
                  options={[
                    { value: 'context_module', label: t('agent.create.fromContext') },
                    { value: 'manual', label: t('agent.create.manualInput') },
                  ]}
                  onChange={(value) => handleSourceTypeChange(index, value as 'manual' | 'context_module')}
                />
                <Input
                  value={binding.title}
                  placeholder={t('agent.memberContexts.titlePlaceholder')}
                  onChange={(event) => handleBindingChange(index, { title: event.target.value })}
                />
              </div>

              {binding.sourceType === 'context_module' ? (
                <Select
                  showSearch
                  allowClear
                  loading={isLoadingContexts}
                  value={binding.contextId}
                  placeholder={t('agent.memberContexts.selectContext')}
                  options={contextOptions}
                  optionFilterProp="label"
                  onChange={(value) => handleContextChange(index, value)}
                />
              ) : (
                <TextArea
                  value={binding.content}
                  rows={5}
                  placeholder={t('agent.memberContexts.contentPlaceholder')}
                  onChange={(event) => handleBindingChange(index, { content: event.target.value })}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
