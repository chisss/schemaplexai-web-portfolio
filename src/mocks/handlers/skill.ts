/**
 * Mock Skill 相关接口
 */
import { http, HttpResponse } from 'msw';

const mockSkills = [
  {
    id: 'skill-001',
    name: 'architecture-review',
    displayName: '架构审查',
    description: '审查模块边界、依赖关系与扩展性风险。',
    skillPrompt: 'Review architecture quality and identify risks.',
    category: 'engineering',
    status: 'active',
    createdAt: '2026-04-12T08:00:00Z',
  },
  {
    id: 'skill-002',
    name: 'ux-polish',
    displayName: '界面润色',
    description: '优化界面层级、响应式与可访问性表现。',
    skillPrompt: 'Improve layout, polish UI and validate accessibility.',
    category: 'design',
    status: 'active',
    createdAt: '2026-04-12T08:00:00Z',
  },
  {
    id: 'skill-003',
    name: 'test-design',
    displayName: '测试方案',
    description: '补充关键测试点与回归风险清单。',
    skillPrompt: 'Generate test scenarios and regression checklist.',
    category: 'quality',
    status: 'active',
    createdAt: '2026-04-12T08:00:00Z',
  },
];

export const skillHandlers = [
  http.get('/api/skills', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const size = Number(url.searchParams.get('size') ?? 10);
    const keyword = (url.searchParams.get('keyword') ?? '').trim();
    const status = url.searchParams.get('status');

    let records = mockSkills;
    if (status) {
      records = records.filter((item) => item.status === status);
    }
    if (keyword) {
      records = records.filter((item) =>
        item.name.includes(keyword) || item.displayName.includes(keyword) || item.description.includes(keyword),
      );
    }

    const start = (page - 1) * size;
    const pagedRecords = records.slice(start, start + size);

    return HttpResponse.json({
      code: 200,
      message: 'success',
      data: {
        records: pagedRecords,
        total: records.length,
        current: page,
        size,
        pages: Math.ceil(records.length / size),
      },
    });
  }),
];
