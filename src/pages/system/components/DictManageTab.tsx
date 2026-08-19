import { useState } from 'react';
import {
  Button, Table, Tag, Popconfirm, message, Form, Input,
  Modal, Select, InputNumber, Space, Typography, Drawer, Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  useDicts, useCreateDict, useUpdateDict, useDeleteDict,
  useDictItemsByCode, useCreateDictItem, useUpdateDictItem, useDeleteDictItem,
  useI18nLocales, useCreateI18nLocale, useUpdateI18nLocale, useDeleteI18nLocale,
  useI18nMessages, useCreateI18nMessage, useUpdateI18nMessage, useDeleteI18nMessage,
} from '@/api/system';
import type { SysDict, DictItem, I18nLocale, I18nMessage } from '@/types/system';
import { useAuthStore } from '@/store/useAuthStore';

const { Text } = Typography;

const STATUS_COLORS: Record<string, string> = { active: 'green', inactive: 'default' };
const STATUS_LABEL_KEYS: Record<string, string> = { active: 'dict.statusActive', inactive: 'dict.statusInactive' };

const TYPE_OPTIONS = [
  { value: '', labelKey: 'dict.typeAll' },
  { value: 'biz', labelKey: 'dict.typeBiz' },
  { value: 'i18n', labelKey: 'dict.typeI18n' },
];

// ── 字典表单 Modal ─────────────────────────────────────────────────────────────

interface DictFormModalProps {
  open: boolean;
  editing?: SysDict;
  onCancel: () => void;
  onSuccess: () => void;
}

