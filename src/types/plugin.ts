export type PluginVendor = 'Claude' | 'OpenAI' | 'Gemini' | 'Local';
export type PluginStatus = 'uninstalled' | 'installing' | 'installed' | 'update_available';

export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: string;
  sourceType: PluginVendor;
  status: PluginStatus;
  version: string;
  rating?: number;
}
