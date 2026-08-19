/**
 * 工具选择器弹窗
 * 用于 Agent 相关页面选择可绑定工具
 */
import { useMemo, useState } from 'react';
import {
  Modal, Tabs, Checkbox, Input, Tag, Spin, Alert, Empty, Segmented, Typography,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAvailableTools } from '@/api/agent';
import type { AvailableTool } from '@/types/agent';
import { buildToolSelectionKey } from './toolSelection';

type ToolCategoryFilter = 'all' | 'system' | 'web' | 'code' | 'skill' | 'api_gateway' | 'mcp';

interface ToolSelectorModalProps {
  open: boolean;
  agentId: string;
  onCancel: () => void;
  /** 确认选择后回调，返回选中的工具列表 */
  onConfirm: (tools: AvailableTool[]) => void;
  /** 初始选中项 */
  initialSelectedKeys?: string[];
  /** 创建向导场景允许覆盖已绑定工具 */
  allowAlreadyBoundSelection?: boolean;
}

export default function ToolSelectorModal({
  open,
  agentId,
  onCancel,
  onConfirm,
  initialSelectedKeys = [],
  allowAlreadyBoundSelection = false,
}: ToolSelectorModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ToolCategoryFilter>('all');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const { data: tools = [], isLoading, isError } = useAvailableTools(agentId);

  // 按 sourceType 分组
  const grouped = useMemo(() => {
    const builtin: AvailableTool[] = [];
    const skill: AvailableTool[] = [];
    const apiGateway: AvailableTool[] = [];
    const mcp: AvailableTool[] = [];
    for (const tool of tools) {
      if (tool.sourceType === 'builtin') builtin.push(tool);
      else if (tool.sourceType === 'skill') skill.push(tool);
      else if (tool.sourceType === 'api_gateway') apiGateway.push(tool);
      else if (tool.sourceType === 'mcp') mcp.push(tool);
    }
    return { builtin, skill, apiGateway, mcp };
  }, [tools]);

  // 搜索过滤
  const filterBySearch = (list: AvailableTool[]) => {
    const keyword = search.trim().toLowerCase();
    const kw = search.toLowerCase();
    return list.filter((tool) => {
      const matchedCategory = categoryFilter === 'all' || tool.category === categoryFilter;
      if (!matchedCategory) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return tool.toolCode.toLowerCase().includes(kw)
        || tool.name?.toLowerCase().includes(kw)
        || tool.description?.toLowerCase().includes(kw);
    });
  };

  const builtinFiltered = filterBySearch(grouped.builtin);
  const skillFiltered = filterBySearch(grouped.skill);
  const apiGatewayFiltered = filterBySearch(grouped.apiGateway);
  const mcpFiltered = filterBySearch(grouped.mcp);

  const handleCheck = (tool: AvailableTool, checked: boolean) => {
    const key = buildToolSelectionKey(tool);
    const next = new Set(selectedKeys);
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    setSelectedKeys(next);
  };

  const isSelected = (tool: AvailableTool) => {
    const key = buildToolSelectionKey(tool);
    return selectedKeys.has(key) || (tool.sourceType === 'builtin' && selectedKeys.has(tool.toolCode));
  };

  const handleConfirm = () => {
    const selected = tools.filter((t) => isSelected(t));
    onConfirm(selected);
    setSelectedKeys(new Set());
    setSearch('');
    setCategoryFilter('all');
  };

  const handleClose = () => {
    setSelectedKeys(new Set());
    setSearch('');
    setCategoryFilter('all');
    onCancel();
  };

  const renderToolList = (list: AvailableTool[], disabled = false) => (
    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
      {list.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.noData')} style={{ margin: '24px 0' }} />
      ) : (
        list.map((tool) => (
          <div
            key={buildToolSelectionKey(tool)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              padding: '8px 4px',
              borderBottom: '1px solid #f0f0f0',
              gap: 8,
            }}
          >
            <Checkbox
              checked={isSelected(tool)}
              disabled={disabled || (!allowAlreadyBoundSelection && tool.alreadyBound)}
              onChange={(e) => handleCheck(tool, e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <code style={{ fontSize: 13 }}>{tool.toolCode}</code>
                <span style={{ fontSize: 13, color: '#595959' }}>{tool.name}</span>
                {tool.alreadyBound && !allowAlreadyBoundSelection && <Tag color="green" style={{ marginLeft: 4 }}>{t('agent.toolSelector.alreadyBound')}</Tag>}
                {tool.category && <Tag>{tool.category}</Tag>}
                {tool.osSupport && tool.osSupport !== 'all' && (
                  <Tag color="blue">{tool.osSupport}</Tag>
                )}
              </div>
              {tool.description && (
                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{tool.description}</div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Modal
      open={open}
      title={t('agent.toolSelector.title')}
      afterOpenChange={(nextOpen) => {
        if (!nextOpen) {
          return;
        }
        setSelectedKeys(new Set(initialSelectedKeys));
      }}
      onCancel={handleClose}
      onOk={handleConfirm}
      okText={t('agent.toolSelector.confirmAdd')}
      cancelText={t('common.cancel')}
      okButtonProps={{ disabled: selectedKeys.size === 0 }}
      width={640}
      destroyOnHidden
    >
      <Input.Search
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        placeholder={t('agent.toolSelector.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
        allowClear
      />

      <div style={{ marginBottom: 12 }}>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          分类筛选
        </Typography.Text>
        <Segmented<ToolCategoryFilter>
          options={[
            { label: t('common.all'), value: 'all' },
            { label: 'System', value: 'system' },
            { label: 'Web', value: 'web' },
            { label: 'Code', value: 'code' },
            { label: 'Skill', value: 'skill' },
            { label: t('agent.sourceExternalApi'), value: 'api_gateway' },
            { label: 'MCP', value: 'mcp' },
          ]}
          value={categoryFilter}
          onChange={(value) => setCategoryFilter(value as ToolCategoryFilter)}
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : isError ? (
        <Alert type="error" title={t('common.error')} style={{ marginBottom: 12 }} />
      ) : (
        <Tabs
          defaultActiveKey="builtin"
          size="small"
          items={[
            {
              key: 'builtin',
              label: `${t('agent.toolSelector.sectionBuiltin')} (${builtinFiltered.length})`,
              children: renderToolList(builtinFiltered),
            },
            {
              key: 'skill',
              label: `${t('agent.toolSelector.sectionSkill')} (${skillFiltered.length})`,
              children: renderToolList(skillFiltered),
            },
            {
              key: 'api_gateway',
              label: `${t('agent.toolSelector.sectionExternalApi')} (${apiGatewayFiltered.length})`,
              children: renderToolList(apiGatewayFiltered),
            },
            {
              key: 'mcp',
              label: `${t('agent.toolSelector.sectionMcp')} (${mcpFiltered.length})`,
              children: renderToolList(mcpFiltered),
            },
          ]}
        />
      )}

      {selectedKeys.size > 0 && (
        <div style={{ marginTop: 8, color: '#595959', fontSize: 13 }}>
          {t('agent.toolSelector.selectedCount', { count: selectedKeys.size })}
        </div>
      )}
    </Modal>
  );
}
