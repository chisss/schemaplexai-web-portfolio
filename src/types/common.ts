/**
 * 通用类型定义
 */

/** 统一响应体（与后端 R<T> 对应） */
export interface R<T = any> {
  code: number;
  message: string;
  data: T;
}

/** 分页响应体 */
export interface PageResult<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
  pages: number;
}

/** 分页请求参数 */
export interface PageParams {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
}

/** 通用选项 */
export interface Option {
  label: string;
  value: string | number;
}
