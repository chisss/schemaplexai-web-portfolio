import { useEffect } from 'react';
import {
  CloseOutlined,
  StarFilled,
  SafetyCertificateOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { Plugin } from '../../../types/plugin';

interface DrawerProps {
  plugin: Plugin | null;
  isOpen: boolean;
  onClose: () => void;
  onInstall: (pluginId: string) => void;
}

export function PluginDetailDrawer({ plugin, isOpen, onClose, onInstall }: DrawerProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!plugin && !isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-950/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {plugin && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 id="drawer-title" className="text-xl font-bold text-gray-900">{plugin.name}</h2>
              <button
                onClick={onClose}
                autoFocus
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="关闭"
              >
                <CloseOutlined className="text-base" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-4 mb-6 text-sm text-gray-600 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-1"><SafetyCertificateOutlined className="text-green-600" /> v{plugin.version}</div>
                <div className="flex items-center gap-1 text-yellow-500"><StarFilled /> {plugin.rating || 'N/A'}</div>
                <div className="px-2 py-0.5 bg-gray-100 rounded text-xs">{plugin.sourceType}</div>
              </div>

              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileTextOutlined /> 关于
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {plugin.description}
              </p>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => onInstall(plugin.id)}
                disabled={plugin.status !== 'uninstalled'}
                className={`w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${plugin.status === 'uninstalled' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' : 'bg-gray-400 cursor-not-allowed'}`}
              >
                {plugin.status === 'uninstalled' ? <><DownloadOutlined /> 安装插件</> : '已安装'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
