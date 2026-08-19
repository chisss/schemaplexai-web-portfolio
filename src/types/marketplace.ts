export type MarketplaceSourceType = 'skill' | 'mcp';

export interface MarketplacePlugin {
  id: string;
  name: string;
  description?: string;
  category?: string;
  sourceType: MarketplaceSourceType | string;
  status?: string;
  installed: boolean;
  installedVersion?: string;
  signatureVerified?: boolean;
  compatibilityStatus?: 'compatible' | 'warning' | 'incompatible';
  version?: string;
  rating?: number;
}

export interface MarketplacePluginQuery {
  page?: number;
  size?: number;
  keyword?: string;
  sourceType?: MarketplaceSourceType;
  installed?: boolean;
}
