/**
 * 页面容器组件
 * 统一页面英雄区、操作栏与内容节奏
 */
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resolveRouteContext } from '@/utils/routeContext';

interface PageContainerProps {
  title?: string;
  description?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function PageContainer({
  title,
  description,
  extra,
  children,
  className,
  contentClassName,
}: PageContainerProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const routeContext = resolveRouteContext(location.pathname, t);
  const displayTitle = title ?? routeContext.pageLabel;
  const displayDescription = description ?? routeContext.trailLabel;

  return (
    <div className={['page-shell', className].filter(Boolean).join(' ')}>
      {(displayTitle || extra) && (
        <section className="page-shell__hero animate-fadeInUp">
          <div className="page-shell__header">
            <div className="page-shell__headline">
              <span className="page-shell__kicker">{routeContext.moduleLabel}</span>
              <h1 className="page-shell__title">{displayTitle}</h1>
              <p className="page-shell__description">{displayDescription}</p>
            </div>
            {extra && <div className="page-shell__actions">{extra}</div>}
          </div>
        </section>
      )}
      <div className={['page-shell__body', 'animate-fadeInUp', 'delay-1', contentClassName].filter(Boolean).join(' ')}>
        {children}
      </div>
    </div>
  );
}
