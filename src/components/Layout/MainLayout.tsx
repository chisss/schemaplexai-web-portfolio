/**
 * 主布局组件
 * 统一全站导航壳层、响应式侧栏与内容画布
 */
import { useState, useEffect } from 'react';
import { Layout, Drawer } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import SideMenu from './SideMenu';
import HeaderBar from './HeaderBar';
import BreadcrumbNav from './BreadcrumbNav';
import { useAppStore } from '@/store/useAppStore';

const { Sider, Header, Content } = Layout;

interface SidebarBrandProps {
  collapsed: boolean;
  isMobile: boolean;
  subtitle: string;
}

function SidebarBrand({ collapsed, isMobile, subtitle }: SidebarBrandProps) {
  return (
    <div className={`app-sidebar__brand ${collapsed && !isMobile ? 'app-sidebar__brand--collapsed' : ''}`}>
      <div className="app-sidebar__mark" aria-hidden="true">
        <img src="/schemaplexai-logo.svg" alt="SchemaPlexAI" style={{ width: 32, height: 32 }} />
      </div>

      {!(collapsed && !isMobile) && (
        <div className="app-sidebar__copy">
          <span className="app-sidebar__name">SchemaPlexAI</span>
          <span className="app-sidebar__subtitle">{subtitle}</span>
        </div>
      )}
    </div>
  );
}

export default function MainLayout() {
  const { t } = useTranslation();
  const { collapsed, theme } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const isImmersivePage = isDashboard || location.pathname.startsWith('/workflow/designer');
  const sidebarWidth = collapsed ? 92 : 288;
  const sidebarSubtitle = t('layout.subtitle');

  // 响应式检测
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };
    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <Layout className={`app-shell app-shell--${theme}`} style={{ minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          size={304}
          rootClassName="app-sidebar-drawer"
          styles={{
            header: { display: 'none' },
            body: { padding: 0, background: 'transparent' },
            section: { background: 'var(--app-sidebar-bg)' },
          }}
          closeIcon={null}
        >
          <SidebarBrand collapsed={collapsed} isMobile={isMobile} subtitle={sidebarSubtitle} />
          <div className="app-sidebar__menu">
            <SideMenu onMenuClick={() => setMobileMenuOpen(false)} />
          </div>
        </Drawer>
      ) : (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={288}
          collapsedWidth={92}
          className="app-sidebar"
          style={{ position: 'fixed', inset: 0, insetInlineEnd: 'auto', overflow: 'hidden', zIndex: 110 }}
        >
          <SidebarBrand collapsed={collapsed} isMobile={isMobile} subtitle={sidebarSubtitle} />
          <div className="app-sidebar__menu">
            <SideMenu />
          </div>
          {!collapsed && <div className="app-sidebar__footer">{sidebarSubtitle}</div>}
        </Sider>
      )}

      <Layout
        style={{
          marginInlineStart: isMobile ? 0 : sidebarWidth,
          background: 'transparent',
        }}
      >
        <Header className="app-header" style={{ padding: 0, height: 82, lineHeight: 'normal' }}>
          <HeaderBar
            isMobile={isMobile}
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </Header>

        <Content
          className={`app-content ${isImmersivePage ? 'app-content--immersive' : ''}`}
          style={{ minHeight: 'calc(100vh - 82px)' }}
        >
          {!isImmersivePage && <BreadcrumbNav />}

          {isImmersivePage ? (
            <div className="app-canvas">
              <Outlet />
            </div>
          ) : (
            <div className="app-surface">
              <Outlet />
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
