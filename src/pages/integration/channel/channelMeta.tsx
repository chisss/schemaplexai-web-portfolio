import React from 'react';
import {
  DingtalkOutlined,
  MailOutlined,
  MobileOutlined,
  SlackOutlined,
  WechatWorkFilled,
} from '@ant-design/icons';
import Lark from '@icon-park/react/lib/icons/Lark';
import type { TFunction } from 'i18next';

export const CHANNEL_TYPE_KEYS: Record<string, string> = {
  dingtalk: 'channel.typeDingtalk',
  wechat_work: 'channel.typeWechatWork',
  feishu: 'channel.typeFeishu',
  slack: 'channel.typeSlack',
  email: 'channel.typeEmail',
  sms: 'channel.typeSms',
};

export function getChannelTypeOptions(t: TFunction) {
  return Object.entries(CHANNEL_TYPE_KEYS).map(([value, key]) => ({
    value,
    label: t(key),
  }));
}

export function ChannelLogo({ type, size = 38 }: { type: string; size?: number }) {
  const base: React.CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.55,
  };

  if (type === 'dingtalk') {
    return <div style={{ ...base, background: '#1677ff', color: '#fff' }}><DingtalkOutlined /></div>;
  }
  if (type === 'wechat_work') {
    return <div style={{ ...base, background: '#07c160', color: '#fff' }}><WechatWorkFilled /></div>;
  }
  if (type === 'feishu') {
    return (
      <div style={{ ...base, background: '#3370ff' }}>
        <Lark fill="#fff" />
      </div>
    );
  }
  if (type === 'slack') {
    return <div style={{ ...base, background: '#4a154b', color: '#fff' }}><SlackOutlined /></div>;
  }
  if (type === 'email') {
    return <div style={{ ...base, background: '#0ea5e9', color: '#fff' }}><MailOutlined /></div>;
  }
  if (type === 'sms') {
    return <div style={{ ...base, background: '#a855f7', color: '#fff' }}><MobileOutlined /></div>;
  }
  return (
    <div
      style={{
        ...base,
        background: 'var(--color-bg-layout)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-secondary)',
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      {type.slice(0, 1).toUpperCase()}
    </div>
  );
}
