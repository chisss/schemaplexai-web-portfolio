/**
 * Mock 监控相关接口
 */
import { http, HttpResponse } from 'msw';

export const monitorHandlers = [
  http.get('/api/monitor/dashboard', () =>
    HttpResponse.json({
      code: 200,
      message: 'success',
      data: {
        activeAgentCount: 12,
        taskQueueDepth: 26,
        taskSuccessRate: 96.4,
        avgExecutionTimeMs: 820,
        todayTokenConsumption: 186000,
        deviationAlertCount: 3,
        pendingApprovalCount: 8,
        systemHealth: {
          status: 'healthy',
          cpuUsage: 41,
          memoryUsage: 58,
          diskUsage: 36,
          serviceStatus: {
            gateway: 'healthy',
            scheduler: 'healthy',
            runtime: 'healthy',
          },
        },
      },
    }),
  ),
];
