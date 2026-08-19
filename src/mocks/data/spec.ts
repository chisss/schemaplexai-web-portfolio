/**
 * Spec Mock 数据
 */
import type { Spec, SpecDocument } from '@/types/spec';

export const mockSpecs: Spec[] = [
  {
    id: '1',
    name: '保单查询功能优化',
    version: '1.0.0',
    status: 'in_progress',
    priority: 'high',
    category: 'feature-development',
    description: '优化保单查询功能的性能和用户体验',
    projectId: 'proj-001',
    owner: 'user-001',
    tags: ['性能优化', '用户体验'],
    reviewLevel: 'manual',
    createdBy: 'admin',
    createdAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-03-09T11:00:00Z',
  },
  {
    id: '2',
    name: '理赔流程自动化',
    version: '2.1.0',
    status: 'ready',
    priority: 'critical',
    category: 'feature-development',
    description: '实现理赔流程的智能化和自动化处理',
    projectId: 'proj-001',
    owner: 'user-002',
    tags: ['自动化', 'AI', '理赔'],
    reviewLevel: 'multi_stage',
    createdBy: 'admin',
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-03-08T16:00:00Z',
  },
  {
    id: '3',
    name: '移动端 UI 重构',
    version: '1.0.0',
    status: 'design_approved',
    priority: 'medium',
    category: 'refactoring',
    description: '重构移动端界面，提升用户体验',
    projectId: 'proj-002',
    owner: 'user-003',
    tags: ['移动端', 'UI', '重构'],
    reviewLevel: 'manual',
    createdBy: 'admin',
    createdAt: '2026-02-20T08:00:00Z',
    updatedAt: '2026-03-05T14:00:00Z',
  },
  {
    id: '4',
    name: '数据报表系统',
    version: '1.0.0',
    status: 'draft',
    priority: 'low',
    category: 'data-analysis',
    description: '开发统一的数据报表系统',
    projectId: 'proj-002',
    owner: 'user-001',
    tags: ['报表', '数据可视化'],
    reviewLevel: 'auto',
    createdBy: 'admin',
    createdAt: '2026-03-07T15:00:00Z',
    updatedAt: '2026-03-09T09:00:00Z',
  },
];

export const mockSpecDocuments: Record<string, SpecDocument> = {
  '1-requirements': {
    id: 'doc-1-req',
    specId: '1',
    docType: 'requirements',
    content: `# 保单查询功能优化 - 需求文档

## 1. 需求背景

当前保单查询功能存在性能瓶颈，用户反馈查询速度慢，体验不佳。

## 2. 功能需求

### 2.1 性能优化
- 查询响应时间从平均 3s 降低到 500ms 以内
- 支持并发查询不影响性能

### 2.2 用户体验
- 添加查询进度提示
- 支持查询历史记录
- 优化查询结果展示

## 3. 非功能需求

- 可用性：99.9%
- 安全性：敏感信息脱敏
- 兼容性：支持主流浏览器`,
    version: 1,
    wordCount: 185,
    createdAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-03-01T09:00:00Z',
  },
  '1-design': {
    id: 'doc-1-des',
    specId: '1',
    docType: 'design',
    content: `# 保单查询功能优化 - 设计文档

## 1. 技术方案

### 1.1 数据库优化
- 添加索引：policy_no, status, created_at
- 使用 Redis 缓存热点数据

### 1.2 API 设计
\`\`\`
GET /api/policies?keyword=XXX&status=active&page=1&size=20
\`\`\`

## 2. 架构设计

采用三层架构：
- Controller 层：参数校验
- Service 层：业务逻辑
- DAO 层：数据访问

## 3. 性能优化策略
- 分页查询
- 结果缓存
- 异步加载`,
    version: 1,
    wordCount: 142,
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-02T10:00:00Z',
  },
  '1-tasks': {
    id: 'doc-1-tsk',
    specId: '1',
    docType: 'tasks',
    content: `# 保单查询功能优化 - 任务清单

## 开发任务

- [ ] 数据库索引优化（0.5天）
- [ ] Redis 缓存实现（1天）
- [ ] API 接口开发（2天）
- [ ] 前端界面优化（2天）
- [ ] 单元测试（1天）
- [ ] 集成测试（1天）
- [ ] 性能测试（0.5天）

## 总计：8 天

## 负责人分配
- 后端开发：张三
- 前端开发：李四
- 测试：王五`,
    version: 1,
    wordCount: 95,
    createdAt: '2026-03-03T11:00:00Z',
    updatedAt: '2026-03-03T11:00:00Z',
  },
};
