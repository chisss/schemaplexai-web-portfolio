/**
 * Monaco Editor 组件
 * 封装 @monaco-editor/react
 */
import Editor, { type OnMount } from '@monaco-editor/react';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  height?: string | number;
  readOnly?: boolean;
  options?: Record<string, any>;
}

export default function MonacoEditor({
  value,
  onChange,
  language = 'markdown',
  height = '600px',
  readOnly = false,
  options = {},
}: MonacoEditorProps) {
  const { theme } = useAppStore();
  const { t } = useTranslation();

  const handleEditorDidMount: OnMount = (editor, _monaco) => {
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      ...options,
    });
  };

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={onChange}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      loading={<Spin description={t('monacoEditor.loading')} />}
      onMount={handleEditorDidMount}
      options={{
        readOnly,
        automaticLayout: true,
        ...options,
      }}
    />
  );
}
