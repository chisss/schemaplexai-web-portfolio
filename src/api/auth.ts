/**
 * 认证 API 接口
 * 对应后端 AuthController
 */
import request from './request';
import type { R } from '@/types/common';
import type { LoginDTO, LoginVO } from '@/types/auth';

/** 用户登录 */
export const login = (data: LoginDTO) =>
  request.post<any, R<LoginVO>>('/auth/login', data);

/** 刷新 Token */
export const refreshToken = (refreshToken: string) =>
  request.post<any, R<{ accessToken: string; refreshToken: string }>>('/auth/refresh', { refreshToken });

/** 用户登出 */
export const logout = () =>
  request.post<any, R<void>>('/auth/logout');

/** 签发 WebSocket 一次性 ticket */
export const issueWsTicket = () =>
  request.get<any, R<{ wsTicket: string }>>('/auth/ws-ticket');
