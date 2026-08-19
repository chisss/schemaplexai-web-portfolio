/**
 * 分支树弹窗组件
 * 使用 Mermaid.js 渲染 Git 分支图
 */
import { useEffect, useRef, useState } from 'react';
import { Modal, Spin, Typography, Tag, Space, Empty, Card, Divider } from 'antd';
import { BranchesOutlined, CheckCircleOutlined, TagOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useBranches } from '@/api/workspace';
import mermaid from 'mermaid';

const { Text } = Typography;

interface BranchTreeModalProps {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
  focusBranch?: string;
}

// Mermaid 懒初始化（避免 SSR 问题）
let mermaidInited = false;
const ensureMermaidInited = () => {
  if (mermaidInited) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      primaryColor: '#1677ff',
      primaryTextColor: '#fff',
      primaryBorderColor: '#1677ff',
      lineColor: '#8c8c8c',
      secondaryColor: '#52c41a',
      tertiaryColor: '#faad14',
    },
    gitGraph: {
      showCommitLabel: true,
      mainBranchName: 'master',
    },
    securityLevel: 'strict',
  });
  mermaidInited = true;
};

// 安全化分支名（防止 XSS 和语法错误）
const toBranchId = (name: string, index: number): string => {
  const normalized = name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^[^a-zA-Z_]/, 'b');
  return normalized || `branch_${index}`;
};

// 安全化提交 ID（只保留合法字符）
const toCommitLabel = (raw: string | undefined, fallback: string): string => {
  if (!raw) return fallback;
  const cleaned = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 7);
  return cleaned || fallback;
};

export default function BranchTreeModal({ workspaceId, open, onClose, focusBranch }: BranchTreeModalProps) {
  const { t } = useTranslation();
  const { data: branches, isLoading } = useBranches(workspaceId);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const renderVersionRef = useRef(0);
  const [rendered, setRendered] = useState(false);

  // 确保 Mermaid 已初始化
  useEffect(() => {
    ensureMermaidInited();
  }, []);

  // 生成 Mermaid gitGraph 定义
  const generateGitGraph = () => {
    if (!branches || branches.length === 0) return '';

    const masterBranch = branches.find(b => b.name === 'master');
    const currentBranch = branches.find(b => b.isCurrent);
    const otherBranches = branches.filter(b => b.name !== 'master' && !b.isCurrent);
    const branchAlias = new Map(branches.map((b, idx) => [b.name, toBranchId(b.name, idx)]));

    let graph = 'gitGraph TB:\n';

    // 添加 master 分支
    if (masterBranch) {
      graph += `    commit id: "${toCommitLabel(masterBranch.commitId, 'init')}"\n`;
    } else {
      graph += '    commit id: "init"\n';
    }

    // 当前分支
    if (currentBranch && currentBranch.name !== 'master') {
      const currentAlias = branchAlias.get(currentBranch.name)!;
      graph += `    branch ${currentAlias}\n`;
      graph += `    checkout ${currentAlias}\n`;
      graph += `    commit id: "${toCommitLabel(currentBranch.commitId, 'wip')}"\n`;
      graph += '    checkout master\n';
    }

    // 其他分支
    otherBranches.forEach(branch => {
      if (branch.name !== 'master' && branch.name !== currentBranch?.name) {
        const alias = branchAlias.get(branch.name)!;
        graph += `    branch ${alias}\n`;
        graph += `    commit id: "${toCommitLabel(branch.commitId, 'wip')}"\n`;
        graph += '    checkout master\n';
      }
    });

    return graph;
  };

  // 渲染 mermaid 图（带竞态保护）
  useEffect(() => {
    if (!open || !branches || branches.length === 0 || !mermaidRef.current) {
      setRendered(false);
      return;
    }

    const graphDefinition = generateGitGraph();
    if (!graphDefinition) {
      setRendered(false);
      return;
    }

    // 递增版本号，用于检测竞态
    const renderVersion = ++renderVersionRef.current;
    setRendered(false);

    mermaid.render(`mermaid-gitgraph-${workspaceId}-${renderVersion}`, graphDefinition)
      .then(({ svg }) => {
        // 仅当版本未过期且 Modal 仍打开时更新
        if (renderVersion === renderVersionRef.current && open && mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
          setRendered(true);
        }
      })
      .catch((error) => {
        if (renderVersion === renderVersionRef.current) {
          console.error('Mermaid render error:', error);
          setRendered(false);
        }
      });

    return () => {
      // 组件卸载或重新渲染时递增版本号，使旧渲染无效
      renderVersionRef.current += 1;
    };
  }, [open, branches, workspaceId]);

  // Modal 关闭时清理
  useEffect(() => {
    if (!open && mermaidRef.current) {
      mermaidRef.current.innerHTML = '';
      setRendered(false);
    }
  }, [open]);

  return (
    <Modal
      title={
        <Space>
          <BranchesOutlined />
          <span>{t('workspace.branchTree')}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      bodyStyle={{ minHeight: 400, padding: 16 }}
    >
      {isLoading ? (
        <div className="flex justify-center items-center" style={{ minHeight: 200 }}>
          <Spin size="large" />
        </div>
      ) : branches && branches.length > 0 ? (
        <div>
          {/* 分支概览 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space wrap size={[16, 8]}>
              <Tag icon={<BranchesOutlined />} color="blue">
                {t('workspace.totalBranches')}: {branches.length}
              </Tag>
              {branches.find(b => b.isCurrent) && (
                <Tag icon={<CheckCircleOutlined />} color="green">
                  {t('workspace.current')}: {branches.find(b => b.isCurrent)?.name}
                </Tag>
              )}
              {branches.find(b => b.name === 'master') && (
                <Tag icon={<TagOutlined />} color="default">
                  master
                </Tag>
              )}
            </Space>
          </Card>

          <Divider style={{ margin: '12px 0' }} />

          {/* Mermaid GitGraph 可视化 */}
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              {t('workspace.branches')}
            </Text>
            <div
              ref={mermaidRef}
              className="flex justify-center"
              style={{
                minHeight: 200,
                background: '#fafafa',
                borderRadius: 8,
                padding: 16,
                overflow: 'auto',
              }}
            />
            {!rendered && (
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
                {t('workspace.gitGraphRendering')}
              </Text>
            )}
          </div>

          <Divider style={{ margin: '12px 0' }} />

          {/* 分支列表 */}
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              {t('workspace.branchList')}
            </Text>
            <div style={{ maxHeight: 200, overflow: 'auto' }}>
              {branches.map((branch) => (
                <div
                  key={branch.name}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 4,
                    marginBottom: 4,
                    background: branch.name === focusBranch ? '#e6f7ff' :
                               branch.isCurrent ? '#f6ffed' :
                               branch.name === 'master' ? '#fafafa' : 'transparent',
                    border: branch.name === focusBranch ? '1px solid #1677ff' : '1px solid transparent',
                  }}
                >
                  <Space>
                    <BranchesOutlined style={{ color: branch.isCurrent ? '#52c41a' : '#8c8c8c' }} />
                    <Text strong={branch.isCurrent}>{branch.name}</Text>
                    {branch.isCurrent && <Tag color="green">{t('workspace.current')}</Tag>}
                    {branch.name === 'master' && <Tag>默认</Tag>}
                    {branch.commitId && (
                      <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {branch.commitId.substring(0, 7)}
                      </Text>
                    )}
                  </Space>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Empty description={t('workspace.noBranches')} style={{ minHeight: 200 }} />
      )}
    </Modal>
  );
}
