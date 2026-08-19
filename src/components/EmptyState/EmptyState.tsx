/**
 * 统一空状态组件
 * 替代 antd Empty，提供更强的引导性（图标 + 标题 + 说明 + 行动按钮）
 */
import type { ReactNode } from 'react';
import { Button } from 'antd';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  type?: 'primary' | 'default';
  icon?: ReactNode;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  /** 控制组件高度，默认 320px */
  minHeight?: number | string;
  /** 紧凑模式（用于表格内行内空状态） */
  compact?: boolean;
}

export default function EmptyState({
  icon,
  title,
  description,
  actions = [],
  minHeight = 320,
  compact = false,
}: EmptyStateProps) {
  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          gap: 8,
        }}
      >
        {icon && (
          <div style={{ fontSize: 32, color: 'var(--color-text-tertiary)', lineHeight: 1 }}>
            {icon}
          </div>
        )}
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
          {title}
        </div>
        {actions.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {actions.map((action, i) => (
              <Button
                key={i}
                type={action.type ?? (i === 0 ? 'primary' : 'default')}
                size="small"
                icon={action.icon}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        padding: '48px 24px',
        gap: 0,
      }}
    >
      {/* 图标容器 */}
      {icon && (
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: 'rgba(22, 93, 255, 0.08)',
            border: '1px solid rgba(22, 93, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            color: 'var(--color-primary)',
            marginBottom: 20,
          }}
        >
          {icon}
        </div>
      )}

      {/* 标题 */}
      <div
        style={{
          fontSize: 'var(--text-md)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: description ? 8 : 20,
          textAlign: 'center',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </div>

      {/* 说明文字 */}
      {description && (
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--lh-body)',
            textAlign: 'center',
            maxWidth: 320,
            marginBottom: 24,
          }}
        >
          {description}
        </div>
      )}

      {/* 行动按钮 */}
      {actions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {actions.map((action, i) => (
            <Button
              key={i}
              type={action.type ?? (i === 0 ? 'primary' : 'default')}
              icon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
