/**
 * Markdown 预览组件
 * 使用 react-markdown + 语法高亮
 */
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // 代码高亮样式
import type { ComponentPropsWithoutRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

type MarkdownCodeProps = ComponentPropsWithoutRef<'code'> & {
  inline?: boolean;
};

export default function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const textTone = isDark ? 'text-slate-200' : 'text-slate-700';
  const mutedTone = isDark ? 'text-slate-400' : 'text-slate-500';
  const headingTone = isDark ? 'text-slate-50' : 'text-slate-900';
  const borderTone = isDark ? 'border-slate-700/70' : 'border-slate-200/80';
  const surfaceTone = isDark
    ? 'bg-[linear-gradient(180deg,rgba(15,23,42,0.94)_0%,rgba(15,23,42,0.84)_100%)]'
    : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_100%)]';
  const quoteTone = isDark
    ? 'border-amber-400/25 bg-amber-500/10'
    : 'border-amber-500/25 bg-amber-50/80';
  const inlineCodeTone = isDark
    ? 'border-slate-700 bg-slate-800/80 text-sky-200'
    : 'border-slate-200 bg-slate-100/90 text-sky-700';
  const codeBlockTone = isDark
    ? 'border-slate-700/80 bg-slate-950 text-slate-100'
    : 'border-slate-200/80 bg-slate-950 text-slate-100';
  const linkTone = isDark ? 'text-sky-300 hover:text-sky-200' : 'text-sky-700 hover:text-sky-600';
  const tableBorderColor = isDark ? 'rgba(71,85,105,0.82)' : 'rgba(226,232,240,0.92)';
  const tableHeadBg = isDark ? 'rgba(30,41,59,0.86)' : 'rgba(248,250,252,0.98)';
  const documentTextColor = isDark ? '#e2e8f0' : '#334155';
  const headingColor = isDark ? '#f8fafc' : '#0f172a';
  const blockquoteBackground = isDark ? 'rgba(245,158,11,0.10)' : 'rgba(255,251,235,0.95)';
  const blockquoteBorder = isDark ? 'rgba(251,191,36,0.72)' : 'rgba(245,158,11,0.78)';
  const inlineCodeStyle = isDark
    ? { backgroundColor: 'rgba(15,23,42,0.84)', color: '#7dd3fc', borderColor: 'rgba(51,65,85,0.9)' }
    : { backgroundColor: 'rgba(241,245,249,0.96)', color: '#0369a1', borderColor: 'rgba(226,232,240,0.92)' };

  const components: Components = {
    a: ({ className: nodeClassName, ...props }) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className={`font-medium underline decoration-sky-400/50 underline-offset-4 transition ${linkTone} ${nodeClassName || ''}`}
      />
    ),
    h1: ({ className: nodeClassName, ...props }) => (
      <h1
        {...props}
        className={`mt-0 mb-5 text-[30px] font-semibold leading-[1.2] tracking-[-0.02em] ${headingTone} ${nodeClassName || ''}`}
      />
    ),
    h2: ({ className: nodeClassName, ...props }) => (
      <h2
        {...props}
        className={`mt-9 mb-4 border-b pb-3 text-[24px] font-semibold leading-[1.25] tracking-[-0.02em] ${headingTone} ${borderTone} ${nodeClassName || ''}`}
      />
    ),
    h3: ({ className: nodeClassName, ...props }) => (
      <h3
        {...props}
        className={`mt-7 mb-3 text-[19px] font-semibold leading-[1.35] ${headingTone} ${nodeClassName || ''}`}
      />
    ),
    h4: ({ className: nodeClassName, ...props }) => (
      <h4
        {...props}
        className={`mt-6 mb-3 text-base font-semibold leading-7 ${headingTone} ${nodeClassName || ''}`}
      />
    ),
    p: ({ className: nodeClassName, ...props }) => (
      <p
        {...props}
        className={`my-4 text-[15px] leading-8 ${textTone} ${nodeClassName || ''}`}
        style={{ color: documentTextColor }}
      />
    ),
    ul: ({ className: nodeClassName, ...props }) => (
      <ul
        {...props}
        className={`my-4 list-disc space-y-2 pl-6 text-[15px] leading-8 ${textTone} ${nodeClassName || ''}`}
        style={{ color: documentTextColor, paddingLeft: 24, margin: '16px 0' }}
      />
    ),
    ol: ({ className: nodeClassName, ...props }) => (
      <ol
        {...props}
        className={`my-4 list-decimal space-y-2 pl-6 text-[15px] leading-8 ${textTone} ${nodeClassName || ''}`}
        style={{ color: documentTextColor, paddingLeft: 24, margin: '16px 0' }}
      />
    ),
    li: ({ className: nodeClassName, ...props }) => (
      <li
        {...props}
        className={`pl-1 marker:font-semibold marker:text-slate-400 ${nodeClassName || ''}`}
        style={{ paddingLeft: 4, margin: '8px 0', color: documentTextColor }}
      />
    ),
    blockquote: ({ className: nodeClassName, ...props }) => (
      <blockquote
        {...props}
        className={`my-6 rounded-2xl border px-5 py-4 italic ${quoteTone} ${nodeClassName || ''}`}
        style={{
          background: blockquoteBackground,
          borderColor: isDark ? 'rgba(245,158,11,0.22)' : 'rgba(245,158,11,0.24)',
          boxShadow: `inset 3px 0 0 ${blockquoteBorder}`,
          color: documentTextColor,
        }}
      />
    ),
    table: ({ className: nodeClassName, ...props }) => (
      <div
        className={`my-6 overflow-hidden rounded-2xl border ${borderTone}`}
        style={{ borderColor: tableBorderColor }}
      >
        <div className="overflow-x-auto">
          <table
            {...props}
            className={`min-w-full border-collapse text-left text-sm ${surfaceTone} ${nodeClassName || ''}`}
            style={{ color: documentTextColor }}
          />
        </div>
      </div>
    ),
    thead: ({ className: nodeClassName, ...props }) => (
      <thead
        {...props}
        className={isDark ? `bg-slate-800/80 ${nodeClassName || ''}` : `bg-slate-50 ${nodeClassName || ''}`}
        style={{ background: tableHeadBg }}
      />
    ),
    th: ({ className: nodeClassName, ...props }) => (
      <th
        {...props}
        className={`border-b px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] ${headingTone} ${borderTone} ${nodeClassName || ''}`}
        style={{
          color: headingColor,
          borderBottom: `1px solid ${tableBorderColor}`,
          background: tableHeadBg,
        }}
      />
    ),
    td: ({ className: nodeClassName, ...props }) => (
      <td
        {...props}
        className={`border-b px-4 py-3 align-top text-[14px] leading-7 ${textTone} ${borderTone} ${nodeClassName || ''}`}
        style={{
          color: documentTextColor,
          borderBottom: `1px solid ${tableBorderColor}`,
        }}
      />
    ),
    hr: ({ className: nodeClassName, ...props }) => (
      <hr
        {...props}
        className={`my-8 border-0 border-t ${borderTone} ${nodeClassName || ''}`}
      />
    ),
    code: (({ inline, className: nodeClassName, children, ...props }: MarkdownCodeProps) => {
      if (inline) {
        return (
          <code
            {...props}
            className={`rounded-md border px-1.5 py-0.5 font-mono text-[13px] ${inlineCodeTone} ${nodeClassName || ''}`}
            style={inlineCodeStyle}
          >
            {children}
          </code>
        );
      }
      return (
        <code {...props} className={`font-mono text-[13px] leading-6 ${nodeClassName || ''}`}>
          {children}
        </code>
      );
    }) as Components['code'],
    pre: ({ className: nodeClassName, ...props }) => (
      <pre
        {...props}
        className={`my-6 overflow-x-auto rounded-2xl border px-5 py-4 shadow-inner ${codeBlockTone} ${nodeClassName || ''}`}
      />
    ),
    strong: ({ className: nodeClassName, ...props }) => (
      <strong
        {...props}
        className={`font-semibold ${headingTone} ${nodeClassName || ''}`}
        style={{ color: headingColor }}
      />
    ),
    em: ({ className: nodeClassName, ...props }) => (
      <em {...props} className={`italic ${mutedTone} ${nodeClassName || ''}`} />
    ),
  };

  return (
    <div className={`markdown-preview-root max-w-none break-words text-[15px] leading-8 ${textTone} ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
