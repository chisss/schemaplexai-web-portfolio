/**
 * 成本管控相关类型定义
 * 与后端 CostOverviewVO / CostTrendVO / CostByDimensionVO / BudgetVO 等对齐
 */

/** 成本维度分析（对应后端 CostByDimensionVO） */
export interface CostByDimension {
  dimensionId: string;
  dimensionName: string;
  totalCost: number;
  totalTokens: number;
  percentage: number;
}

/** 成本概览（对应后端 CostOverviewVO） */
export interface CostOverview {
  totalCost: number;
  totalTokens: number;
  todayCost: number;
  todayTokens: number;
  costChangeRate: number;
  budgetUsageRate: number;
  costByModel: CostByDimension[];
}

/** 成本趋势（对应后端 CostTrendVO） */
export interface CostTrend {
  costTrend: Array<Record<string, unknown>>;
  tokenTrend: Array<Record<string, unknown>>;
}

/** 预算（对应后端 BudgetVO） */
export interface Budget {
  id: string;
  budgetLevel: string;
  targetId: string;
  targetName: string;
  budgetCycle: string;
  budgetAmount: number;
  alertThreshold50: boolean;
  alertThreshold80: boolean;
  alertThreshold100: boolean;
  overLimitStrategy: string;
  status: string;
  createdAt: string;
}

/** 预算使用情况（对应后端 BudgetUsageVO） */
export interface BudgetUsage {
  budgetAmount: number;
  usedAmount: number;
  remainAmount: number;
  usageRate: number;
  alertLevel: string;
  cycleStart: string;
  cycleEnd: string;
}

/** 预算告警（对应后端 BudgetAlertVO） */
export interface BudgetAlert {
  budgetId: string;
  budgetLevel: string;
  targetName: string;
  usageRate: number;
  alertLevel: string;
  alertTime: string;
}

export interface BudgetAdmissionStatus {
  allowed: boolean;
  strategy: 'allow' | 'alert' | 'downgrade' | 'block' | string;
  budgetId?: string;
  usageRate?: number;
  remainingAmount?: number | string;
  message?: string;
  actionRequired?: boolean;
  budgetAmount?: number | string;
  usedAmount?: number | string;
}

export interface BudgetBlockEvent {
  eventId: string;
  resourceType?: string;
  resourceId?: string;
  budgetId?: string;
  strategy?: string;
  usageRate?: number;
  remainingAmount?: string;
  traceId?: string;
  severity?: string;
  message?: string;
  occurredAt?: string;
}

/** 创建预算请求（对应后端 BudgetCreateRequest） */
export interface BudgetCreateDTO {
  budgetLevel: string;
  targetId: string;
  budgetCycle: string;
  budgetAmount: number;
  alertThreshold50?: boolean;
  alertThreshold80?: boolean;
  alertThreshold100?: boolean;
  overLimitStrategy?: string;
}

/** 更新预算请求（对应后端 BudgetUpdateRequest） */
export interface BudgetUpdateDTO {
  budgetAmount?: number;
  alertThreshold50?: boolean;
  alertThreshold80?: boolean;
  alertThreshold100?: boolean;
  overLimitStrategy?: string;
  status?: string;
}

/** 预算查询参数（对应后端 BudgetQueryRequest） */
export interface BudgetQueryDTO {
  page?: number;
  size?: number;
  budgetLevel?: string;
  status?: string;
}

export type CurrentBudgetUpdateDTO = BudgetUpdateDTO;
