import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ClipboardList, LayoutDashboard, Package as PackageIcon, Plus } from 'lucide-react';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { PackageManager } from '../components/PackageManager';
import { ProductManager } from '../components/ProductManager';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/i18n';
import { fetchOrders, type OrderRow } from '../lib/orders';

type AdminTab = 'orders' | 'catalog';

export function AdminPage() {
  const { t } = useI18n();
  const { configured } = useAuth();
  const [tab, setTab] = useState<AdminTab>('orders');
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const tabBtn = (key: AdminTab, label: string, Icon: typeof ClipboardList) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      aria-pressed={tab === key}
      className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
        tab === key ? 'bg-[#B29259] text-white shadow-sm' : 'text-gray-600 hover:bg-[#FAF7F2] hover:text-[#B29259]'
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#8C6D3F]">
            <LayoutDashboard className="h-5 w-5 text-[#B29259]" aria-hidden="true" />
            {t('adminPage.adminArea')}
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">{t('adminPage.adminAreaSub')}</p>
        </div>
        {tab === 'orders' && (
          <Link to="/order" className="flex items-center gap-1.5 rounded-xl bg-[#B29259] px-4 py-2 text-xs font-bold text-white hover:bg-[#8C6D3F]">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('adminPage.newForClient')}
          </Link>
        )}
      </div>

      <div className="mb-6 inline-flex gap-1 rounded-2xl border border-[#EAE3D2] bg-white p-1.5 shadow-sm" role="tablist" aria-label={t('adminPage.adminArea')}>
        {tabBtn('orders', t('adminPage.tabOrders'), ClipboardList)}
        {tabBtn('catalog', t('adminPage.tabCatalog'), PackageIcon)}
      </div>

      {tab === 'catalog' && (
        <>
          <ProductManager />
          <PackageManager />
        </>
      )}

      {tab === 'orders' && (orders === null ? (
        <p className="text-sm text-gray-400">{t('adminPage.loading')}</p>
      ) : blocked ? (
        <div className="rounded-2xl border border-[#EAE3D2] bg-white p-6 text-center text-sm text-gray-500">{t('adminPage.blocked')}</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-[#EAE3D2] bg-white p-6 text-center text-sm text-gray-500">{t('adminPage.empty')}</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#EAE3D2] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-[#FAF7F2] font-bold text-[#8C6D3F]">
                <tr>
                  <th className="p-3 text-start">{t('adminPage.colDate')}</th>
                  <th className="p-3 text-start">{t('adminPage.colClient')}</th>
                  <th className="p-3 text-start">{t('adminPage.colEvent')}</th>
                  <th className="p-3 text-start">{t('adminPage.colPackage')}</th>
                  <th className="p-3 text-start">{t('adminPage.colTotal')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedId(order.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${t('adminPage.viewOrder')}: ${order.groom_name} & ${order.bride_name}`}
                    className="cursor-pointer transition-colors hover:bg-[#FAF7F2] focus:bg-[#FAF7F2] focus:outline-none"
                  >
                    <td className="whitespace-nowrap p-3 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-bold text-gray-800">{order.groom_name} &amp; {order.bride_name}</td>
                    <td className="whitespace-nowrap p-3 text-gray-600">{order.event_date ?? '—'}</td>
                    <td className="p-3 text-gray-600">{order.package_title}</td>
                    <td className="whitespace-nowrap p-3 font-black text-[#8C6D3F]">₪{Number(order.total_price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <OrderDetailModal orderId={selectedId} onClose={() => setSelectedId(null)} showInternal />
    </div>
  );
}
