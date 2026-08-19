/**
 * 登录页面
 */
import { useEffect, useMemo, useState } from 'react';
import { Form, Input, Button, Card, App as AntApp, Space, Tag } from 'antd';
import {
  UserOutlined,
  LockOutlined,

  ApartmentOutlined,
  FileTextOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/useAuthStore';
import { login } from '@/api/auth';
import type { LoginDTO } from '@/types/auth';

export default function Login() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { setTokens, setUserInfo } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const capabilities = useMemo(
    () => [
      { key: 'agent', label: t('menu.agent'), icon: <RobotOutlined /> },
      { key: 'spec', label: t('menu.spec'), icon: <FileTextOutlined /> },
      { key: 'workflow', label: t('menu.workflow'), icon: <ApartmentOutlined /> },
      { key: 'quality', label: t('menu.quality'), icon: <SafetyCertificateOutlined /> },
    ],
    [t],
  );

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${t('login.loginButton')} | SchemaPlexAI`;

    return () => {
      document.title = previousTitle;
    };
  }, [t]);

  const onFinish = async (values: LoginDTO) => {
    setLoading(true);
    try {
      const res = await login(values);
      // 保存 token 和用户信息
      setTokens(res.data.accessToken, res.data.refreshToken);
      setUserInfo(res.data.userInfo);
      message.success(t('login.loginSuccess'));
      // 跳转到原始页面或首页
      const from = (location.state as { from?: string } | null)?.from || '/';
      navigate(from, { replace: true });
    } catch {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-shell">
      <div className="login-shell__halo" aria-hidden="true" />
      <div className="login-shell__grid">
        <section className="login-shell__intro">
          <span className="login-shell__kicker">{t('layout.subtitle')}</span>
          <h1 className="login-shell__title">{t('login.title')}</h1>
          <p className="login-shell__description">{t('login.subtitle')}</p>
          <Space wrap size={[10, 10]}>
            {capabilities.map((capability) => (
              <Tag key={capability.key} className="login-shell__chip" icon={capability.icon}>
                {capability.label}
              </Tag>
            ))}
          </Space>
        </section>

        <Card variant="borderless" className="login-shell__panel">
          <div className="login-shell__brand">
            <div className="login-shell__brand-mark">
              <img src="/schemaplexai-logo.svg" alt="SchemaPlexAI" style={{ width: 40, height: 40 }} />
            </div>
            <div>
              <h2 className="login-shell__brand-title">SchemaPlexAI</h2>
              <p className="login-shell__brand-subtitle">{t('login.subtitle')}</p>
            </div>
          </div>

          <Form name="login" onFinish={onFinish} size="large" autoComplete="on" layout="vertical">
            <Form.Item
              name="username"
              label={t('login.username')}
              rules={[{ required: true, message: t('login.usernameRequired') }]}
            >
              <Input
                autoComplete="username"
                prefix={<UserOutlined />}
                placeholder={t('login.username')}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={t('login.password')}
              rules={[{ required: true, message: t('login.passwordRequired') }]}
            >
              <Input.Password
                autoComplete="current-password"
                prefix={<LockOutlined />}
                placeholder={t('login.password')}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                icon={<ArrowRightOutlined />}
                iconPlacement="end"
              >
                {t('login.loginButton')}
              </Button>
            </Form.Item>

            <div className="login-shell__footer">
              <span>{t('login.noAccount')}</span>
              <span className="login-shell__footer-note">{t('login.contactAdmin')}</span>
            </div>
          </Form>
        </Card>
      </div>
    </main>
  );
}
