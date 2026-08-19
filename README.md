# SchemaPlexAI Web

> 2026 年 4 月完成的个人项目展示：AI 研发协作平台的浏览器控制台。

SchemaPlexAI Web 面向研发团队、项目管理员和平台运营人员，提供 Agent、Spec、工作流、质量、安全、知识与集成能力的可视化入口。它与服务端 API 配合使用，也支持通过 MSW Mock 独立演示主要交互。

## 项目关系

- [服务端](https://github.com/chisss/schemaplexai-server-portfolio)：提供业务 API、Agent 执行与治理能力
- [桌面端](https://github.com/chisss/schemaplexai-desktop-portfolio)：本地优先的研发工作台
- [产品官网](https://github.com/chisss/schemapplexai-official-web-portfolio)：产品能力和界面展示站

## 技术栈

| 范畴 | 技术 | 作用 |
| --- | --- | --- |
| UI 框架 | React 19、TypeScript | 类型安全的组件化界面 |
| 构建与路由 | Vite、React Router 7 | 快速开发、按业务域组织页面 |
| 组件与样式 | Ant Design 6、Tailwind CSS | 企业级表单、表格、布局与主题 |
| 状态管理 | Zustand、TanStack Query | 本地状态与服务端缓存分离 |
| 可视化 | ECharts、AntV G6、React Flow | 监控图表、知识图谱与工作流编排 |
| 编辑体验 | Monaco Editor、React Markdown | Spec、脚本与 Markdown 文档编辑 |
| 工程质量 | ESLint、TypeScript、MSW | 静态检查、类型检查与独立 Mock |

## 功能模块

| 模块 | 面向场景 | 技术实现 |
| --- | --- | --- |
| 控制塔首页 | 快速了解执行、审批、质量和安全状态 | 组合 TanStack Query 数据与 ECharts 卡片，形成聚合视图。 |
| Agent 中心 | 创建 Agent、配置能力、查看执行详情 | React 表单与 Query Mutation 管理资源生命周期，执行页展示事件流。 |
| Spec 管理 | 创建、编辑和评审研发规格 | Monaco Editor 承载结构化编辑，Markdown 渲染文档内容。 |
| Workflow | 可视化编排和触发研发流程 | React Flow 管理节点、连线和画布交互，页面与执行记录联动。 |
| Quality | 查看质量任务、偏差和交叉评审 | 列表、筛选、详情和趋势图组合，支持从指标进入问题。 |
| Security & Approval | 处理风险阻断、审批和合规事件 | 统一的状态标签、详情面板和操作确认承接服务端治理状态。 |
| Context & RAG | 管理工作空间上下文、文档和知识图谱 | 文档列表、详情编辑与 G6 图谱视图协同展示知识关系。 |
| Integrations | 接入数据库、模型、MCP、Git 与通知渠道 | 分步向导和动态配置表单减少复杂集成的操作成本。 |
| System | 管理租户、用户、角色、菜单和字典 | 复用 Ant Design Table / Form，按权限控制可见操作。 |

## 使用场景

- 研发负责人查看 Agent 执行、审批积压和质量风险。
- 产品或架构人员在线维护 Spec、流程模板和交付物。
- 平台管理员配置模型、知识库、数据库、MCP 与通知渠道。
- 安全或合规人员复核高风险工具调用、审计轨迹和处置结果。
- 前端开发者使用 Mock 数据独立开发页面，不依赖完整后端环境。

## 本地运行

```bash
cd schemaplexai-web
pnpm install
cp .env.example .env.development
pnpm dev
```

访问 `http://localhost:5173/`。生产构建：

```bash
pnpm build
```

## 权利声明

本仓库不授予任何开源许可证。版权所有，保留所有权利（All Rights Reserved）。
