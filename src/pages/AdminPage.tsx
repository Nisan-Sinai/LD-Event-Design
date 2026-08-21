import { useEffect, useState } from 'react';
import { AlertTriangle, ClipboardList, FolderPlus, Package as PackageIcon, ShoppingBag, Trash2 } from 'lucide-react';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { PackageManager } from '../components/PackageManager';
import { ProductManager } from '../components/ProductManager';
import { BrandingManager } from '../components/BrandingManager';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/i18n';
import { deleteOrder, fetchOrders, type OrderRow } from '../lib/orders';

type AdminTab = 'catalog' | 'orders' | 'categories';

const DELETE_COPY = {
  he: {
    action: 'מחיקת הזמנה',
    title: 'למחוק את ההזמנה?',
    warning: 'הפעולה תמחק את ההזמנה לצמיתות ולא ניתן לבטל אותה.',
    cancel: 'ביטול',
    confirm: 'כן, למחוק',
    deleting: 'מוחק…',
    error: 'לא הצלחנו למחוק את ההזמנה. נסו שוב.'
  },
  en: {
    action: 'Delete order',
    title: 'Delete this order?',
    warning: 'This permanently deletes the order and cannot be undone.',
    cancel: 'Cancel',
    confirm: 'Yes, delete',
    deleting: 'Deleting…',
    error: 'We could not delete the order. Please try again.'
  }
} as const;

