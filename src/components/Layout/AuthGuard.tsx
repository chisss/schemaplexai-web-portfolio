/**
 * 路由守卫组件
 * 1. 未登录自动跳转到登录页
 * 2. 路由级权限检查：按页面路由匹配所需 menu 权限 code，无权则展示 403 页面
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import Forbidden from '@/pages/error/Forbidden';
import { findNavigationPermission } from '@/config/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { accessToken, hasPermission } = useAuthStore();
  const location = useLocation();

  if (!accessToken) {
    // 未登录，跳转到登录页，并保存当前路径
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 路由级权限检查（精确前缀匹配，越长的前缀越优先）
  const matchedPermission = findNavigationPermission(location.pathname);

  if (matchedPermission && !hasPermission(matchedPermission)) {
    return <Forbidden />;
  }

  return <>{children}</>;
}
