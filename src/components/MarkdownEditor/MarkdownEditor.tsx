/**
 * Markdown 编辑器组件
 * 编辑/预览双 Tab 切换，兼容 Ant Design Form.Item value/onChange
 */
import { useState } from 'react';
import { Tabs, Input } from 'antd';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import MarkdownPreview from '@/components/MarkdownPreview/MarkdownPreview';

interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  rows?: number;
}

export default function MarkdownEditor({
  value = '',
  onChange,
  placeholder,
  minHeight = 160,
  rows = 8,
}: MarkdownEditorProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('edit');
  const resolvedPlaceholder = placeholder ?? t('markdownEditor.placeholder');

  return (
    <div
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
      className="markdown-editor-wrap focus-within:border-blue-400"
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="small"
        style={{ padding: '0 8px' }}
        items={[
          {
            key: 'edit',
            label: (
              <span>
                <EditOutlined />
                {t('markdownEditor.edit')}
              </span>
            ),
            children: (
              <Input.TextArea
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={resolvedPlaceholder}
                rows={rows}
                style={{
                  border: 'none',
                  boxShadow: 'none',
                  resize: 'vertical',
                  minHeight,
                  borderRadius: 0,
                  padding: '8px 12px',
                  fontFamily: 'monospace',
                  fontSize: 13,
                }}
              />
            ),
          },
          {
            key: 'preview',
            label: (
              <span>
                <EyeOutlined />
                {t('markdownEditor.preview')}
              </span>
            ),
            children: (
              <div
                style={{
                  minHeight,
                  padding: '8px 12px 12px',
                  overflowY: 'auto',
                }}
              >
                {value ? (
                  <MarkdownPreview content={value} />
                ) : (
                  <span style={{ color: '#bbb', fontSize: 13 }}>
                    {t('markdownEditor.noContent')}
                  </span>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
