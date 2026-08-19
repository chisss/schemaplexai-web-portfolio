import { message } from 'antd';
import { useAuthStore } from '@/store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function parseFileName(contentDisposition?: string | null) {
  if (!contentDisposition) {
    return null;
  }
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }
  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? null;
}

export async function downloadWithAuth(path: string, fallbackFileName = 'download.bin') {
  const { accessToken, tenantId } = useAuthStore.getState();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
    },
  });

  if (!response.ok) {
    message.error('下载失败');
    throw new Error(`download failed: ${response.status}`);
  }

  const blob = await response.blob();
  const fileName = parseFileName(response.headers.get('content-disposition')) || fallbackFileName;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
