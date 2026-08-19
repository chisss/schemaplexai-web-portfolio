/**
 * Spec Mock Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockSpecs, mockSpecDocuments } from '../data/spec';
import type { SpecCreateDTO } from '@/types/spec';

function buildMockVersions(specId: string, docType: string) {
  const key = `${specId}-${docType}`;
  const document = mockSpecDocuments[key];
  const latestContent = document?.content || '';
  const previousContent = latestContent
    ? latestContent.split('\n').slice(0, Math.max(2, Math.floor(latestContent.split('\n').length * 0.7))).join('\n')
    : '';

  return [
    {
      id: `version-${specId}-${docType}-2`,
      docType,
      content: latestContent,
      versionNumber: Math.max(document?.version || 1, 2),
      changeSummary: '补充交付范围与实现细节',
      createdBy: 'admin',
      createdAt: document?.updatedAt || new Date().toISOString(),
    },
    {
      id: `version-${specId}-${docType}-1`,
      docType,
      content: previousContent,
      versionNumber: 1,
      changeSummary: '初始草稿',
      createdBy: 'admin',
      createdAt: document?.createdAt || new Date().toISOString(),
    },
  ];
}

function buildDiffLines(sourceContent: string, targetContent: string) {
  const sourceLines = sourceContent.split('\n');
  const targetLines = targetContent.split('\n');
  const lineCount = Math.max(sourceLines.length, targetLines.length);
  const lines: Array<{ type: string; content: string }> = [];

  for (let index = 0; index < lineCount; index += 1) {
    const sourceLine = sourceLines[index];
    const targetLine = targetLines[index];

    if (sourceLine === targetLine) {
      if (sourceLine) {
        lines.push({ type: 'unchanged', content: sourceLine });
      }
      continue;
    }

    if (sourceLine) {
      lines.push({ type: 'removed', content: sourceLine });
    }
    if (targetLine) {
      lines.push({ type: 'added', content: targetLine });
    }
  }

  return lines;
}

export const specHandlers = [
  // 获取 Spec 列表
  http.get('/api/specs', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const size = Number(url.searchParams.get('size') || 20);
    const keyword = url.searchParams.get('keyword') || '';

    let filtered = mockSpecs;

    // 关键词搜索
    if (keyword) {
      filtered = filtered.filter((s) =>
        s.name.includes(keyword) || s.description.includes(keyword)
      );
    }

    const start = (page - 1) * size;
    const end = start + size;
    const records = filtered.slice(start, end);

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

  // 获取 Spec 详情
  http.get('/api/specs/:id', ({ params }) => {
    const spec = mockSpecs.find((s) => s.id === params.id);
    if (!spec) {
      return HttpResponse.json(
        { code: 30001, message: 'Spec 不存在', data: null },
        { status: 404 }
      );
    }
    return HttpResponse.json({ code: 200, message: 'success', data: spec });
  }),

  // 创建 Spec
  http.post('/api/specs', async ({ request }) => {
    const body = (await request.json()) as SpecCreateDTO;
    const newSpec = {
      id: String(mockSpecs.length + 1),
      name: body.name,
      version: '1.0.0',
      status: 'draft' as const,
      priority: body.priority || ('medium' as const),
      category: body.category || 'feature-development',
      description: body.description || '',
      projectId: body.projectId,
      owner: 'admin',
      tags: body.tags || [],
      reviewLevel: 'manual' as const,
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockSpecs.push(newSpec);
    return HttpResponse.json({ code: 200, message: '创建成功', data: newSpec });
  }),

  // 删除 Spec
  http.delete('/api/specs/:id', ({ params }) => {
    const index = mockSpecs.findIndex((s) => s.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { code: 30001, message: 'Spec 不存在', data: null },
        { status: 404 }
      );
    }
    mockSpecs.splice(index, 1);
    return HttpResponse.json({ code: 200, message: '删除成功', data: null });
  }),

  // 获取 Spec 文档
  http.get('/api/specs/:specId/documents/:docType', ({ params }) => {
    const key = `${params.specId}-${params.docType}`;
    const document = mockSpecDocuments[key];

    if (!document) {
      return HttpResponse.json({
        code: 200,
        message: 'success',
        data: {
          id: `doc-${params.specId}-${params.docType}`,
          docType: params.docType,
          content: '',
          version: 1,
          wordCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    return HttpResponse.json({ code: 200, message: 'success', data: document });
  }),

  // 获取文档版本历史
  http.get('/api/specs/:specId/versions', ({ params, request }) => {
    const url = new URL(request.url);
    const docType = url.searchParams.get('docType') || 'requirements';
    return HttpResponse.json({
      code: 200,
      message: 'success',
      data: buildMockVersions(String(params.specId), docType),
    });
  }),

  // 获取指定版本详情
  http.get('/api/specs/:specId/versions/:versionId', ({ params, request }) => {
    const url = new URL(request.url);
    const docType = url.searchParams.get('docType') || 'requirements';
    const version = buildMockVersions(String(params.specId), docType).find((item) => item.id === params.versionId);
    if (!version) {
      return HttpResponse.json({ code: 404, message: 'version not found', data: null }, { status: 404 });
    }
    return HttpResponse.json({ code: 200, message: 'success', data: version });
  }),

  // 版本对比
  http.post('/api/specs/:specId/versions/diff', async ({ params, request }) => {
    const body = (await request.json()) as { sourceVersionId: string; targetVersionId: string };
    const docTypes = ['requirements', 'design', 'tasks'] as const;
    const versionPool = docTypes.flatMap((docType) => buildMockVersions(String(params.specId), docType));
    const sourceVersion = versionPool.find((item) => item.id === body.sourceVersionId);
    const targetVersion = versionPool.find((item) => item.id === body.targetVersionId);

    if (!sourceVersion || !targetVersion) {
      return HttpResponse.json({ code: 404, message: 'version not found', data: null }, { status: 404 });
    }

    return HttpResponse.json({
      code: 200,
      message: 'success',
      data: {
        lines: buildDiffLines(sourceVersion.content, targetVersion.content),
        sourceContent: sourceVersion.content,
        targetContent: targetVersion.content,
      },
    });
  }),

  // 更新 Spec 文档
  http.put('/api/specs/:specId/documents/:docType', async ({ params, request }) => {
    const body = (await request.json()) as { content: string };
    const key = `${params.specId}-${params.docType}`;

    const document = {
      id: `doc-${params.specId}-${params.docType}`,
      docType: params.docType as any,
      content: body.content,
      version: (mockSpecDocuments[key]?.version || 0) + 1,
      wordCount: body.content.length,
      createdAt: mockSpecDocuments[key]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockSpecDocuments[key] = document;

    return HttpResponse.json({ code: 200, message: '保存成功', data: document });
  }),

  // 提交审批
  http.post('/api/specs/:id/submit', () =>
    HttpResponse.json({ code: 200, message: '提交成功', data: null }),
  ),

  // 审批通过
  http.post('/api/specs/:id/approve', () =>
    HttpResponse.json({ code: 200, message: '审批通过', data: null }),
  ),

  // 审批驳回
  http.post('/api/specs/:id/reject', () =>
    HttpResponse.json({ code: 200, message: '审批驳回', data: null }),
  ),
];
