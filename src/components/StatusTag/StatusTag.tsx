/**
 * 状态标签组件（规范化版）
 * - 每种状态有独立的语义化颜色 + 图标
 * - 完整支持亮色 / 暗色主题（不依赖 Tailwind 或写死颜色）
 * - 颜色通过 useAppStore 主题感知，无需 !important 覆盖
 */
import { Tag } from 'antd';
import {
  CheckCircleFilled,
  ClockCircleFilled,
  SyncOutlined,
  ExclamationCircleFilled,
  CloseCircleFilled,
  PauseCircleFilled,
  FileTextFilled,
  AuditOutlined,
  LikeOutlined,
  ScheduleOutlined,
  InboxOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import type { AgentStatus } from '@/types/agent';
import type { SpecStatus } from '@/types/spec';
import type { WorkflowInstanceStatus } from '@/types/workflow';
import React from "react";

type StatusType = AgentStatus | SpecStatus | WorkflowInstanceStatus;

interface StatusTagProps {
  status: StatusType;
  type?: 'agent' | 'spec' | 'workflow';
}

/** 单种状态的颜色三元组，分亮/暗两套 */
interface ColorSet {
  bg: string;
  text: string;
  border: string;
}

interface StatusConfig {
  light: ColorSet;
  dark: ColorSet;
  label: string;
  icon?: React.ReactNode;
}

export default function StatusTag({ status, type = 'agent' }: StatusTagProps) {
  const { t } = useTranslation();
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  // ── Agent 状态 ──────────────────────────────────────────────
  const agentStatusMap: Record<AgentStatus, StatusConfig> = {
    active: {
      light: { bg: 'rgba(16,185,129,0.10)', text: '#059669', border: 'rgba(16,185,129,0.28)' },
      dark:  { bg: 'rgba(16,185,129,0.18)', text: '#34d399', border: 'rgba(16,185,129,0.35)' },
      label: t('agent.statusActive'),
      icon: <CheckCircleFilled />,
    },
    inactive: {
      light: { bg: 'rgba(100,116,139,0.09)', text: '#475569', border: 'rgba(100,116,139,0.22)' },
      dark:  { bg: 'rgba(100,116,139,0.16)', text: '#86909C', border: 'rgba(100,116,139,0.30)' },
      label: t('agent.statusInactive'),
      icon: <PauseCircleFilled />,
    },
    running: {
      light: { bg: 'rgba(22,93,255,0.10)', text: '#165DFF', border: 'rgba(22,93,255,0.28)' },
      dark:  { bg: 'rgba(22,93,255,0.18)', text: '#4080FF', border: 'rgba(22,93,255,0.35)' },
      label: t('agent.statusRunning'),
      icon: <SyncOutlined spin />,
    },
    error: {
      light: { bg: 'rgba(245,63,63,0.10)', text: '#CB2634', border: 'rgba(245,63,63,0.28)' },
      dark:  { bg: 'rgba(245,63,63,0.18)', text: '#F76965', border: 'rgba(245,63,63,0.35)' },
      label: t('agent.statusError'),
      icon: <ExclamationCircleFilled />,
    },
  };

  // ── Spec 状态 ────────────────────────────────────────────────
  const specStatusMap: Record<SpecStatus, StatusConfig> = {
    draft: {
      light: { bg: 'rgba(100,116,139,0.09)', text: '#475569', border: 'rgba(100,116,139,0.22)' },
      dark:  { bg: 'rgba(100,116,139,0.16)', text: '#86909C', border: 'rgba(100,116,139,0.30)' },
      label: t('spec.statusDraft'),
      icon: <FileTextFilled />,
    },
    requirements_review: {
      light: { bg: 'rgba(255,125,0,0.10)', text: '#D25F00', border: 'rgba(255,125,0,0.28)' },
      dark:  { bg: 'rgba(255,125,0,0.18)', text: '#FF9A2E', border: 'rgba(255,125,0,0.35)' },
      label: t('spec.statusReqReview'),
      icon: <AuditOutlined />,
    },
    requirements_approved: {
      light: { bg: 'rgba(6,182,212,0.10)', text: '#0e7490', border: 'rgba(6,182,212,0.28)' },
      dark:  { bg: 'rgba(6,182,212,0.18)', text: '#22d3ee', border: 'rgba(6,182,212,0.35)' },
      label: t('spec.statusReqApproved'),
      icon: <LikeOutlined />,
    },
    design_review: {
      light: { bg: 'rgba(168,85,247,0.10)', text: '#7c3aed', border: 'rgba(168,85,247,0.28)' },
      dark:  { bg: 'rgba(168,85,247,0.18)', text: '#c084fc', border: 'rgba(168,85,247,0.35)' },
      label: t('spec.statusDesignReview'),
      icon: <AuditOutlined />,
    },
    design_approved: {
      light: { bg: 'rgba(168,85,247,0.13)', text: '#6d28d9', border: 'rgba(168,85,247,0.32)' },
      dark:  { bg: 'rgba(168,85,247,0.20)', text: '#c084fc', border: 'rgba(168,85,247,0.40)' },
      label: t('spec.statusDesignApproved'),
      icon: <LikeOutlined />,
    },
    tasks_review: {
      light: { bg: 'rgba(22,93,255,0.10)', text: '#0E42D2', border: 'rgba(22,93,255,0.28)' },
      dark:  { bg: 'rgba(22,93,255,0.18)', text: '#4080FF', border: 'rgba(22,93,255,0.35)' },
      label: t('spec.statusTaskReview'),
      icon: <ScheduleOutlined />,
    },
    ready: {
      light: { bg: 'rgba(22,93,255,0.10)', text: '#0E42D2', border: 'rgba(22,93,255,0.28)' },
      dark:  { bg: 'rgba(22,93,255,0.18)', text: '#4080FF', border: 'rgba(22,93,255,0.35)' },
      label: t('spec.statusPending'),
      icon: <ThunderboltFilled />,
    },
    in_progress: {
      light: { bg: 'rgba(22,93,255,0.12)', text: '#0E42D2', border: 'rgba(22,93,255,0.30)' },
      dark:  { bg: 'rgba(22,93,255,0.20)', text: '#6AA1FF', border: 'rgba(22,93,255,0.38)' },
      label: t('spec.statusExecuting'),
      icon: <SyncOutlined spin />,
    },
    failed: {
      light: { bg: 'rgba(245,63,63,0.10)', text: '#CB2634', border: 'rgba(245,63,63,0.28)' },
      dark:  { bg: 'rgba(245,63,63,0.18)', text: '#F76965', border: 'rgba(245,63,63,0.35)' },
      label: t('spec.statusFailed'),
      icon: <CloseCircleFilled />,
    },
    completed: {
      light: { bg: 'rgba(16,185,129,0.10)', text: '#059669', border: 'rgba(16,185,129,0.28)' },
      dark:  { bg: 'rgba(16,185,129,0.18)', text: '#34d399', border: 'rgba(16,185,129,0.35)' },
      label: t('spec.statusCompleted'),
      icon: <CheckCircleFilled />,
    },
    acceptance: {
      light: { bg: 'rgba(255,125,0,0.10)', text: '#D25F00', border: 'rgba(255,125,0,0.28)' },
      dark:  { bg: 'rgba(255,125,0,0.18)', text: '#FF9A2E', border: 'rgba(255,125,0,0.35)' },
      label: t('spec.statusAcceptance'),
      icon: <ClockCircleFilled />,
    },
    archived: {
      light: { bg: 'rgba(148,163,184,0.09)', text: '#4E5969', border: 'rgba(148,163,184,0.22)' },
      dark:  { bg: 'rgba(148,163,184,0.14)', text: '#86909C', border: 'rgba(148,163,184,0.28)' },
      label: t('spec.statusArchived'),
      icon: <InboxOutlined />,
    },
  };

  // ── Workflow 状态 ────────────────────────────────────────────
  const workflowStatusMap: Record<WorkflowInstanceStatus, StatusConfig> = {
    pending: {
      light: { bg: 'rgba(100,116,139,0.09)', text: '#475569', border: 'rgba(100,116,139,0.22)' },
      dark:  { bg: 'rgba(100,116,139,0.16)', text: '#86909C', border: 'rgba(100,116,139,0.30)' },
      label: t('workflow.statusPending'),
      icon: <ClockCircleFilled />,
    },
    running: {
      light: { bg: 'rgba(22,93,255,0.10)', text: '#165DFF', border: 'rgba(22,93,255,0.28)' },
      dark:  { bg: 'rgba(22,93,255,0.18)', text: '#4080FF', border: 'rgba(22,93,255,0.35)' },
      label: t('workflow.statusRunning'),
      icon: <SyncOutlined spin />,
    },
    paused: {
      light: { bg: 'rgba(255,125,0,0.10)', text: '#D25F00', border: 'rgba(255,125,0,0.28)' },
      dark:  { bg: 'rgba(255,125,0,0.18)', text: '#FF9A2E', border: 'rgba(255,125,0,0.35)' },
      label: t('workflow.statusPaused'),
      icon: <PauseCircleFilled />,
    },
    completed: {
      light: { bg: 'rgba(16,185,129,0.10)', text: '#059669', border: 'rgba(16,185,129,0.28)' },
      dark:  { bg: 'rgba(16,185,129,0.18)', text: '#34d399', border: 'rgba(16,185,129,0.35)' },
      label: t('workflow.statusCompleted'),
      icon: <CheckCircleFilled />,
    },
    failed: {
      light: { bg: 'rgba(245,63,63,0.10)', text: '#CB2634', border: 'rgba(245,63,63,0.28)' },
      dark:  { bg: 'rgba(245,63,63,0.18)', text: '#F76965', border: 'rgba(245,63,63,0.35)' },
      label: t('workflow.statusFailed'),
      icon: <CloseCircleFilled />,
    },
    cancelled: {
      light: { bg: 'rgba(148,163,184,0.09)', text: '#4E5969', border: 'rgba(148,163,184,0.22)' },
      dark:  { bg: 'rgba(148,163,184,0.14)', text: '#86909C', border: 'rgba(148,163,184,0.28)' },
      label: t('workflow.statusCancelled'),
      icon: <CloseCircleFilled />,
    },
  };

  // ── 选取配置 ──────────────────────────────────────────────────
  let config: StatusConfig | undefined;
  if (type === 'agent') config = agentStatusMap[status as AgentStatus];
  else if (type === 'spec') config = specStatusMap[status as SpecStatus];
  else if (type === 'workflow') config = workflowStatusMap[status as WorkflowInstanceStatus];

  if (!config) {
    return (
      <Tag style={{ borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 500 }}>
        {status}
      </Tag>
    );
  }

  const colors = isDark ? config.dark : config.light;

  return (
    <Tag
      style={{
        borderRadius: 6,
        padding: '2px 10px',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '20px',
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        letterSpacing: '0.01em',
      }}
    >
      {config.label}
    </Tag>
  );
}
