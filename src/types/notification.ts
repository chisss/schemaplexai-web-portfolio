/**
 * 站内信类型定义
 */

export interface InAppMessage {
  recipientId: string;
  messageId: string;
  title: string;
  content: string;
  messageType: string;
  businessType?: string;
  sourceType?: string;
  sourceId?: string;
  actionUrl?: string;
  status: 'unread' | 'read' | 'archived' | string;
  readAt?: string;
  archivedAt?: string;
  payload?: Record<string, any>;
  createdAt: string;
}
