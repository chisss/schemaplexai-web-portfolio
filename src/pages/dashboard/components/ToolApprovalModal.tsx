import { Modal, Typography, Space, Button, Tag } from 'antd';
import { CheckCircleOutlined, SafetyOutlined, StopOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { createAmendment } from '@/api/amendment';
import { submitExecutionInput } from '@/api/agent';

const { Text, Paragraph } = Typography;

interface ToolApprovalModalProps {
  open: boolean;
  agentId: string;
  executionId: string;
  toolCode: string;
  command: string;
  onClose: () => void;
}

/**
 * 工具审批弹窗（渐进式信任）
 * 用户可选择：仅本次批准、批准并记住、拒绝
 */
export default function ToolApprovalModal({
  open, agentId, executionId, toolCode, command, onClose,
}: ToolApprovalModalProps) {
  const { t } = useTranslation();

  const handleApproveOnce = async () => {
    await submitExecutionInput(agentId, executionId, { message: '__APPROVE__' });
    onClose();
  };

  const handleApproveAndRemember = async () => {
    await submitExecutionInput(agentId, executionId, { message: '__APPROVE__' });
    try {
      await createAmendment({ agentId, toolCode, command, scope: 'AGENT' });
    } catch {
      // 规则创建失败不阻塞审批流程
    }
    onClose();
  };

  const handleDeny = async () => {
    await submitExecutionInput(agentId, executionId, { message: '__DENY__' });
    onClose();
  };

  return (
    <Modal
      open={open}
      title={
        <Space>
          <SafetyOutlined style={{ color: '#faad14' }} />
          {t('amendment.approvalRequired', '需要审批')}
        </Space>
      }
      footer={null}
      onCancel={onClose}
      width={480}
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">{t('amendment.toolLabel', '工具')}:</Text>
        <Tag color="blue" style={{ marginLeft: 8 }}>{toolCode}</Tag>
      </div>
      <Paragraph
        code
        style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.04)', borderRadius: 6 }}
      >
        {command}
      </Paragraph>
      <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button icon={<StopOutlined />} danger onClick={handleDeny}>
          {t('amendment.deny', '拒绝')}
        </Button>
        <Button icon={<CheckCircleOutlined />} onClick={handleApproveOnce}>
          {t('amendment.approveOnce', '仅本次批准')}
        </Button>
        <Button type="primary" icon={<SafetyOutlined />} onClick={handleApproveAndRemember}>
          {t('amendment.approveAndRemember', '批准并记住')}
        </Button>
      </Space>
    </Modal>
  );
}
