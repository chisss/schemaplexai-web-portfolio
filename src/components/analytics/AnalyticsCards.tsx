import type { CSSProperties, ReactNode } from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import type { StatisticProps } from 'antd';
import './AnalyticsCards.css';

const { Paragraph, Text, Title } = Typography;

export type AnalyticsTone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'cyan';

interface MetricCardProps {
  title: ReactNode;
  value: StatisticProps['value'];
  precision?: number;
  prefix?: ReactNode;
  suffix?: ReactNode;
  footer?: ReactNode;
  tone?: AnalyticsTone;
  children?: ReactNode;
}

export function MetricCard({
  title,
  value,
  precision,
  prefix,
  suffix,
  footer,
  tone = 'default',
  children,
}: MetricCardProps) {
  return (
    <Card variant="borderless" className={`analytics-metric-card analytics-metric-card--${tone}`}>
      <div className="analytics-metric-card__content">
        <Statistic title={title} value={value} precision={precision} prefix={prefix} suffix={suffix} />
        {children || (footer ? <div className="analytics-metric-card__footer">{footer}</div> : null)}
      </div>
    </Card>
  );
}

interface ReportSectionCardProps {
  title: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  size?: 'default' | 'small';
  style?: CSSProperties;
}

export function ReportSectionCard({ title, description, extra, children, size, style }: ReportSectionCardProps) {
  return (
    <Card
      variant="borderless"
      className="analytics-section-card"
      size={size}
      extra={extra}
      title={(
        <div className="analytics-section-card__title">
          <span className="analytics-section-card__heading">{title}</span>
          {description ? <span className="analytics-section-card__description">{description}</span> : null}
        </div>
      )}
      style={style}
    >
      {children}
    </Card>
  );
}

interface HeroStatItem {
  label: ReactNode;
  value: ReactNode;
  footer?: ReactNode;
}

interface AnalyticsHeroCardProps {
  kicker: ReactNode;
  title: ReactNode;
  description: ReactNode;
  stats: HeroStatItem[];
}

export function AnalyticsHeroCard({ kicker, title, description, stats }: AnalyticsHeroCardProps) {
  return (
    <Card variant="borderless" className="analytics-hero-card">
      <Row gutter={[20, 20]} align="middle">
        <Col xs={24} xl={14}>
          <div className="analytics-hero-card__copy">
            <Text className="analytics-hero-card__kicker">{kicker}</Text>
            <Title level={3} className="analytics-hero-card__title">{title}</Title>
            <Paragraph className="analytics-hero-card__description">{description}</Paragraph>
          </div>
        </Col>
        <Col xs={24} xl={10}>
          <Row gutter={[12, 12]}>
            {stats.map((item) => (
              <Col xs={24} md={8} key={String(item.label)}>
                <div className="analytics-stat-tile">
                  <div className="analytics-stat-tile__label">{item.label}</div>
                  <div className="analytics-stat-tile__value">{item.value}</div>
                  {item.footer ? <div className="analytics-stat-tile__footer">{item.footer}</div> : null}
                </div>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </Card>
  );
}
