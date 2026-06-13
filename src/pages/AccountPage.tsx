import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, MapPin } from 'lucide-react';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../auth/AuthProvider';
import { fetchOrders, type OrderRow } from '../lib/orders';
import { OrderDetailModal } from '../components/OrderDetailModal';

export function AccountPage() {
  const { t } = useI18n();
  const { user, configured } = useAuth();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!configured || !user) {
      setBlocked(!configured);
      setOrders([]);
      return;
    }
    fetchOrders({ userId: user.id })
      .then(setOrders)
      .catch(() => {
        setBlocked(true);
        setOrders([]);
      });
  }, [user, configured]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-[#8C6D3F]">{t('account.title')}</h2>
        <Link to="/order" className="bg-[#B29259] hover:bg-[#8C6D3F] text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5">
          <Plus className="w-4 h-4" aria-hidden="true" />
          {t('account.newOrder')}
        </Link>
      </div>

      {orders === null ? (
        <p className="text-sm text-gray-400">{t('account.loading')}</p>
      ) : blocked ? (
        <div className="bg-white border border-[#EAE3D2] rounded-2xl p-6 text-center text-sm text-gray-500">{t('account.blocked')}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-[#EAE3D2] rounded-2xl p-6 text-center text-sm text-gray-500">{t('account.empty')}</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelectedId(o.id)}
              className="w-full text-start bg-white border border-[#EAE3D2] hover:border-[#B29259] hover:shadow-sm rounded-2xl p-4 flex items-center justify-between gap-3 transition-all"
            >
              <div className="min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">{o.package_title}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" aria-hidden="true" />{o.event_date ?? '—'}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden="true" />{o.event_location ?? '—'}</span>
                </div>
              </div>
              <span className="font-black text-[#8C6D3F] whitespace-nowrap">₪{Number(o.total_price).toLocaleString()}</span>
            </button>
          ))}
        </div>
      )}

      <OrderDetailModal orderId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
