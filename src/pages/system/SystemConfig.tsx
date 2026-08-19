/**
 * 系统配置中心
 * 三个标签页：AI 模型管理 | 路由规则 | 模型组
 */
import { useState } from 'react';
import { Card, Tabs, message } from 'antd';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useAllAiModels, useRoutes } from '@/api/system';
import ModelCardList from './components/ModelCardList';
import ModelFormModal from './components/ModelFormModal';
import RouteRuleList from './components/RouteRuleList';
import RouteRuleFormModal from './components/RouteRuleFormModal';
import ModelGroupTab from './components/ModelGroupTab';
import type { AiModel, AiModelRoute } from '@/types/system';

export default function SystemConfig() {
  const { t } = useTranslation();

  // AI 模型
  const { data: allModels = [], isLoading: modelsLoading, refetch: refetchModels } = useAllAiModels();
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AiModel | undefined>(undefined);

  // 路由规则
  const { data: routes = [], isLoading: routesLoading, refetch: refetchRoutes } = useRoutes();
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<AiModelRoute | undefined>(undefined);

  const handleAddModel = () => {
    setEditingModel(undefined);
    setModelModalOpen(true);
  };

  const handleEditModel = (model: AiModel) => {
    setEditingModel(model);
    setModelModalOpen(true);
  };

  const handleAddRoute = () => {
    setEditingRoute(undefined);
    setRouteModalOpen(true);
  };

  const handleEditRoute = (route: AiModelRoute) => {
    setEditingRoute(route);
    setRouteModalOpen(true);
  };

  const tabItems = [
    {
      key: 'models',
      label: t('system.config.tabModel'),
      children: (
        <div className="py-2">
          <ModelCardList
            models={allModels}
            isLoading={modelsLoading}
            onAdd={handleAddModel}
            onEdit={handleEditModel}
            onDelete={() => refetchModels()}
          />
        </div>
      ),
    },
    {
      key: 'routes',
      label: t('system.config.tabRoute'),
      children: (
        <div className="py-2">
          <RouteRuleList
            routes={routes}
            isLoading={routesLoading}
            models={allModels}
            onAdd={handleAddRoute}
            onEdit={handleEditRoute}
            onDelete={() => refetchRoutes()}
          />
        </div>
      ),
    },
    {
      key: 'model-groups',
      label: t('system.config.tab.modelGroup'),
      children: (
        <div className="py-2">
          <ModelGroupTab />
        </div>
      ),
    },
  ];

  return (
    <PageContainer title={t('system.config.title')}>
      <Card variant="borderless" className="shadow-sm rounded-xl">
        <Tabs size="large" items={tabItems} />
      </Card>

      {/* AI 模型表单 Modal */}
      <ModelFormModal
        open={modelModalOpen}
        onCancel={() => setModelModalOpen(false)}
        onSuccess={() => {
          setModelModalOpen(false);
          refetchModels();
          message.success(t('common.saveSuccess'));
        }}
        editingModel={editingModel}
      />

      {/* 路由规则表单 Modal */}
      <RouteRuleFormModal
        open={routeModalOpen}
        onCancel={() => setRouteModalOpen(false)}
        onSuccess={() => {
          setRouteModalOpen(false);
          refetchRoutes();
          message.success(t('common.saveSuccess'));
        }}
        models={allModels}
        editingRoute={editingRoute}
      />
    </PageContainer>
  );
}
