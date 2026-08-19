/**
 * 403 无权限页面
 */
import { Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Forbidden() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div
          style={{
            width: 120,
            height: 120,
            margin: '0 auto 32px',
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(255,77,79,0.1) 0%, rgba(255,163,31,0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LockOutlined style={{ fontSize: 56, color: '#ff4d4f' }} />
        </div>

        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 12,
            color: '#1D2129',
          }}
        >
          {t('forbidden.title')}
        </h2>
        <p style={{ fontSize: 15, color: '#4E5969', marginBottom: 32 }}>
          {t('forbidden.description')}
        </p>

        <Button type="primary" onClick={() => navigate('/')}>
          {t('forbidden.backHome')}
        </Button>
      </div>
    </div>
  );
}