export function AdminPage() {
  const { t, lang } = useI18n();
  const deleteCopy = DELETE_COPY[lang];
  const navLabels = lang === 'he'
    ? { catalog: 'מוצרים וחבילות', orders: 'הזמנות', categories: 'קטגוריות' }
    : { catalog: 'Products & packages', orders: 'Orders', categories: 'Categories' };
  const { configured, user } = useAuth();
  const [tab, setTab] = useState<AdminTab>('catalog');
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OrderRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!configured) {
      setBlocked(true);
      setOrders([]);
      return;
    }
    fetchOrders()
      .then(setOrders)
      .catch(() => {
        setBlocked(true);
        setOrders([]);
      });
  }, [configured]);

  const openDelete = (order: OrderRow) => {
    setDeleteError('');
    setPendingDelete(order);
  };

  const confirmDelete = async (order: OrderRow) => {
    const orderId = order.id;
    setDeletingId(orderId);
    setDeleteError('');
    try {
      await deleteOrder(orderId);
      setOrders((current) => current!.filter((item) => item.id !== orderId));
      setPendingDelete(null);
    } catch {
      setDeleteError(deleteCopy.error);
    } finally {
      setDeletingId(null);
    }
  };

  const tabBtn = (key: AdminTab, label: string, Icon: typeof ClipboardList) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      aria-pressed={tab === key}
      className={`flex min-h-11 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-2.5 text-[11px] font-extrabold leading-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B29259]/50 focus-visible:ring-offset-2 sm:min-h-12 sm:px-4 sm:text-xs ${
        tab === key
          ? 'border-[#B29259] bg-gradient-to-r from-[#A9854F] via-[#B29259] to-[#C7A769] text-white shadow-[0_8px_22px_rgba(178,146,89,0.24)]'
          : 'border-[#E0D4C3] bg-[#FFFDF9] text-[#5F554D] shadow-sm hover:border-[#B29259]/70 hover:bg-[#FAF7F2] hover:text-[#8C6D3F]'
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
      <span className="min-w-0 text-center">{label}</span>
    </button>
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl px-3 py-8 sm:px-4 sm:py-10">
      <h2 className="sr-only">{t('adminPage.manageTitle')}</h2>
      <span className="sr-only">{t('adminPage.capabilityMediaTitle')}</span>
      <span className="sr-only">{t('adminPage.capabilityContentTitle')}</span>
      <span className="sr-only">{t('adminPage.capabilityCatalogTitle')}</span>
      {user?.email && (
        <div className="flex justify-end px-1">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700" dir="ltr">
            {user.email}
          </span>
        </div>
      )}

      <div className="mx-auto my-6 grid w-full max-w-lg grid-cols-3 gap-2" role="group" aria-label={t('adminPage.adminArea')}>
        {tabBtn('catalog', navLabels.catalog, PackageIcon)}
        {tabBtn('orders', navLabels.orders, ClipboardList)}
        {tabBtn('categories', navLabels.categories, FolderPlus)}
      </div>

      {tab === 'catalog' && (
        <div className="space-y-6">
          <BrandingManager />
          <div id="admin-products" className="scroll-mt-28">
            <div className="mb-3 flex items-center gap-2 px-1">
              <ShoppingBag className="h-5 w-5 text-[#B8860B]" aria-hidden="true" />
              <p className="text-sm font-black text-[#4D4037]">{t('adminPage.productsTitle')}</p>
            </div>
            <ProductManager />
          </div>
          <div id="admin-packages" className="scroll-mt-28">
            <div className="mb-3 flex items-center gap-2 px-1">
              <PackageIcon className="h-5 w-5 text-[#B8860B]" aria-hidden="true" />
              <p className="text-sm font-black text-[#4D4037]">{t('adminPage.packagesTitle')}</p>
            </div>
            <PackageManager />
          </div>
        </div>
      )}

      {tab === 'categories' && <div id="admin-category-management" className="scroll-mt-28" />}

      {tab === 'orders' && (orders === null ? (
        <p className="text-sm text-gray-400">{t('adminPage.loading')}</p>
      ) : blocked ? (
        <div className="rounded-2xl border border-[#EAE3D2] bg-white p-6 text-center text-sm text-gray-500">{t('adminPage.blocked')}</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-[#EAE3D2] bg-white p-6 text-center text-sm text-gray-500">{t('adminPage.empty')}</div>
      ) : (
        <div className="w-full max-w-full overflow-hidden rounded-2xl border border-[#EAE3D2] bg-white">
          <div className="w-full max-w-full overflow-hidden">
            <table className="w-full table-fixed text-start text-[10px] sm:text-xs">
              <colgroup>
                <col className="w-[17%]" />
                <col className="w-[22%]" />
                <col className="w-[18%]" />
                <col className="w-[27%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead className="bg-[#FAF7F2] font-bold text-[#8C6D3F]">
                <tr>
                  <th className="px-1 py-2 text-start leading-tight sm:p-3">{t('adminPage.colDate')}</th>
                  <th className="px-1 py-2 text-start leading-tight sm:p-3">{t('adminPage.colClient')}</th>
                  <th className="px-1 py-2 text-start leading-tight sm:p-3">{t('adminPage.colEvent')}</th>
                  <th className="px-1 py-2 text-start leading-tight sm:p-3">{t('adminPage.colPackage')}</th>
                  <th className="px-1 py-2 text-start leading-tight sm:p-3">{t('adminPage.colTotal')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className="cursor-pointer align-top transition-colors hover:bg-[#FAF7F2]"
                  >
                    <td className="break-words px-1 py-2.5 leading-tight text-gray-500 sm:p-3 sm:leading-normal">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="break-words px-1 py-2.5 font-bold leading-tight text-gray-800 sm:p-3 sm:leading-normal">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedId(order.id);
                        }}
                        aria-label={`${t('adminPage.viewOrder')}: ${order.groom_name} & ${order.bride_name}`}
                        className="w-full break-words text-start font-bold text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B29259]/50"
                      >
                        {order.groom_name} &amp; {order.bride_name}
                      </button>
                    </td>
                    <td className="break-words px-1 py-2.5 leading-tight text-gray-600 sm:p-3 sm:leading-normal">{order.event_date ?? '—'}</td>
                    <td className="break-words px-1 py-2.5 leading-tight text-gray-600 sm:p-3 sm:leading-normal">{order.package_title}</td>
                    <td className="px-0.5 py-2.5 text-center text-[#8C6D3F] sm:p-3 sm:text-start">
                      <div className="flex flex-col items-center gap-1 sm:items-start">
                        <span className="whitespace-nowrap font-black">₪{Number(order.total_price).toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDelete(order);
                          }}
                          aria-label={`${deleteCopy.action}: ${order.groom_name} & ${order.bride_name}`}
                          title={deleteCopy.action}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingId) {
              setDeleteError('');
              setPendingDelete(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-order-title"
            className="w-full max-w-sm rounded-[2rem] border border-red-100 bg-white p-5 text-center shadow-[0_24px_80px_rgba(44,44,44,0.24)] sm:p-6"
          >
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 id="delete-order-title" className="mt-4 text-xl font-black text-[#3F352F]">{deleteCopy.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{deleteCopy.warning}</p>
            <div className="mt-4 rounded-2xl bg-[#FAF7F2] px-4 py-3 text-sm">
              <p className="font-black text-[#4D4037]">{pendingDelete.groom_name} &amp; {pendingDelete.bride_name}</p>
              <p className="mt-1 text-xs text-gray-500">{pendingDelete.event_date ?? '—'} · {pendingDelete.package_title ?? '—'}</p>
            </div>
            {deleteError && <p role="alert" className="mt-3 text-xs font-bold text-red-600">{deleteError}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                autoFocus
                disabled={Boolean(deletingId)}
                onClick={() => {
                  setDeleteError('');
                  setPendingDelete(null);
                }}
                className="rounded-full border border-[#DED5C7] px-4 py-3 text-sm font-extrabold text-[#5F554D] disabled:opacity-50"
              >
                {deleteCopy.cancel}
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => void confirmDelete(pendingDelete)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-red-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {deletingId ? deleteCopy.deleting : deleteCopy.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      <OrderDetailModal orderId={selectedId} onClose={() => setSelectedId(null)} showInternal />
    </div>
  );
}