/**
 * 面包屑导航组件
 */
import { useMemo } from 'react';
import { Breadcrumb } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { resolveRouteContext } from '@/utils/routeContext';

export default function BreadcrumbNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const pathSnippets = location.pathname.split('/').filter(Boolean);

  // 生成面包屑项
  const breadcrumbItems = useMemo(
    () => [
      {
        title: (
          <Link to="/" aria-label={t('menu.dashboard')}>
            <HomeOutlined />
          </Link>
        ),
      },
      ...pathSnippets.map((_, index) => {
        const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
        const { pageLabel } = resolveRouteContext(url, t);
        const isLast = index === pathSnippets.length - 1;

        return {
          title: isLast ? pageLabel : <Link to={url}>{pageLabel}</Link>,
        };
      }),
    ],
    [pathSnippets, t],
  );

  // 首页不显示面包屑
  if (location.pathname === '/') {
    return null;
  }

  return (
    <div className="app-breadcrumb" aria-label={t('menu.dashboard')}>
      <Breadcrumb items={breadcrumbItems} />
    </div>
  );
}
