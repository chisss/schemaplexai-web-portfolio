/**
 * 顶部导航栏组件
 */
import { Avatar, Badge, Button, Dropdown, Space, Switch, Typography, type MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MoonOutlined,
  SunOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { getSupportedLocales, changeLanguage } from '@/i18n';
import { useInAppUnreadCount } from '@/api/inAppMessage';
import { resolveRouteContext } from '@/utils/routeContext';

const { Text } = Typography;

interface HeaderBarProps {
  isMobile?: boolean;
  onMobileMenuToggle?: () => void;
}

export default function HeaderBar({ isMobile, onMobileMenuToggle }: HeaderBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, theme, locale, toggleCollapsed, setTheme, setLocale } = useAppStore();
  const { userInfo, logout } = useAuthStore();
  const { t } = useTranslation();
  const { data: unreadCount = 0 } = useInAppUnreadCount();
  const { moduleLabel, pageLabel } = resolveRouteContext(location.pathname, t);

  // 用户菜单项
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('user.profile'),
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('user.settings'),
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('user.logout'),
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  // 语言菜单项（从 i18n 模块动态获取支持的语言列表）
  const locales = getSupportedLocales();
  const currentLocale = locales.find(l => l.code === locale);
  const languageMenuItems: MenuProps['items'] = locales.map(l => ({
    key: l.code,
    label: `${l.flag} ${l.name}`,
    onClick: () => {
      setLocale(l.code as 'zh-CN' | 'en-US');
      changeLanguage(l.code);
    },
  }));

  // 主题切换
  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <div className="app-header__inner">
      <div className="app-header__left">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={isMobile ? onMobileMenuToggle : toggleCollapsed}
          className="app-header__toggle"
          aria-label={collapsed ? t('layout.expandSidebar') : t('layout.collapseSidebar')}
        />
        <div className="app-header__context">
          <Text className="app-header__eyebrow">{moduleLabel}</Text>
          <Text className="app-header__title" ellipsis>
            {pageLabel}
          </Text>
        </div>
      </div>

      <Space className="app-header__right" size={isMobile ? 10 : 14}>
        <Dropdown menu={{ items: languageMenuItems, selectedKeys: [locale] }} placement="bottomRight">
          <Button
            type="text"
            className="app-header__control"
            icon={<><span style={{ marginRight: 4, fontSize: 14 }}>{currentLocale?.flag}</span><GlobalOutlined /></>}
            aria-label={t('layout.switchLanguage')}
          />
        </Dropdown>

        {!isMobile && (
          <Switch
            checked={theme === 'dark'}
            onChange={handleThemeChange}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            aria-label={t('layout.toggleTheme')}
          />
        )}

        <Badge count={unreadCount} size="small" overflowCount={99} showZero={false}>
          <Button
            type="text"
            className="app-header__control"
            icon={<BellOutlined />}
            aria-label={t('layout.notifications')}
            onClick={() => navigate('/notification/inbox')}
          />
        </Badge>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <button type="button" className="app-header__profile">
            <Avatar
              src={userInfo?.avatar}
              icon={!userInfo?.avatar && <UserOutlined />}
              size="small"
              className="app-header__avatar"
            />
            {!isMobile && (
              <span className="app-header__profile-name">
                {userInfo?.nickname || userInfo?.username || t('user.profile')}
              </span>
            )}
          </button>
        </Dropdown>
      </Space>
    </div>
  );
}
