import { useEffect, useState } from 'react';
import { ClipboardList, EyeOff, ImagePlus, LayoutDashboard, Package as PackageIcon, Pencil, ShoppingBag } from 'lucide-react';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { PackageManager } from '../components/PackageManager';
import { ProductManager } from '../components/ProductManager';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/i18n';
import { fetchOrders, type OrderRow } from '../lib/orders';

type AdminTab = 'catalog' | 'orders';

export function AdminPage() {
  const { t } = useI18n();
  const { configured, user } = useAuth();
  const [tab, setTab] = useState<AdminTab>('catalog');
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

  const capabilityCards = [
    { key: 'Media', icon: ImagePlus },
    { key: 'Content', icon: Pencil },
    { key: 'Catalog', icon: EyeOff }
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl px-3 py-8 sm:px-4 sm:py-10">
      <div className="rounded-[2rem] border border-[#E8C5B8]/70 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F4E3E3]/45 p-5 shadow-[0_24px_70px_rgba(140,109,63,0.10)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-black text-[#8C6D3F] sm:text-3xl">
              <LayoutDashboard className="h-6 w-6 text-[#B29259]" aria-hidden="true" />
              {t('adminPage.manageTitle')}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
              {t('adminPage.manageSub')}
            </p>
          </div>
          {user?.email && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700" dir="ltr">
              {user.email}
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {capabilityCards.map(({ key, icon: Icon }) => (
            <div key={key} className="rounded-2xl border border-[#EAE3D2] bg-white/85 p-4 shadow-sm">
              <Icon className="h-5 w-5 text-[#B8860B]" aria-hidden="true" />
              <h3 className="mt-2 text-sm font-black text-[#4D4037]">{t(`adminPage.capability${key}Title`)}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{t(`adminPage.capability${key}Body`)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="my-6 flex flex-wrap gap-1 rounded-2xl border border-[#EAE3D2] bg-white p-1.5 shadow-sm" role="tablist" aria-label={t('adminPage.adminArea')}>
        {tabBtn('catalog', t('adminPage.tabCatalogFull'), PackageIcon)}
        {tabBtn('orders', t('adminPage.tabOrders'), ClipboardList)}
      </div>

      {tab === 'catalog' && (
        <div className="space-y-6">
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
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedId(order.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${t('adminPage.viewOrder')}: ${order.groom_name} & ${order.bride_name}`}
                    className="cursor-pointer align-top transition-colors hover:bg-[#FAF7F2] focus:bg-[#FAF7F2] focus:outline-none"
                  >
                    <td className="break-words px-1 py-2.5 leading-tight text-gray-500 sm:p-3 sm:leading-normal">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="break-words px-1 py-2.5 font-bold leading-tight text-gray-800 sm:p-3 sm:leading-normal">{order.groom_name} &amp; {order.bride_name}</td>
                    <td className="break-words px-1 py-2.5 leading-tight text-gray-600 sm:p-3 sm:leading-normal">{order.event_date ?? '—'}</td>
                    <td className="break-words px-1 py-2.5 leading-tight text-gray-600 sm:p-3 sm:leading-normal">{order.package_title}</td>
                    <td className="whitespace-nowrap px-0.5 py-2.5 text-center font-black text-[#8C6D3F] sm:p-3 sm:text-start">₪{Number(order.total_price).toLocaleString()}</td>
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
