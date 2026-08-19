import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import type { PluginVendor } from '../../../types/plugin';

interface FilterBarProps {
  keyword: string;
  setKeyword: (kw: string) => void;
  vendor: PluginVendor | 'All';
  setVendor: (v: PluginVendor | 'All') => void;
  status: string;
  setStatus: (s: string) => void;
}

export function MarketplaceFilterBar({
  keyword,
  setKeyword,
  vendor,
  setVendor,
  status,
  setStatus,
}: FilterBarProps) {
  const vendors: (PluginVendor | 'All')[] = ['All', 'Claude', 'OpenAI', 'Gemini', 'Local'];

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
      <div className="relative w-full md:w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchOutlined className="text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
          placeholder="搜索插件..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          aria-label="搜索插件"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-md overflow-x-auto w-full sm:w-auto">
          {vendors.map((v) => (
            <button
              key={v}
              onClick={() => setVendor(v)}
              aria-pressed={vendor === v}
              className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                vendor === v ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="relative flex items-center w-full sm:w-auto">
          <FilterOutlined className="absolute left-3 text-gray-400" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-full sm:w-40 pl-9 pr-8 py-2 text-sm border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50 cursor-pointer"
            aria-label="按状态筛选"
          >
            <option value="all">全部状态</option>
            <option value="installed">已安装</option>
            <option value="uninstalled">未安装</option>
            <option value="update_available">可更新</option>
          </select>
        </div>
      </div>
    </div>
  );
}
