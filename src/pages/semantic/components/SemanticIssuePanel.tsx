import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Badge, Button, Empty, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { SemanticValidationIssue, SemanticValidationResult } from '@/types/semantic';

interface SemanticIssuePanelProps {
  result?: SemanticValidationResult;
  validating?: boolean;
  onSelectNode: (nodeId: string) => void;
}

const { Text } = Typography;

const issueIcon = (issue: SemanticValidationIssue) => {
  if (issue.severity === 'error') return <CloseCircleOutlined className="is-error" />;
  if (issue.severity === 'warning') return <WarningOutlined className="is-warning" />;
  return <CheckCircleOutlined className="is-info" />;
};

export default function SemanticIssuePanel({ result, validating, onSelectNode }: SemanticIssuePanelProps) {
  const { t } = useTranslation();
  return (
    <div className="semantic-issues">
      <div className="semantic-issues__header">
        <strong>{t('semantic.workbench.issues.title')}</strong>
        <Badge
          status={validating ? 'processing' : result?.valid ? 'success' : result ? 'error' : 'default'}
          text={validating
            ? t('semantic.status.version.validating')
            : result?.valid
              ? t('semantic.workbench.issues.passed')
              : t('semantic.workbench.issues.count', { count: result?.issues.length ?? 0 })}
        />
      </div>
      {!result ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('semantic.workbench.issues.empty')} />
      ) : result.valid ? (
        <div className="semantic-issues__success"><CheckCircleOutlined /> {t('semantic.workbench.issues.passedDescription')}</div>
      ) : (
        <div className="semantic-issue-list" role="list">
          {result.issues.map((issue, index) => (
            <div className="semantic-issue-item" role="listitem" key={`${issue.code}-${issue.nodeId ?? index}`}>
              <span className="semantic-issue-item__icon">{issueIcon(issue)}</span>
              <span className="semantic-issue-item__copy">
                <Text>{issue.message}</Text>
                <small>{[issue.code, issue.path].filter(Boolean).join(' · ')}</small>
              </span>
              {issue.nodeId && (
                <Button type="link" size="small" onClick={() => onSelectNode(issue.nodeId as string)}>
                  {t('semantic.workbench.issues.locate')}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
