/**
 * 敏感字段输入组件
 * 支持显示/隐藏切换、加密存储提示
 */
import { useState } from 'react';
import {
  Input,
  Button,
  Tooltip,
  Space,
  Tag,
} from 'antd';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  SyncOutlined,
} from '@ant-design/icons';

interface SensitiveFieldInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onGenerate?: () => void;
  encryptHint?: string;
}

export default function SensitiveFieldInput({
  value,
  onChange,
  placeholder = '请输入敏感信息',
  disabled = false,
  onGenerate,
  encryptHint = '此字段将加密存储',
}: SensitiveFieldInputProps) {
  const [visible, setVisible] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);

  const displayValue = visible ? value : value ? '••••••••' : '';
  const isMasked = value && !visible;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setIsEncrypted(false);
    onChange?.(newValue);
  };

  const handleBlur = () => {
    if (value && !visible) {
      setIsEncrypted(true);
    }
  };

  return (
    <Space.Compact className="w-full">
      <Input
        type={visible ? 'text' : 'password'}
        value={isMasked ? displayValue : value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        prefix={<LockOutlined style={{ color: '#faad14' }} />}
        suffix={
          <Space size={4}>
            <Tooltip title={visible ? '隐藏' : '显示'}>
              <Button
                type="text"
                size="small"
                icon={visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setVisible(!visible)}
              />
            </Tooltip>
            {onGenerate && (
              <Tooltip title="重新生成">
                <Button
                  type="text"
                  size="small"
                  icon={<SyncOutlined />}
                  onClick={() => {
                    onGenerate();
                    setIsEncrypted(false);
                  }}
                />
              </Tooltip>
            )}
          </Space>
        }
        className="flex-1"
      />
      {isEncrypted && (
        <Tooltip title={encryptHint}>
          <Tag color="gold" icon={<LockOutlined />}>
            已加密
          </Tag>
        </Tooltip>
      )}
    </Space.Compact>
  );
}
