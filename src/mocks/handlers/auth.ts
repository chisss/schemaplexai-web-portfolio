/**
 * Mock 认证相关接口
 */
import { http, HttpResponse } from 'msw';
import type { LoginDTO, LoginVO } from '@/types/auth';

export const authHandlers = [
  // 登录接口
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginDTO;

    // 简单的模拟登录验证
    if (body.username === 'admin' && body.password === 'admin123') {
      const mockData: LoginVO = {
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        userInfo: {
          id: '1',
          username: 'admin',
          nickname: '系统管理员',
          email: 'admin@schemaplexai.com',
          roles: ['SUPER_ADMIN'],
          permissions: ['*'],
          tenantId: 'tenant-001',
          tenantName: '默认租户',
        },
      };

      return HttpResponse.json({
        code: 200,
        message: '登录成功',
        data: mockData,
      });
    }

    return HttpResponse.json(
      {
        code: 10002,
        message: '用户名或密码错误',
        data: null,
      },
      { status: 401 }
    );
  }),

  // Token 刷新接口
  http.post('/api/auth/refresh', async ({ request }) => {
    const body = (await request.json()) as { refreshToken: string };

    if (body.refreshToken.startsWith('mock-refresh-token')) {
      return HttpResponse.json({
        code: 200,
        message: '刷新成功',
        data: {
          accessToken: 'mock-access-token-refreshed-' + Date.now(),
          refreshToken: body.refreshToken,
        },
      });
    }

    return HttpResponse.json(
      {
        code: 10003,
        message: 'Refresh Token 无效',
        data: null,
      },
      { status: 401 }
    );
  }),
];
