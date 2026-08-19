/**
 * 侧边栏菜单组件
 * 现代化设计 - 图标 + hover 动画 + 渐变选中效果
 */
import { Menu, type MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { NAVIGATION_ITEMS, type NavigationItem } from '@/config/navigation';

type MenuItem = Required<MenuProps>['items'][number];

interface SideMenuProps {
  onMenuClick?: () => void;
}

export default function SideMenu({ onMenuClick }: SideMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { theme } = useAppStore();
  const { hasPermission } = useAuthStore();

  const toMenuItems = (items: NavigationItem[]): MenuItem[] => items.reduce<MenuItem[]>((acc, item) => {
    if (item.hiddenInMenu) return acc;
    const children = item.children ? toMenuItems(item.children) : undefined;
    if (item.permissionCode && !children?.length && !hasPermission(item.permissionCode)) {
      return acc;
    }
    if (item.children && !children?.length) {
      return acc;
    }
    acc.push({
      key: item.path,
      icon: item.icon,
      label: t(item.labelKey),
      children,
    } as MenuItem);
    return acc;
  }, []);

  const menuItems = toMenuItems(NAVIGATION_ITEMS);

  // 根据当前路径获取选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname;
    // 匹配二级菜单（system 和 integration 子路由）
    if (path.startsWith('/system/')) return [path];
    if (path.startsWith('/integration/')) {
      const parts = path.split('/');
      if (parts.length >= 3) return [`/integration/${parts[2]}`];
    }
    if (path.startsWith('/data-management/')) {
      const parts = path.split('/');
      if (parts.length >= 3) return [`/data-management/${parts[2]}`];
    }
    if (path.startsWith('/notification/')) {
      const parts = path.split('/');
      if (parts.length >= 3) return [`/notification/${parts[2]}`];
    }
    if (path === '/security-compliance') return ['/security-compliance/overview'];
    if (path === '/approval-center') return ['/approval-center'];
    if (path.startsWith('/security-compliance/')) {
      const parts = path.split('/');
      if (parts.length >= 3) return [`/security-compliance/${parts[2]}`];
    }
    if (path === '/quality') return ['/quality/issues'];
    if (path.startsWith('/quality/')) {
      const qualitySegments = path.split('/');
      if (qualitySegments.length >= 3 && qualitySegments[2]) {
        const candidate = `/quality/${qualitySegments[2]}`;
        if (candidate === '/quality/issues'
          || candidate === '/quality/deviations'
          || candidate === '/quality/intent-defects'
          || candidate === '/quality/cross-reviews'
          || candidate === '/quality/rules') {
          return [candidate];
        }
      }
      return ['/quality/issues'];
    }
    if (path === '/project') return ['/project/workspaces'];
    if (path.startsWith('/project/workspaces/')) return ['/project/workspaces'];
    if (path.startsWith('/project/')) {
      const projectSegments = path.split('/');
      if (projectSegments.length >= 3 && projectSegments[2]) {
        const candidate = `/project/${projectSegments[2]}`;
        if (candidate === '/project/workspaces'
          || candidate === '/project/branches'
          || candidate === '/project/branch-rules') {
          return [candidate];
        }
      }
      return ['/project/workspaces'];
    }
    if (path === '/workflow') return ['/workflow/config'];
    if (path === '/workflow/config' || path === '/workflow/executions' || path === '/workflow/triggers') return [path];
    if (path === '/monitor') return ['/monitor'];
    if (path.startsWith('/monitor/')) {
      const monitorSegments = path.split('/');
      if (monitorSegments.length >= 3 && monitorSegments[2]) {
        const candidate = `/monitor/${monitorSegments[2]}`;
        if (candidate === '/monitor/reports' || candidate === '/monitor/traces') {
          return [candidate];
        }
      }
      return ['/monitor'];
    }
    const firstLevel = '/' + path.split('/')[1];
    return [firstLevel || '/'];
  };

  // 根据当前路径获取展开的菜单组
  const getOpenKeys = () => {
    const path = location.pathname;
    const keys: string[] = [];
    if (path.startsWith('/system')) keys.push('/system');
    if (path.startsWith('/integration')) keys.push('/integration');
    if (path.startsWith('/data-management')) keys.push('/data-management');
    if (path.startsWith('/notification')) keys.push('/notification');
    if (path.startsWith('/security-compliance')) keys.push('/security-compliance');
    if (path.startsWith('/quality')) keys.push('/quality');
    if (path.startsWith('/project')) keys.push('/project');
    if (path.startsWith('/workflow')) keys.push('/workflow');
    if (path.startsWith('/monitor')) keys.push('/monitor-section');
    return keys;
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
    onMenuClick?.(); // 移动端点击后关闭菜单
  };

  return (
    <Menu
      theme={theme === 'dark' ? 'dark' : 'light'}
      mode="inline"
      selectedKeys={getSelectedKeys()}
      defaultOpenKeys={getOpenKeys()}
      items={menuItems}
      onClick={handleMenuClick}
      inlineIndent={18}
      style={{
        border: 'none',
        background: 'transparent',
      }}
      className="custom-side-menu"
    />
  );
}