function DictFormModal({ open, editing, onCancel, onSuccess }: DictFormModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isEdit = !!editing;
  const createDict = useCreateDict();
  const updateDict = useUpdateDict();

  const handleOk = async () => {
    const values = await form.validateFields();
    if (isEdit) {
      await updateDict.mutateAsync({ id: editing!.id, data: values });
    } else {
      await createDict.mutateAsync(values);
    }
    message.success(isEdit ? t('common.updateSuccess') : t('common.createSuccess'));
    form.resetFields();
    onSuccess();
  };

  return (
    <Modal
      title={isEdit ? t('dict.editDict') : t('dict.createDict')}
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      confirmLoading={createDict.isPending || updateDict.isPending}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={editing ?? { dictType: 'biz' }}>
        <Form.Item name="dictName" label={t('dict.dictName')} rules={[{ required: true, message: t('dict.dictNameRequired') }]}>
          <Input placeholder={t('dict.dictNamePlaceholder')} />
        </Form.Item>
        <Form.Item name="dictCode" label={t('dict.dictCode')} rules={[{ required: true, message: t('dict.dictCodeRequired') }]}>
          <Input placeholder={t('dict.dictCodePlaceholder')} disabled={isEdit} />
        </Form.Item>
        <Form.Item name="remark" label={t('dict.remark')}>
          <Input.TextArea rows={2} placeholder={t('dict.optionalDescription')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── 字典项表单 Modal ───────────────────────────────────────────────────────────

interface DictItemFormModalProps {
  open: boolean;
  dictCode: string;
  editing?: DictItem;
  onCancel: () => void;
  onSuccess: () => void;
}

function DictItemFormModal({ open, dictCode, editing, onCancel, onSuccess }: DictItemFormModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isEdit = !!editing;
  const createItem = useCreateDictItem();
  const updateItem = useUpdateDictItem();

  const handleOk = async () => {
    const values = await form.validateFields();
    if (values.extra) {
      try {
        values.extra = JSON.parse(values.extra);
      } catch {
        message.error(t('dict.extraJsonInvalid'));
        return;
      }
    }
    if (isEdit) {
      await updateItem.mutateAsync({ id: editing!.id, dictCode, data: values });
    } else {
      await createItem.mutateAsync({ dictCode, data: values });
    }
    message.success(isEdit ? t('common.updateSuccess') : t('common.createSuccess'));
    form.resetFields();
    onSuccess();
  };

  const initialValues = editing
    ? { ...editing, extra: editing.extra ? JSON.stringify(editing.extra, null, 2) : undefined }
    : { sortOrder: 0 };

  return (
    <Modal
      title={isEdit ? t('dict.editItem') : t('dict.createItem')}
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      confirmLoading={createItem.isPending || updateItem.isPending}
      destroyOnClose
      width={560}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item name="itemLabel" label={t('dict.itemLabel')} rules={[{ required: true, message: t('dict.itemLabelRequired') }]}>
          <Input placeholder={t('dict.itemLabelPlaceholder')} />
        </Form.Item>
        <Form.Item name="itemValue" label={t('dict.itemValue')} rules={[{ required: true, message: t('dict.itemValueRequired') }]}>
          <Input placeholder={t('dict.itemValuePlaceholder')} disabled={isEdit} />
        </Form.Item>
        <Form.Item name="sortOrder" label={t('common.sortOrder')}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="description" label={t('common.description')}>
          <Input placeholder={t('dict.optionalDescription')} />
        </Form.Item>
        <Form.Item
          name="extra"
          label={t('dict.extraJson')}
          rules={[{
            validator: (_, value) => {
              if (!value) return Promise.resolve();
              try { JSON.parse(value); return Promise.resolve(); }
              catch { return Promise.reject(t('dict.extraJsonInvalid')); }
            }
          }]}
        >
          <Input.TextArea rows={3} placeholder={'{\n  "apiUrl": "https://api.openai.com/v1"\n}'} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── 字典项 Drawer ──────────────────────────────────────────────────────────────

interface DictItemsDrawerProps {
  dict?: SysDict;
  onClose: () => void;
}

function DictItemsDrawer({ dict, onClose }: DictItemsDrawerProps) {
  const { t } = useTranslation();
  const { data: dictItems = [], isLoading: itemsLoading } = useDictItemsByCode(dict?.dictCode ?? '');
  const deleteDictItem = useDeleteDictItem();
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DictItem | undefined>(undefined);

  const itemColumns: ColumnsType<DictItem> = [
    { title: t('dict.itemLabel'), dataIndex: 'itemLabel' },
    { title: t('dict.itemValue'), dataIndex: 'itemValue', render: (v) => <Text code>{v}</Text> },
    { title: t('common.sortOrder'), dataIndex: 'sortOrder', width: 60 },
    {
      title: t('common.status'),
      dataIndex: 'status',
      width: 80,
      render: (s) => <Tag color={STATUS_COLORS[s] ?? 'default'}>{t(STATUS_LABEL_KEYS[s] ?? s)}</Tag>,
    },
    { title: t('common.description'), dataIndex: 'description', ellipsis: true },
    {
      title: t('common.actions'),
      width: 90,
      render: (_, row) => (
        <Space>
          <Button
            size="small" type="text" icon={<EditOutlined />}
            onClick={() => { setEditingItem(row); setItemModalOpen(true); }}
          />
          <Popconfirm
            title={t('dict.confirmDeleteItem')}
            onConfirm={async () => {
              await deleteDictItem.mutateAsync({ id: row.id, dictCode: dict!.dictCode });
              message.success(t('common.deleteSuccess'));
            }}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <span>{t('dict.itemsTitle')} —</span>
            <Text strong>
              {t(`dict.data.${dict?.dictCode}.name`, { defaultValue: dict?.dictName })}
            </Text>
            <Text code className="text-xs">{dict?.dictCode}</Text>
          </div>
        }
        open={!!dict}
        onClose={onClose}
        width={720}
        extra={
          <Button
            type="primary" icon={<PlusOutlined />}
            onClick={() => { setEditingItem(undefined); setItemModalOpen(true); }}
          >
            {t('dict.createItem')}
          </Button>
        }
      >
        <Table
          rowKey="id"
          size="small"
          loading={itemsLoading}
          dataSource={dictItems}
          columns={itemColumns}
          pagination={false}
        />
      </Drawer>

      {dict && (
        <DictItemFormModal
          open={itemModalOpen}
          dictCode={dict.dictCode}
          editing={editingItem}
          onCancel={() => setItemModalOpen(false)}
          onSuccess={() => setItemModalOpen(false)}
        />
      )}
    </>
  );
}

// ── 语言表单 Modal（i18n） ─────────────────────────────────────────────────────

interface LocaleFormModalProps {
  open: boolean;
  editing?: I18nLocale;
  onCancel: () => void;
  onSuccess: () => void;
}

function LocaleFormModal({ open, editing, onCancel, onSuccess }: LocaleFormModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isEdit = !!editing;
  const createLocale = useCreateI18nLocale();
  const updateLocale = useUpdateI18nLocale();

  const handleOk = async () => {
    const values = await form.validateFields();
    if (isEdit) {
      await updateLocale.mutateAsync({ id: editing!.id, data: values });
    } else {
      await createLocale.mutateAsync(values);
    }
    message.success(isEdit ? t('common.updateSuccess') : t('common.createSuccess'));
    form.resetFields();
    onSuccess();
  };

  return (
    <Modal
      title={isEdit ? t('dict.editLocale') : t('dict.createLocale')}
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      confirmLoading={createLocale.isPending || updateLocale.isPending}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={editing ?? { enabled: true, sortOrder: 0 }}
      >
        <Form.Item name="code" label={t('dict.localeCode')} rules={[{ required: true, message: t('dict.localeCodeRequired') }]}>
          <Input placeholder={t('dict.localeCodePlaceholder')} disabled={isEdit} />
        </Form.Item>
        <Form.Item name="name" label={t('dict.localeName')} rules={[{ required: true, message: t('dict.localeNameRequired') }]}>
          <Input placeholder={t('dict.localeNamePlaceholder')} />
        </Form.Item>
        <Form.Item name="flag" label={t('dict.localeFlag')}>
          <Input placeholder={t('dict.localeFlagPlaceholder')} />
        </Form.Item>
        <Form.Item name="sortOrder" label={t('common.sortOrder')}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="enabled" label={t('dict.enabled')} valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── 翻译文案表单 Modal（i18n） ─────────────────────────────────────────────────

interface MessageFormModalProps {
  open: boolean;
  locale: string;
  editing?: I18nMessage;
  onCancel: () => void;
  onSuccess: () => void;
}

function MessageFormModal({ open, locale, editing, onCancel, onSuccess }: MessageFormModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isEdit = !!editing;
  const createMsg = useCreateI18nMessage();
  const updateMsg = useUpdateI18nMessage();

  const handleOk = async () => {
    const values = await form.validateFields();
    if (isEdit) {
      await updateMsg.mutateAsync({ id: editing!.id, locale, data: values });
    } else {
      await createMsg.mutateAsync({ locale, ...values });
    }
    message.success(isEdit ? t('common.updateSuccess') : t('common.createSuccess'));
    form.resetFields();
    onSuccess();
  };

  return (
    <Modal
      title={isEdit ? t('dict.editMessage') : t('dict.createMessage')}
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      confirmLoading={createMsg.isPending || updateMsg.isPending}
      destroyOnClose
      width={560}
    >
      <Form form={form} layout="vertical" initialValues={editing}>
        <Form.Item name="msgKey" label={t('dict.msgKey')} rules={[{ required: true, message: t('dict.msgKeyRequired') }]}>
          <Input placeholder={t('dict.msgKeyPlaceholder')} disabled={isEdit} />
        </Form.Item>
        <Form.Item name="msgValue" label={t('dict.msgValue')} rules={[{ required: true, message: t('dict.msgValueRequired') }]}>
          <Input.TextArea rows={2} placeholder={t('dict.msgValuePlaceholder')} />
        </Form.Item>
        <Form.Item name="description" label={t('dict.note')}>
          <Input placeholder={t('dict.notePlaceholder')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── i18n 翻译文案 Drawer ──────────────────────────────────────────────────────

interface MessagesDrawerProps {
  locale?: I18nLocale;
  onClose: () => void;
}

function MessagesDrawer({ locale, onClose }: MessagesDrawerProps) {
  const { t } = useTranslation();
  const [msgKeySearch, setMsgKeySearch] = useState('');
  const [page, setPage] = useState(1);
  const [msgModalOpen, setMsgModalOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState<I18nMessage | undefined>(undefined);
  const deleteMsg = useDeleteI18nMessage();

  const { data: pageResult, isLoading } = useI18nMessages(
    locale?.code ?? '', msgKeySearch, page, 20
  );

  const msgColumns: ColumnsType<I18nMessage> = [
    { title: t('dict.msgKey'), dataIndex: 'msgKey', render: (v) => <Text code>{v}</Text>, ellipsis: true },
    { title: t('dict.msgValue'), dataIndex: 'msgValue', ellipsis: true },
    { title: t('dict.note'), dataIndex: 'description', ellipsis: true },
    {
      title: t('common.actions'),
      width: 90,
      render: (_, row) => (
        <Space>
          <Button
            size="small" type="text" icon={<EditOutlined />}
            onClick={() => { setEditingMsg(row); setMsgModalOpen(true); }}
          />
          <Popconfirm
            title={t('dict.confirmDeleteMessage')}
            onConfirm={async () => {
              await deleteMsg.mutateAsync({ id: row.id, locale: locale!.code });
              message.success(t('common.deleteSuccess'));
            }}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <span>{locale?.flag}</span>
            <Text strong>{locale?.name}</Text>
            <Text code className="text-xs">{locale?.code}</Text>
          </div>
        }
        open={!!locale}
        onClose={onClose}
        width={800}
        extra={
          <Button
            type="primary" icon={<PlusOutlined />}
            onClick={() => { setEditingMsg(undefined); setMsgModalOpen(true); }}
          >
            {t('dict.createMessage')}
          </Button>
        }
      >
        <div className="mb-3">
          <Input.Search
            placeholder={t('dict.searchKey')}
            value={msgKeySearch}
            onChange={(e) => { setMsgKeySearch(e.target.value); setPage(1); }}
            allowClear
            style={{ width: 280 }}
          />
        </div>
        <Table
          rowKey="id"
          size="small"
          loading={isLoading}
          dataSource={pageResult?.records ?? []}
          columns={msgColumns}
          pagination={{
            current: page,
            pageSize: 20,
            total: pageResult?.total ?? 0,
            onChange: setPage,
            showTotal: (total) => t('common.total', { total }),
          }}
        />
      </Drawer>

      {locale && (
        <MessageFormModal
          open={msgModalOpen}
          locale={locale.code}
          editing={editingMsg}
          onCancel={() => setMsgModalOpen(false)}
          onSuccess={() => setMsgModalOpen(false)}
        />
      )}
    </>
  );
}

// ── i18n 语言列表 Tab ─────────────────────────────────────────────────────────

function I18nManagePanel() {
  const { t } = useTranslation();
  const { data: locales = [], isLoading } = useI18nLocales();
  const deleteLocale = useDeleteI18nLocale();
  const [localeModalOpen, setLocaleModalOpen] = useState(false);
  const [editingLocale, setEditingLocale] = useState<I18nLocale | undefined>(undefined);
  const [drawerLocale, setDrawerLocale] = useState<I18nLocale | undefined>(undefined);

  const columns: ColumnsType<I18nLocale> = [
    {
      title: t('dict.locale'),
      render: (_, row) => (
        <Button type="link" onClick={() => setDrawerLocale(row)} style={{ padding: 0, height: 'auto' }}>
          <Space>
            <span>{row.flag}</span>
            <span>{row.name}</span>
          </Space>
        </Button>
      ),
    },
    {
      title: t('dict.code'),
      dataIndex: 'code',
      render: (v) => <Text code>{v}</Text>,
    },
    { title: t('common.sortOrder'), dataIndex: 'sortOrder', width: 60 },
    {
      title: t('common.status'),
      dataIndex: 'enabled',
      width: 80,
      render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? t('dict.enabled') : t('dict.disabled')}</Tag>,
    },
    {
      title: t('common.actions'),
      width: 100,
      render: (_, row) => (
        <Space>
          <Button
            size="small" type="text" icon={<EditOutlined />}
            onClick={(e) => { e.stopPropagation(); setEditingLocale(row); setLocaleModalOpen(true); }}
          />
          <Popconfirm
            title={t('dict.confirmDeleteLocale')}
            onConfirm={async () => {
              await deleteLocale.mutateAsync(row.id);
              if (drawerLocale?.id === row.id) setDrawerLocale(undefined);
              message.success(t('common.deleteSuccess'));
            }}
          >
            <Button
              size="small" type="text" danger icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          type="primary" icon={<PlusOutlined />}
          onClick={() => { setEditingLocale(undefined); setLocaleModalOpen(true); }}
        >
          {t('dict.createLocale')}
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={locales}
        columns={columns}
        pagination={false}
      />

      <LocaleFormModal
        open={localeModalOpen}
        editing={editingLocale}
        onCancel={() => setLocaleModalOpen(false)}
        onSuccess={() => setLocaleModalOpen(false)}
      />

      <MessagesDrawer
        locale={drawerLocale}
        onClose={() => setDrawerLocale(undefined)}
      />
    </>
  );
}

// ── 主组件 ──────────────────────────────────────────────────────────────────

export default function DictManageTab() {
  const { t } = useTranslation();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('system:dict:create');
  const canUpdate = hasPermission('system:dict:update');
  const canDelete = hasPermission('system:dict:delete');
  const { data: dicts = [], isLoading: dictsLoading } = useDicts(
    typeFilter === 'i18n' ? undefined : typeFilter || undefined
  );
  const deleteDict = useDeleteDict();

  const [dictModalOpen, setDictModalOpen] = useState(false);
  const [editingDict, setEditingDict] = useState<SysDict | undefined>(undefined);
  const [drawerDict, setDrawerDict] = useState<SysDict | undefined>(undefined);

  const dictColumns: ColumnsType<SysDict> = [
    {
      title: t('dict.dictName'),
      dataIndex: 'dictName',
      render: (_name, row) => (
        <Button type="link" onClick={() => setDrawerDict(row)} style={{ padding: 0, height: 'auto' }}>
          {t(`dict.data.${row.dictCode}.name`, { defaultValue: row.dictName })}
        </Button>
      ),
    },
    {
      title: t('dict.dictCode'),
      dataIndex: 'dictCode',
      render: (code) => <Text code>{code}</Text>,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      width: 80,
      render: (s) => <Tag color={STATUS_COLORS[s] ?? 'default'}>{t(STATUS_LABEL_KEYS[s] ?? s)}</Tag>,
    },
    {
      title: t('dict.remark'), dataIndex: 'remark', ellipsis: true,
      render: (_remark, row) => t(`dict.data.${row.dictCode}.remark`, { defaultValue: row.remark }),
    },
    {
      title: t('common.actions'),
      width: 100,
      render: (_, row) => (
        <Space>
          {canUpdate && (
            <Button
              size="small" type="text" icon={<EditOutlined />}
              onClick={(e) => { e.stopPropagation(); setEditingDict(row); setDictModalOpen(true); }}
            />
          )}
          {canDelete && (
            <Popconfirm
              title={t('dict.confirmDeleteDict')}
              onConfirm={async () => {
                await deleteDict.mutateAsync(row.id);
                if (drawerDict?.id === row.id) setDrawerDict(undefined);
                message.success(t('common.deleteSuccess'));
              }}
            >
              <Button
                size="small" type="text" danger icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Select
          value={typeFilter}
          onChange={(v) => { setTypeFilter(v); setDrawerDict(undefined); }}
          options={TYPE_OPTIONS.map((item) => ({ value: item.value, label: t(item.labelKey) }))}
          style={{ width: 160 }}
        />
        {typeFilter !== 'i18n' && canCreate && (
          <Button
            type="primary" icon={<PlusOutlined />}
            onClick={() => { setEditingDict(undefined); setDictModalOpen(true); }}
          >
            {t('dict.createDict')}
          </Button>
        )}
      </div>

      {typeFilter === 'i18n' ? (
        <I18nManagePanel />
      ) : (
        <>
          <Table
            rowKey="id"
            loading={dictsLoading}
            dataSource={dicts}
            columns={dictColumns}
            pagination={{ pageSize: 20, showTotal: (total) => t('common.total', { total }) }}
          />

          <DictFormModal
            open={dictModalOpen}
            editing={editingDict}
            onCancel={() => setDictModalOpen(false)}
            onSuccess={() => setDictModalOpen(false)}
          />

          <DictItemsDrawer
            dict={drawerDict}
            onClose={() => setDrawerDict(undefined)}
          />
        </>
      )}
    </>
  );
}
