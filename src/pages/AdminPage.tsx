import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Plus } from 'lucide-react';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../auth/AuthProvider';
import { fetchOrders, type OrderRow } from '../lib/orders';
import { OrderDetailModal } from '../components/OrderDetailModal';

export function AdminPage() {
  const { t } = useI18n();
  const { configured } = useAuth();
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-[#8C6D3F] flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-[#B29259]" aria-hidden="true" />
            {t('adminPage.title')}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{t('adminPage.subtitle')}</p>
        </div>
        <Link to="/order" className="bg-[#B29259] hover:bg-[#8C6D3F] text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5">
          <Plus className="w-4 h-4" aria-hidden="true" />
          {t('adminPage.newForClient')}
        </Link>
      </div>

      {orders === null ? (
        <p className="text-sm text-gray-400">{t('adminPage.loading')}</p>
      ) : blocked ? (
        <div className="bg-white border border-[#EAE3D2] rounded-2xl p-6 text-center text-sm text-gray-500">{t('adminPage.blocked')}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-[#EAE3D2] rounded-2xl p-6 text-center text-sm text-gray-500">{t('adminPage.empty')}</div>
      ) : (
        <div className="bg-white border border-[#EAE3D2] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-[#FAF7F2] text-[#8C6D3F] font-bold">
                <tr>
                  <th className="p-3 text-start">{t('adminPage.colDate')}</th>
                  <th className="p-3 text-start">{t('adminPage.colClient')}</th>
                  <th className="p-3 text-start">{t('adminPage.colEvent')}</th>
                  <th className="p-3 text-start">{t('adminPage.colPackage')}</th>
                  <th className="p-3 text-start">{t('adminPage.colTotal')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedId(o.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(o.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${t('adminPage.viewOrder')}: ${o.groom_name} & ${o.bride_name}`}
                    className="cursor-pointer hover:bg-[#FAF7F2] focus:bg-[#FAF7F2] focus:outline-none transition-colors"
                  >
                    <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-bold text-gray-800">{o.groom_name} &amp; {o.bride_name}</td>
                    <td className="p-3 text-gray-600 whitespace-nowrap">{o.event_date ?? '—'}</td>
                    <td className="p-3 text-gray-600">{o.package_title}</td>
                    <td className="p-3 font-black text-[#8C6D3F] whitespace-nowrap">₪{Number(o.total_price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <OrderDetailModal orderId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
