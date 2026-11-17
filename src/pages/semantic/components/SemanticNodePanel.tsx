import { useMemo, useState } from 'react';
import { ApartmentOutlined, FontSizeOutlined, SearchOutlined } from '@ant-design/icons';
import { Badge, Empty, Input, Segmented, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { SemanticGraphNode, SemanticNodeKind } from '@/types/semantic';

interface SemanticNodePanelProps {
  nodes: SemanticGraphNode[];
  selectedNodeId?: string;
  onSelect: (nodeId: string) => void;
}

const { Text } = Typography;

export default function SemanticNodePanel({ nodes, selectedNodeId, onSelect }: SemanticNodePanelProps) {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [kind, setKind] = useState<'all' | SemanticNodeKind>('all');
  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLocaleLowerCase();
    return nodes.filter((node) => {
      const matchesKind = kind === 'all' || node.kind === kind;
      const matchesKeyword = !normalized || [node.name, node.label, ...node.synonyms]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(normalized));
      return matchesKind && matchesKeyword;
    });
  }, [keyword, kind, nodes]);

  return (
    <div className="semantic-node-panel">
      <div className="semantic-panel-heading">
        <div>
          <strong>{t('semantic.workbench.nodes.title')}</strong>
          <span>{t('semantic.workbench.nodes.count', { count: nodes.length })}</span>
        </div>
        <Badge count={filtered.length} showZero color="#1677ff" />
      </div>
      <Input
        allowClear
        prefix={<SearchOutlined />}
        value={keyword}
        placeholder={t('semantic.workbench.nodes.searchPlaceholder')}
        onChange={(event) => setKeyword(event.target.value)}
      />
      <Segmented
        block
        value={kind}
        options={[
          { label: t('semantic.workbench.nodes.all'), value: 'all' },
          { label: t('semantic.workbench.nodes.concepts'), value: 'concept' },
          { label: t('semantic.workbench.nodes.properties'), value: 'property' },
        ]}
        onChange={(value) => setKind(value as 'all' | SemanticNodeKind)}
      />
      <div className="semantic-node-list" role="list">
        {filtered.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('semantic.workbench.nodes.empty')} /> : filtered.map((node) => (
          <div key={node.id} role="listitem" className={node.id === selectedNodeId ? 'semantic-node-item is-selected' : 'semantic-node-item'}>
            <button type="button" onClick={() => onSelect(node.id)}>
              <span className={`semantic-node-kind semantic-node-kind--${node.kind}`}>
                {node.kind === 'concept' ? <ApartmentOutlined /> : <FontSizeOutlined />}
              </span>
              <span className="semantic-node-copy">
                <Text strong ellipsis>{node.label || node.name}</Text>
                <Text type="secondary" ellipsis>{node.name}</Text>
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
