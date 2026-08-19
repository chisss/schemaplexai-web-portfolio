import { Drawer, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import WorkflowInstanceDetailContent from '@/pages/workflow/components/WorkflowInstanceDetailContent';

interface WorkflowInstanceDrawerProps {
  open: boolean;
  instanceId?: string;
  onClose: () => void;
}

export default function WorkflowInstanceDrawer({ open, instanceId, onClose }: WorkflowInstanceDrawerProps) {
  const { t } = useTranslation();

  return (
    <Drawer
      title={t('spec.workflowDetailTitle')}
      open={open}
      onClose={onClose}
      size="large"
      destroyOnClose
    >
      {instanceId ? (
        <WorkflowInstanceDetailContent instanceId={instanceId} />
      ) : (
        <Empty description={t('spec.workflowInstanceEmpty')} />
      )}
    </Drawer>
  );
}
