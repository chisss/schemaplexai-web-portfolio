/**
 * 工作流 Mock Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockWorkflowTemplates } from '../data/workflow';
import type { WorkflowTemplateCreateDTO } from '@/types/workflow';

const templates = [...mockWorkflowTemplates];
let idCounter = 100;

export const workflowHandlers = [
  // 获取工作流模板统计数据
  http.get('/api/workflows/templates/stats', () => {
    const activeCount = templates.filter((t) => !('deleted' in t) && t.status === 'published').length;
    return HttpResponse.json({
      code: 200,
      message: 'success',
      data: {
        activeWorkflows: activeCount,
        avgSuccessRate: 87.5,
        totalRuns24h: 156,
      },
    });
  }),

  // 切换模板启用/停用状态
  http.put('/api/workflows/templates/:id/toggle-status', ({ params }) => {
    const tpl = templates.find((t) => t.id === params.id);
    if (!tpl) {
      return HttpResponse.json(
        { code: 40001, message: '模板不存在', data: null },
        { status: 404 },
      );
    }
    (tpl as any).status = (tpl as any).status === 'published' ? 'archived' : 'published';
    (tpl as any).updatedAt = new Date().toISOString();
    return HttpResponse.json({ code: 200, message: '操作成功', data: tpl });
  }),

  // 获取工作流模板列表
  http.get('/api/workflows/templates', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const size = Number(url.searchParams.get('size') || 20);
    const keyword = url.searchParams.get('keyword') || '';
    const category = url.searchParams.get('category') || '';
    const isBuiltin = url.searchParams.get('isBuiltin');

    let filtered = templates.filter((t) => !('deleted' in t));

    if (keyword) {
      filtered = filtered.filter(
        (t) => t.name.includes(keyword) || t.description.includes(keyword),
      );
    }
    if (category) {
      filtered = filtered.filter((t) => t.category === category);
    }
    if (isBuiltin !== null && isBuiltin !== undefined && isBuiltin !== '') {
      filtered = filtered.filter((t) => t.isBuiltin === (isBuiltin === 'true'));
    }

    const start = (page - 1) * size;
    const records = filtered.slice(start, start + size);

    return HttpResponse.json({
      code: 200,
      message: 'success',
      data: {
        records,
        total: filtered.length,
        current: page,
        size,
        pages: Math.ceil(filtered.length / size),
      },
    });
  }),

  // 获取模板详情
  http.get('/api/workflows/templates/:id', ({ params }) => {
    const tpl = templates.find((t) => t.id === params.id);
    if (!tpl) {
      return HttpResponse.json(
        { code: 40001, message: '模板不存在', data: null },
        { status: 404 },
      );
    }
    return HttpResponse.json({ code: 200, message: 'success', data: tpl });
  }),

  // 创建模板
  http.post('/api/workflows/templates', async ({ request }) => {
    const body = (await request.json()) as WorkflowTemplateCreateDTO;
    const newTpl = {
      id: `wf-tpl-${++idCounter}`,
      name: body.name,
      description: body.description || '',
      category: body.category,
      definition: body.definition || { nodes: [], edges: [] },
      recommendedAgentSkills: body.recommendedAgentSkills || [],
      isBuiltin: false,
      status: 'draft',
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    templates.push(newTpl as any);
    return HttpResponse.json({ code: 200, message: '创建成功', data: newTpl });
  }),

  // 更新模板
  http.put('/api/workflows/templates/:id', async ({ params, request }) => {
    const tpl = templates.find((t) => t.id === params.id);
    if (!tpl) {
      return HttpResponse.json(
        { code: 40001, message: '模板不存在', data: null },
        { status: 404 },
      );
    }
    if (tpl.isBuiltin) {
      return HttpResponse.json(
        { code: 40014, message: '内置模板不可修改', data: null },
        { status: 403 },
      );
    }
    const body = (await request.json()) as Record<string, any>;
    Object.assign(tpl, body, { updatedAt: new Date().toISOString() });
    return HttpResponse.json({ code: 200, message: '更新成功', data: tpl });
  }),

  // 删除模板
  http.delete('/api/workflows/templates/:id', ({ params }) => {
    const index = templates.findIndex((t) => t.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { code: 40001, message: '模板不存在', data: null },
        { status: 404 },
      );
    }
    if (templates[index].isBuiltin) {
      return HttpResponse.json(
        { code: 40014, message: '内置模板不可删除', data: null },
        { status: 403 },
      );
    }
    templates.splice(index, 1);
    return HttpResponse.json({ code: 200, message: '删除成功', data: null });
  }),
];
