/**
 * 成员工具配置弹窗
 * 用于为 Team Agent 的团队成员配置工具
 */
import { useState, useMemo } from 'react';
import {
  Modal, Tabs, Checkbox, Input, Tag, Spin, Empty, message,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useBuiltinTools, useSaveMemberToolBindings } from '@/api/agent';
import type { BuiltinTool, AgentToolBinding } from '@/types/agent';

const { TabPane } = Tabs;

interface MemberToolConfigModalProps {
  open: boolean;
  memberId: string;
  memberName: string;
  existingBindings: AgentToolBinding[];
  onCancel: () => void;
  /** 保存成功后回调 */
  onSuccess: () => void;
}

export default function MemberToolConfigModal({
  open, memberId, memberName, existingBindings = [], onCancel, onSuccess,
}: MemberToolConfigModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const saveMutation = useSaveMemberToolBindings();

  const { data: builtinTools = [], isLoading } = useBuiltinTools();

  // 初始化已选工具（key 格式与 handleCheck/render 保持一致: builtin::toolCode）
  const initSelected = useMemo(() => {
    const s = new Set<string>();
    existingBindings.forEach((b) => s.add(`${b.sourceType}::${b.toolCode}`));
    return s;
  }, [existingBindings]);

  const handleCheck = (tool: BuiltinTool, checked: boolean) => {
    const key = `builtin::${tool.code}`;
    const next = new Set(selectedTools);
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    setSelectedTools(next);
  };

  const isSelected = (key: string) => selectedTools.has(key) || initSelected.has(key);

  const handleSave = async () => {
    // 合并初始选中 + 新选中的工具
    const allSelected = new Set([...initSelected, ...selectedTools]);
    const tools = Array.from(allSelected).map((key) => {
      const [sourceType, , toolCode] = key.split(':');
      return { toolCode, sourceType, enabled: true };
    });

    try {
      await saveMutation.mutateAsync({ memberId, data: { tools } });
      message.success(t('agent.memberTools.saveSuccess'));
      setSelectedTools(new Set());
      onSuccess();
    } catch {
      message.error(t('agent.memberTools.saveFailed'));
    }
  };

  const handleClose = () => {
    setSelectedTools(new Set());
    setSearch('');
    onCancel();
  };

  // 搜索过滤
  const filterBySearch = (list: BuiltinTool[]) => {
    if (!search.trim()) return list;
    const kw = search.toLowerCase();
    return list.filter(
      (t) =>
        t.code.toLowerCase().includes(kw) ||
        t.name?.toLowerCase().includes(kw) ||
        t.description?.toLowerCase().includes(kw),
    );
  };

  const builtinFiltered = filterBySearch(builtinTools);

  return (
    <Modal
      open={open}
      title={t('agent.memberTools.configToolsFor', { roleName: memberName })}
      onCancel={handleClose}
      onOk={handleSave}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      confirmLoading={saveMutation.isPending}
      width={560}
      destroyOnHidden
    >
      <div style={{ marginBottom: 12, color: '#595959', fontSize: 13 }}>
        {t('agent.memberTools.selectedCount', {
          count: new Set([...initSelected, ...selectedTools]).size,
        })}
      </div>

      <Input
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        placeholder={t('agent.toolSelector.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
        allowClear
      />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <Tabs defaultActiveKey="builtin" size="small">
          <TabPane tab={`${t('agent.toolSelector.sectionBuiltin')} (${builtinFiltered.length})`} key="builtin">
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {builtinFiltered.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.noData')} style={{ margin: '24px 0' }} />
              ) : (
                builtinFiltered.map((tool) => {
                  const key = `builtin::${tool.code}`;
                  const bound = initSelected.has(key);
                  return (
                    <div
                      key={tool.code}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        padding: '8px 4px',
                        borderBottom: '1px solid #f0f0f0',
                        gap: 8,
                      }}
                    >
                      <Checkbox
                        checked={isSelected(key)}
                        disabled={bound}
                        onChange={(e) => handleCheck(tool, e.target.checked)}
                        style={{ marginTop: 2, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <code style={{ fontSize: 13 }}>{tool.code}</code>
                          <span style={{ fontSize: 13, color: '#595959' }}>{tool.name}</span>
                          {bound && <Tag color="green" style={{ marginLeft: 4 }}>{t('agent.toolSelector.alreadyBound')}</Tag>}
                          {tool.osSupport && tool.osSupport !== 'all' && (
                            <Tag color="blue">{tool.osSupport}</Tag>
                          )}
                        </div>
                        {tool.description && (
                          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{tool.description}</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabPane>
        </Tabs>
      )}
    </Modal>
  );
}
