/**
 * 国际化相关类型定义
 * 与后端 I18nLocale 实体对齐
 */

/** 语言配置（对应后端 I18nLocale） */
export interface I18nLocale {
  id?: number;
  code: string;
  name: string;
  flag: string;
  enabled: boolean;
  sortOrder?: number;
}
