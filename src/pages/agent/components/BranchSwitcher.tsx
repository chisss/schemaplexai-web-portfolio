/**
 * 分支切换器组件
 * 允许用户在工作空间内切换不同分支
 */
import { Select, Space, Typography, Tag } from 'antd';
import { BranchesOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface Branch {
  name: string;
  isProtected: boolean;
  isCurrent: boolean;
  lastCommitAt?: string;
}

interface BranchSwitcherProps {
  branches: Branch[];
  currentBranch?: string;
  onSwitch: (branchName: string) => void;
  disabled?: boolean;
}

export default function BranchSwitcher({
  branches,
  currentBranch,
  onSwitch,
  disabled,
}: BranchSwitcherProps) {
  const { t } = useTranslation();

  const options = branches.map((branch) => ({
    value: branch.name,
    label: (
      <Space>
        <BranchesOutlined />
        <Text>{branch.name}</Text>
        {branch.isProtected && (
          <Tag color="orange" style={{ fontSize: 10, padding: '0 4px' }}>
            {t('workspace.protected')}
          </Tag>
        )}
        {branch.isCurrent && (
          <Tag color="blue" style={{ fontSize: 10, padding: '0 4px' }}>
            {t('workspace.current')}
          </Tag>
        )}
      </Space>
    ),
    disabled: branch.isProtected,
  }));

  return (
    <Select
      value={currentBranch}
      options={options}
      onChange={onSwitch}
      disabled={disabled}
      style={{ minWidth: 200 }}
      placeholder={t('workspace.selectBranch')}
    />
  );
}
