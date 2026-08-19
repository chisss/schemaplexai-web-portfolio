import {
  DownloadOutlined,
  CheckCircleFilled,
  SyncOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MouseEvent } from 'react';
import type { Plugin } from '../../../types/plugin';

interface PluginCardProps {
  plugin: Plugin;
  onClick: (plugin: Plugin) => void;
  onInstall: (e: MouseEvent, pluginId: string) => void;
  onUpdate: (e: MouseEvent, pluginId: string) => void;
}

export function PluginCard({ plugin, onClick, onInstall, onUpdate }: PluginCardProps) {
  const { t } = useTranslation();

  const vendorColors = {
    Claude: 'bg-purple-100 text-purple-700 border-purple-200',
    OpenAI: 'bg-green-100 text-green-700 border-green-200',
    Gemini: 'bg-blue-100 text-blue-700 border-blue-200',
    Local: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <div
      className="group relative flex flex-col bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer h-full"
    >
      <button
        type="button"
        aria-label={t('marketplace.viewPluginDetail', { name: plugin.name })}
        onClick={() => onClick(plugin)}
        className="absolute inset-0 rounded-xl"
        style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
      />
      <div className="relative z-10 pointer-events-none">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 pr-2">
            {plugin.name}
          </h3>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${vendorColors[plugin.sourceType]}`}>
            {plugin.sourceType}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-4 flex-grow line-clamp-2">
          {plugin.description}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 pointer-events-none">
          {plugin.category}
        </span>

        <div className="relative z-20" onClick={(e) => e.stopPropagation()}>
          {plugin.status === 'uninstalled' && (
            <button
              onClick={(e) => onInstall(e, plugin.id)}
              className="flex items-center gap-1.5 px-3 h-9 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <DownloadOutlined className="text-sm" />
              {t('marketplace.install')}
            </button>
          )}

          {plugin.status === 'installing' && (
            <button disabled className="flex items-center gap-1.5 px-3 h-9 text-sm font-medium text-blue-600 bg-blue-50 rounded-md opacity-75 cursor-not-allowed">
              <LoadingOutlined spin className="text-sm" />
              {t('marketplace.installing')}
            </button>
          )}

          {plugin.status === 'installed' && (
            <button disabled className="flex items-center gap-1.5 px-3 h-9 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md cursor-default">
              <CheckCircleFilled className="text-sm" />
              {t('marketplace.statusInstalled')}
            </button>
          )}

          {plugin.status === 'update_available' && (
            <button
              onClick={(e) => onUpdate(e, plugin.id)}
              className="flex items-center gap-1.5 px-3 h-9 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md transition-colors"
            >
              <SyncOutlined className="text-sm" />
              {t('marketplace.update')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
