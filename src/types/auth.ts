/**
 * 认证相关类型定义
 */

export interface LoginDTO {
  username: string;
  password: string;
}

export interface LoginVO {
  accessToken: string;
  refreshToken: string;
  userInfo: UserInfo;
}

export interface UserInfo {
  id: string;
  username: string;
  nickname: string;
  email: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
  tenantId: string;
  tenantName: string;
}
