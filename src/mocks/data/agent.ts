/**
 * Agent Mock 数据
 */
import type { Agent } from '@/types/agent';

export const mockAgents: Agent[] = [
  {
    id: '1',
    name: '保单域研发 Agent',
    agentType: 'team',
    description: '负责保单域的需求分析、设计和代码生成',
    aiModel: 'claude-sonnet-4-20250514',
    status: 'active',
    skills: ['需求分析', '架构设计', '代码生成', '单元测试'],
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-09T10:00:00Z',
  },
  {
    id: '2',
    name: '代码审查 Agent',
    agentType: 'solo',
    description: '自动化代码审查和安全扫描',
    aiModel: 'gpt-4o',
    status: 'active',
    skills: ['代码审查', '安全扫描', '规范检查'],
    createdAt: '2026-03-02T09:00:00Z',
    updatedAt: '2026-03-08T15:00:00Z',
  },
  {
    id: '3',
    name: '前端开发 Agent',
    agentType: 'solo',
    description: 'React + TypeScript 前端开发',
    aiModel: 'claude-sonnet-4-20250514',
    status: 'running',
    skills: ['React', 'TypeScript', 'UI设计', '响应式布局'],
    createdAt: '2026-03-05T10:00:00Z',
    updatedAt: '2026-03-09T14:00:00Z',
  },
  {
    id: '4',
    name: '测试自动化 Agent',
    agentType: 'solo',
    description: '自动生成单元测试和集成测试',
    aiModel: 'gpt-4o-mini',
    status: 'inactive',
    skills: ['单元测试', '集成测试', 'E2E测试'],
    createdAt: '2026-03-07T14:00:00Z',
    updatedAt: '2026-03-08T16:00:00Z',
  },
];
