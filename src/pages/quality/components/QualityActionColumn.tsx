import { Button, Space } from 'antd';

interface QualityActionColumnProps<T> {
  record: T;
  onHandle: (record: T) => void;
}

export default function QualityActionColumn<T>({ record, onHandle }: QualityActionColumnProps<T>) {
  return (
    <Space>
      <Button type="primary" size="small" onClick={() => onHandle(record)}>
        处理
      </Button>
    </Space>
  );
}
