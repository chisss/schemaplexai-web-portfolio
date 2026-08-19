/**
 * Mock 站内信相关接口
 */
import { http, HttpResponse } from 'msw';

const inboxRecords = [
  {
    id: 'recipient-001',
    messageId: 'message-001',
    status: 'unread',
    title: 'Spec 审核待处理',
    content: '营销活动页面规范已进入人工审核阶段，请尽快处理。',
    createdAt: '2026-04-18T09:20:00Z',
    actionUrl: '/approval-center',
  },
  {
    id: 'recipient-002',
    messageId: 'message-002',
    status: 'read',
    title: '工作流执行完成',
    content: '标准研发发布流程已执行完成。',
    createdAt: '2026-04-18T06:40:00Z',
    actionUrl: '/workflow/executions',
  },
];

export const notificationHandlers = [
  http.get('/api/in-app-messages/unread-count', () =>
    HttpResponse.json({
      code: 200,
      message: 'success',
      data: inboxRecords.filter((item) => item.status === 'unread').length,
    }),
  ),
  http.get('/api/in-app-messages/inbox', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const size = Number(url.searchParams.get('size') ?? 10);
    const start = (page - 1) * size;
    const records = inboxRecords.slice(start, start + size);

    return HttpResponse.json({
      code: 200,
      message: 'success',
      data: {
        records,
        total: inboxRecords.length,
        current: page,
        size,
      },
    });
  }),
  http.post('/api/in-app-messages/:recipientId/read', () =>
    HttpResponse.json({
      code: 200,
      message: 'success',
      data: null,
    }),
  ),
  http.post('/api/in-app-messages/:recipientId/archive', () =>
    HttpResponse.json({
      code: 200,
      message: 'success',
      data: null,
    }),
  ),
];
