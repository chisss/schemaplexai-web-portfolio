/**
 * 执行详情弹窗
 * 展示单个执行记录的完整信息与日志流
 */
import { Modal, Tag, Badge, Descriptions, Typography, Empty, Timeline, Card, Spin, Collapse, Segmented, Alert, Pagination, Button, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { AgentExecution, AgentExecutionChild, AgentExecutionLog, ConversationMessage } from '@/types/agent';
import { fetchExecutionLogDetail, useConversationHistory, useExecutionLogs } from '@/api/agent';
import { formatDateTime } from '@/utils/date';
import { useEffect, useState } from 'react';

const { Text, Paragraph } = Typography;

interface ExecutionDetailModalProps {
  open: boolean;
  execution: AgentExecution | null;
  loading?: boolean;
  onClose: () => void;
}

type ChildLogFilter = 'all' | 'abnormal' | 'tool';

const LOG_LEVEL_COLOR: Record<string, string> = {
  DEBUG: 'default',
  INFO: 'blue',
  WARN: 'orange',
  ERROR: 'red',
};

export default function ExecutionDetailModal({ open, execution, loading = false, onClose }: ExecutionDetailModalProps) {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [childLogFilters, setChildLogFilters] = useState<Record<string, ChildLogFilter>>({});
  const [logPage, setLogPage] = useState(1);
  const [logDetailOpen, setLogDetailOpen] = useState(false);
  const [logDetailLoading, setLogDetailLoading] = useState(false);
  const [activeLogDetail, setActiveLogDetail] = useState<AgentExecutionLog | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setChildLogFilters({});
    setLogPage(1);
    setLogDetailOpen(false);
    setActiveLogDetail(null);
  }, [execution?.executionId, open]);

  const displayExecution = execution;
  const sandboxSnapshot = (displayExecution?.sandboxPolicySnapshot ?? {}) as Record<string, unknown>;
  const { data: conversationHistory, isLoading: conversationHistoryLoading } = useConversationHistory(displayExecution?.conversationId);
  const { data: executionLogsPage, isLoading: executionLogsLoading } = useExecutionLogs(
    displayExecution?.agentId ?? '',
    displayExecution?.executionId ?? '',
    { page: logPage, size: 20 },
  );
  const executionLogs = executionLogsPage?.records ?? displayExecution?.logs ?? [];

  const statusCfg: Record<string, { badge: 'default' | 'processing' | 'success' | 'error' | 'warning'; label: string }> = {
    queued: { badge: 'default', label: t('agent.executionStatusQueued') || '排队中' },
    running: { badge: 'processing', label: t('agent.executionStatusRunning') || '运行中' },
    completed: { badge: 'success', label: t('agent.executionStatusCompleted') || '已完成' },
    failed: { badge: 'error', label: t('agent.executionStatusFailed') || '失败' },
    stopped: { badge: 'warning', label: t('agent.executionStatusStopped') || '已停止' },
    paused: { badge: 'warning', label: t('agent.executionStatusPaused') || '已暂停' },
  };

  const getStatusConfig = (status?: string) => statusCfg[status ?? 'queued'] ?? statusCfg.queued;
  const sc = displayExecution ? getStatusConfig(displayExecution.status) : statusCfg.queued;

  const isAbnormalLog = (log: AgentExecutionLog) => log.logLevel === 'WARN' || log.logLevel === 'ERROR';
  const isToolLog = (log: AgentExecutionLog) => Boolean(log.toolName) || log.logType.includes('TOOL');
  const getChildLogStats = (logs?: AgentExecutionLog[]) => {
    const safeLogs = logs ?? [];
    const errorCount = safeLogs.filter((log) => log.logLevel === 'ERROR').length;
    const warnCount = safeLogs.filter((log) => log.logLevel === 'WARN').length;
    const abnormalCount = safeLogs.filter(isAbnormalLog).length;
    const toolCount = safeLogs.filter(isToolLog).length;
    return { errorCount, warnCount, abnormalCount, toolCount };
  };
  const getFilteredChildLogs = (child: AgentExecutionChild) => {
    const activeFilter = childLogFilters[child.executionId] ?? 'all';
    const safeLogs = child.logs ?? [];
    if (activeFilter === 'abnormal') {
      return safeLogs.filter(isAbnormalLog);
    }
    if (activeFilter === 'tool') {
      return safeLogs.filter(isToolLog);
    }
    return safeLogs;
  };

  const handleViewLogDetail = async (log: AgentExecutionLog) => {
    if (!displayExecution?.agentId || !displayExecution.executionId || !log.logId) {
      return;
    }
    setLogDetailOpen(true);
    setLogDetailLoading(true);
    setActiveLogDetail(null);
    try {
      const response = await fetchExecutionLogDetail(displayExecution.agentId, displayExecution.executionId, log.logId);
      setActiveLogDetail(response.data ?? null);
    } catch (error) {
      console.error(error);
      message.error(t('agent.executionLogDetailLoadFailed') || '日志详情加载失败');
      setLogDetailOpen(false);
    } finally {
      setLogDetailLoading(false);
    }
  };

  const renderLogContent = (log: AgentExecutionLog) => (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {log.roundNum != null && (
            <Tag style={{ fontSize: 11 }}>Round {log.roundNum}</Tag>
        )}
        {log.logType && (
            <Tag color="blue" style={{ fontSize: 11 }}>{log.logType}</Tag>
        )}
        <Tag color={LOG_LEVEL_COLOR[log.logLevel] ?? 'default'} style={{ fontSize: 11 }}>
          {log.logLevel}
        </Tag>

        {log.toolName && (
          <Tag color="purple" style={{ fontSize: 11 }}>{log.toolName}</Tag>
        )}

        {log.elapsedMs != null && (
          <Text type="secondary" style={{ fontSize: 11 }}>{log.elapsedMs}ms</Text>
        )}
      </div>
      {(log.content || log.summary) && (
        <Paragraph
          style={{
            margin: '4px 0 0',
            fontFamily: 'monospace',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: log.logLevel === 'ERROR'
              ? '#fff2f0'
              : log.logLevel === 'WARN'
                ? '#fff7e6'
                : log.logLevel === 'DEBUG'
                  ? '#f5f5f5'
                  : undefined,
            padding: log.logLevel === 'ERROR' || log.logLevel === 'WARN' || log.logLevel === 'DEBUG' ? '4px 8px' : 0,
            borderRadius: 4,
            maxWidth: isMobile ? '100%' : 600,
          }}
        >
          {log.content || log.summary}
        </Paragraph>
      )}
      {!log.content && log.logId && (
        <Button type="link" size="small" style={{ paddingInline: 0 }} onClick={() => handleViewLogDetail(log)}>
          {t('agent.executionLogViewDetail') || '查看完整日志'}
        </Button>
      )}
      {log.createdAt && (
        <Text type="secondary" style={{ fontSize: 11 }}>
          {formatDateTime(log.createdAt)}
        </Text>
      )}
    </>
  );

  const buildTimelineItems = (logs: AgentExecutionLog[]) => logs.map((log, idx) => ({
    key: `${log.createdAt ?? 'log'}-${idx}`,
    dot: log.logLevel === 'ERROR'
      ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      : log.logLevel === 'WARN'
        ? <ClockCircleOutlined style={{ color: '#fa8c16' }} />
        : log.logLevel === 'DEBUG'
          ? undefined
          : <CheckCircleOutlined style={{ color: '#1890ff' }} />,
    color: log.logLevel === 'ERROR' ? 'red' : log.logLevel === 'WARN' ? 'orange' : 'blue',
    children: renderLogContent(log),
  }));

  const renderConversationMessage = (message: ConversationMessage, idx: number) => ({
    key: `${message.messageIndex ?? idx}-${message.createdAt ?? idx}`,
    color: message.messageType === 'USER' ? 'blue' : message.messageType === 'AI' ? 'green' : 'gray',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tag>{message.messageType}</Tag>
          {message.toolName ? <Tag color="purple">{message.toolName}</Tag> : null}
          {message.createdAt ? (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {formatDateTime(message.createdAt)}
            </Text>
          ) : null}
        </div>
        {message.textContent ? (
          <Paragraph style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.textContent}
          </Paragraph>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('agent.executionConversationToolOnly') || '该消息仅包含工具调用结果元数据'}
          </Text>
        )}
      </div>
    ),
  });

  const renderChildExecution = (child: AgentExecutionChild, idx: number) => {
    const childStatus = getStatusConfig(child.status);
    const childLogStats = getChildLogStats(child.logs);
    const filteredChildLogs = getFilteredChildLogs(child);
    return (
      <Card
        key={child.executionId || idx}
        size="small"
        title={child.teamMemberRoleName || `${t('agent.executionTeamMember') || '团队成员'} ${idx + 1}`}
        extra={(
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {childLogStats.errorCount > 0 ? <Tag color="red">{`${t('agent.executionChildErrors') || '异常'} ${childLogStats.errorCount}`}</Tag> : null}
            {childLogStats.warnCount > 0 ? <Tag color="orange">{`${t('agent.executionChildWarnings') || '预警'} ${childLogStats.warnCount}`}</Tag> : null}
            <Badge status={childStatus.badge} text={childStatus.label} />
          </div>
        )}
        style={{
          flex: '1 1 360px',
          borderColor: childLogStats.errorCount > 0 ? '#ffccc7' : childLogStats.warnCount > 0 ? '#ffe7ba' : undefined,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Text copyable={{ text: child.executionId }} code style={{ fontSize: 12, wordBreak: 'break-all' }}>
            {child.executionId}
          </Text>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {child.model ? <Tag color="geekblue">{child.model}</Tag> : null}
            {child.teamMemberId ? <Tag>{child.teamMemberId}</Tag> : null}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('agent.executionSubmitTime') || '提交时间'}: {formatDateTime(child.createdAt || null)}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('agent.executionEndTime') || '结束时间'}: {formatDateTime(child.completedAt || null)}
          </Text>
          {child.errorMessage ? (
            <Text type="danger" style={{ fontFamily: 'monospace', fontSize: 12 }}>
              {child.errorMessage}
            </Text>
          ) : null}
          {child.outputResult ? (
            <Paragraph
              style={{
                margin: 0,
                fontFamily: 'monospace',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 220,
                overflowY: 'auto',
              }}
            >
              {child.outputResult}
            </Paragraph>
          ) : (
            <Text type="secondary">{t('agent.executionChildNoOutput') || '当前成员暂无可展示输出'}</Text>
          )}
          <Collapse
            size="small"
            items={[
              {
                key: 'logs',
                label: `${t('agent.executionChildLogs') || '成员日志'} (${child.logs?.length ?? 0})`,
                children: child.logs && child.logs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Segmented
                        size="small"
                        value={childLogFilters[child.executionId] ?? 'all'}
                        onChange={(value) => setChildLogFilters((prev) => ({
                          ...prev,
                          [child.executionId]: value as ChildLogFilter,
                        }))}
                        options={[
                          { label: t('agent.executionLogFilterAll') || '全部', value: 'all' },
                          { label: t('agent.executionLogFilterAbnormal') || '仅异常', value: 'abnormal' },
                          { label: t('agent.executionLogFilterTool') || '仅工具', value: 'tool' },
                        ]}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {`${t('agent.executionLogFilterMatched') || '当前显示'} ${filteredChildLogs.length} / ${child.logs.length}`}
                      </Text>
                    </div>
                    {filteredChildLogs.length > 0 ? (
                      <div style={{ maxHeight: 240, overflowY: 'auto', paddingRight: 8 }}>
                        <Timeline items={buildTimelineItems(filteredChildLogs)} />
                      </div>
                    ) : (
                      <Empty
                        description={t('agent.executionChildFilterEmpty') || '当前筛选条件下暂无日志'}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </div>
                ) : (
                  <Empty
                    description={t('agent.executionChildNoLogs') || '当前成员暂无日志'}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              },
            ]}
          />
        </div>
      </Card>
    );
  };

  return (
    <>
      <Modal
      open={open}
      title={t('agent.executionDetail') || '执行详情'}
      onCancel={onClose}
      footer={null}
      width={isMobile ? '100%' : '90%'}
      style={isMobile ? { top: 0, paddingBottom: 0, maxWidth: '100vw' } : { maxWidth: 1400, top: 20 }}
      styles={{ body: isMobile ? { maxHeight: 'calc(100vh - 110px)', overflowY: 'auto' } : undefined }}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : !displayExecution ? (
        <Empty description={t('agent.noExecutionRecord')} />
      ) : (
        <>
          {/* 执行基本信息 */}
          <Descriptions column={isMobile ? 1 : 2} bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label={t('agent.executionId')} span={isMobile ? 1 : 2}>
              <Text
                code
                copyable={{ text: displayExecution.executionId }}
                style={{ wordBreak: 'break-all', fontSize: 12 }}
              >
                {displayExecution.executionId}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('common.status')}>
              <Badge status={sc.badge} text={sc.label} />
            </Descriptions.Item>
            <Descriptions.Item label={t('agent.executionModel')}>
              {displayExecution.model ? <Tag color="geekblue">{displayExecution.model}</Tag> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('agent.executionConversationId') || '会话 ID'} span={isMobile ? 1 : 2}>
              {displayExecution.conversationId ? (
                <Text
                  code
                  copyable={{ text: displayExecution.conversationId }}
                  style={{ wordBreak: 'break-all', fontSize: 12 }}
                >
                  {displayExecution.conversationId}
                </Text>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('agent.executionRuntimeEngine') || '运行时引擎'}>
              {displayExecution.runtimeEngine ? <Tag>{displayExecution.runtimeEngine}</Tag> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('agent.executionGraphThreadId') || '图线程 ID'} span={isMobile ? 1 : 2}>
              {displayExecution.graphThreadId ? (
                <Text
                  code
                  copyable={{ text: displayExecution.graphThreadId }}
                  style={{ wordBreak: 'break-all', fontSize: 12 }}
                >
                  {displayExecution.graphThreadId}
                </Text>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('agent.executionCheckpointNamespace') || '检查点命名空间'} span={isMobile ? 1 : 2}>
              {displayExecution.checkpointNamespace ? (
                <Text
                  code
                  copyable={{ text: displayExecution.checkpointNamespace }}
                  style={{ wordBreak: 'break-all', fontSize: 12 }}
                >
                  {displayExecution.checkpointNamespace}
                </Text>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('agent.executionSandboxProfile') || '沙盒配置'} span={isMobile ? 1 : 2}>
              {displayExecution.sandboxPolicySnapshot ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {'sandboxProfile' in sandboxSnapshot ? (
                    <Tag color="gold">{String(sandboxSnapshot.sandboxProfile)}</Tag>
                  ) : null}
                  {'networkEgressEnabled' in sandboxSnapshot ? (
                    <Tag color={sandboxSnapshot.networkEgressEnabled === true ? 'green' : 'red'}>
                      {sandboxSnapshot.networkEgressEnabled === true
                        ? (t('agent.executionSandboxNetworkEnabled') || '允许外网')
                        : (t('agent.executionSandboxNetworkDisabled') || '禁止外网')}
                    </Tag>
                  ) : null}
                  {Array.isArray(sandboxSnapshot.allowedToolCodes) ? (
                    <Tag>{`${t('agent.executionSandboxToolWhitelist') || '工具白名单'} ${sandboxSnapshot.allowedToolCodes.length}`}</Tag>
                  ) : null}
                  {Array.isArray(sandboxSnapshot.allowedPathPrefixes) ? (
                    <Tag>{`${t('agent.executionSandboxPathWhitelist') || '路径白名单'} ${sandboxSnapshot.allowedPathPrefixes.length}`}</Tag>
                  ) : null}
                </div>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('agent.executionTokenInOut')} span={isMobile ? 1 : 2}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Text>输入: <Text strong>{displayExecution.tokenInput ?? 0}</Text></Text>
                <Text>输出: <Text strong>{displayExecution.tokenOutput ?? 0}</Text></Text>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label={t('agent.executionSubmitTime')}>
              {formatDateTime(displayExecution.createdAt || null)}
            </Descriptions.Item>
            <Descriptions.Item label={t('agent.executionEndTime')}>
              {formatDateTime(displayExecution.completedAt || null)}
            </Descriptions.Item>
            {displayExecution.inputPrompt && (
              <Descriptions.Item label={t('agent.executionPrompt')} span={2}>
                <Paragraph
                  ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                  style={{ margin: 0, fontFamily: 'monospace', fontSize: 12 }}
                >
                  {displayExecution.inputPrompt}
                </Paragraph>
              </Descriptions.Item>
            )}
            {displayExecution.errorMessage && (
              <Descriptions.Item label={t('agent.executionError')} span={2}>
                <Text type="danger" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {displayExecution.errorMessage}
                </Text>
              </Descriptions.Item>
            )}
            {displayExecution.outputResult && (
              <Descriptions.Item label={t('agent.executionOutput') || '执行输出'} span={2}>
                <Paragraph
                  style={{
                    margin: 0,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: isMobile ? 240 : 320,
                    overflowY: 'auto',
                  }}
                >
                  {displayExecution.outputResult}
                </Paragraph>
              </Descriptions.Item>
            )}
          </Descriptions>

          {(displayExecution.securityDecision || displayExecution.securityTraceId || displayExecution.securityIncidentId) && (
            <Alert
              type={displayExecution.securityDecision === 'block' ? 'error' : displayExecution.securityDecision === 'pause' ? 'warning' : 'info'}
              showIcon
              style={{ marginBottom: 16 }}
              message={displayExecution.securityMessage || t('agent.executionSecuritySummary') || '已记录安全决策'}
              description={(
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text>{`${t('agent.executionSecurityDecision') || '决策'}: ${displayExecution.securityDecision ?? '-'}`}</Text>
                  {displayExecution.securityTraceId ? (
                    <Text copyable={{ text: displayExecution.securityTraceId }}>
                      {`${t('agent.executionSecurityTraceId') || '安全追踪 ID'}: ${displayExecution.securityTraceId}`}
                    </Text>
                  ) : null}
                  {displayExecution.securityIncidentId ? (
                    <Text copyable={{ text: displayExecution.securityIncidentId }}>
                      {`${t('agent.executionSecurityIncidentId') || '安全事件 ID'}: ${displayExecution.securityIncidentId}`}
                    </Text>
                  ) : null}
                </div>
              )}
            />
          )}

          {(displayExecution.qualitySummary || displayExecution.qualityDeviationCount || displayExecution.qualityTaskId) && (
            <Alert
              type={(displayExecution.qualityWarningCount ?? 0) > 0 ? 'warning' : 'success'}
              showIcon
              style={{ marginBottom: 16 }}
              message={displayExecution.qualitySummary || t('agent.executionQualitySummary') || '质量检测已完成'}
              description={(
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {displayExecution.qualityTaskId ? <Text>{`${t('agent.executionQualityTask') || '任务'}: ${displayExecution.qualityTaskId}`}</Text> : null}
                  {displayExecution.qualityTaskStatus ? <Text>{`${t('agent.executionQualityStatus') || '状态'}: ${displayExecution.qualityTaskStatus}`}</Text> : null}
                  {displayExecution.qualityDeviationCount != null ? <Text>{`${t('agent.executionQualityDeviationCount') || '偏离数'}: ${displayExecution.qualityDeviationCount}`}</Text> : null}
                  {displayExecution.qualityWarningCount != null ? <Text>{`${t('agent.executionQualityWarningCount') || '预警数'}: ${displayExecution.qualityWarningCount}`}</Text> : null}
                </div>
              )}
            />
          )}

          {displayExecution.childExecutions && displayExecution.childExecutions.length > 0 && (
            <Card
              title={t('agent.executionTeamOutputs') || '团队成员输出'}
              size="small"
              style={{ marginBottom: 16 }}
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {displayExecution.childExecutions.length} {t('agent.executionTeamMembersCount') || '个成员'}
                </Text>
              }
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {displayExecution.childExecutions.map(renderChildExecution)}
              </div>
            </Card>
          )}

          {/* 日志流 */}
          <Card
            title={t('agent.executionLogs') || '执行日志'}
            size="small"
            style={{ marginBottom: 16 }}
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {executionLogsPage ? `${executionLogsPage.total} 条` : `${executionLogs.length} 条`}
              </Text>
            }
          >
            {executionLogsLoading ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Spin size="small" />
              </div>
            ) : executionLogs.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <Alert
                  type="info"
                  showIcon
                  message={t('agent.executionLogSummaryHint') || '默认展示日志概要，避免大日志一次性加载；如需完整内容请进入日志详情。'}
                />
                <div style={{ maxHeight: isMobile ? 300 : 400, overflowY: 'auto', paddingRight: 8 }}>
                  <Timeline items={buildTimelineItems(executionLogs)} />
                </div>
                {executionLogsPage && executionLogsPage.total > executionLogsPage.size && (
                  <Pagination
                    size="small"
                    current={logPage}
                    pageSize={executionLogsPage.size}
                    total={executionLogsPage.total}
                    showSizeChanger={false}
                    onChange={setLogPage}
                  />
                )}
              </div>
            ) : (
              <Empty description={t('agent.noExecutionLogs') || '暂无日志'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>

          <Card
            title={t('agent.executionConversationHistory') || '对话历史'}
            size="small"
            extra={displayExecution.conversationId ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {displayExecution.conversationId}
              </Text>
            ) : null}
          >
            {conversationHistoryLoading ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Spin size="small" />
              </div>
            ) : conversationHistory && conversationHistory.length > 0 ? (
              <div style={{ maxHeight: isMobile ? 280 : 360, overflowY: 'auto', paddingRight: 8 }}>
                <Timeline items={conversationHistory.map(renderConversationMessage)} />
              </div>
            ) : (
              <Empty
                description={t('agent.executionConversationEmpty') || '当前会话暂无可展示历史'}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </>
      )}
      </Modal>
      <Modal
        open={logDetailOpen}
        title={t('agent.executionLogDetail') || '日志详情'}
        onCancel={() => setLogDetailOpen(false)}
        footer={null}
        width={isMobile ? '100%' : 900}
        destroyOnHidden
      >
        {logDetailLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : activeLogDetail ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {renderLogContent(activeLogDetail)}
          </div>
        ) : (
          <Empty description={t('agent.noExecutionLogs') || '暂无日志'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Modal>
    </>
  );
}
