import { useEffect, useState, type ReactNode } from 'react';
import { X, User, Calendar, MapPin, Phone, Mail, Package, Gift, FileSignature } from 'lucide-react';
import { useI18n } from '../i18n/i18n';
import { fetchOrderById, signatureUrl, type OrderDetail } from '../lib/orders';

function Row({ label, value }: { label: ReactNode; value: ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between gap-3 py-1.5 text-xs border-b border-gray-50 last:border-0">
      <span className="text-gray-400 font-medium shrink-0">{label}</span>
      <span className="font-bold text-gray-700 text-end">{value}</span>
    </div>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EAE3D2]">
      <h3 className="text-sm font-bold text-[#8C6D3F] flex items-center gap-1.5 mb-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

export function OrderDetailModal({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const { t, dir } = useI18n();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [sigs, setSigs] = useState<{ groom: string | null; bride: string | null }>({ groom: null, bride: null });

  useEffect(() => {
    if (!orderId) return;
    setOrder(null);
    setError(false);
    setLoading(true);
    setSigs({ groom: null, bride: null });
    fetchOrderById(orderId)
      .then(async (o) => {
        setOrder(o);
        setLoading(false);
        if (o) {
          const [groom, bride] = await Promise.all([signatureUrl(o.groom_signature_path), signatureUrl(o.bride_signature_path)]);
          setSigs({ groom, bride });
        }
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [orderId, onClose]);

  if (!orderId) return null;

  const statusLabel = (s: string) => {
    const k = `admin.status_${s}`;
    const label = t(k);
    return label === k ? s : label;
  };
  const money = (n: number | null | undefined) => `₪${Number(n ?? 0).toLocaleString()}`;
  const none = t('orderDetail.none');

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
      onClick={onClose}
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-auto shadow-xl" onClick={(e) => e.stopPropagation()} dir={dir}>
        {/* כותרת */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-[#EAE3D2] px-6 py-4 flex items-center justify-between gap-3 z-10">
          <h2 id="order-detail-title" className="font-display text-lg font-bold text-[#8C6D3F]">{t('orderDetail.title')}</h2>
          <button type="button" onClick={onClose} aria-label={t('legal.close')} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading && <p className="text-sm text-gray-400 text-center py-8">{t('adminPage.loading')}</p>}
          {error && <p className="text-sm text-red-500 text-center py-8">{t('adminPage.blocked')}</p>}

          {order && (
            <>
              {/* סטטוס + תאריך */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-[#B29259] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  {t('orderDetail.status')}: {statusLabel(order.status)}
                </span>
                <span className="text-xs text-gray-400">{t('orderDetail.created')}: {new Date(order.created_at).toLocaleString()}</span>
              </div>

              <Section icon={<User className="w-4 h-4" aria-hidden="true" />} title={t('orderDetail.sectionClient')}>
                <Row label={t('orderDetail.groomName')} value={order.groom_name} />
                <Row label={t('orderDetail.brideName')} value={order.bride_name} />
                <Row label={<span className="flex items-center gap-1"><Phone className="w-3 h-3" aria-hidden="true" />{t('orderDetail.groomPhone')}</span>} value={<span dir="ltr">{order.groom_phone}</span>} />
                <Row label={<span className="flex items-center gap-1"><Phone className="w-3 h-3" aria-hidden="true" />{t('orderDetail.bridePhone')}</span>} value={<span dir="ltr">{order.bride_phone}</span>} />
                <Row label={<span className="flex items-center gap-1"><Mail className="w-3 h-3" aria-hidden="true" />{t('orderDetail.email')}</span>} value={<span dir="ltr">{order.email}</span>} />
              </Section>

              <Section icon={<Calendar className="w-4 h-4" aria-hidden="true" />} title={t('orderDetail.sectionEvent')}>
                <Row label={t('orderDetail.eventDate')} value={order.event_date ?? none} />
                <Row label={<span className="flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden="true" />{t('orderDetail.eventLocation')}</span>} value={order.event_location ?? none} />
                <Row label={t('orderDetail.tier')} value={order.table_tier ?? null} />
                <Row label={t('orderDetail.composites')} value={order.composites_count} />
                <Row label={t('orderDetail.sponge')} value={order.sponge_count} />
              </Section>

              <Section icon={<Package className="w-4 h-4" aria-hidden="true" />} title={t('orderDetail.sectionPackage')}>
                <Row label={t('orderDetail.packages')} value={order.package_title} />
                <Row label={t('orderDetail.delivery')} value={order.include_delivery ? t('orderDetail.yes') : t('orderDetail.no')} />
                {order.upgrades?.length > 0 && (
                  <div className="pt-2">
                    <span className="text-gray-400 font-medium text-xs flex items-center gap-1"><Gift className="w-3 h-3" aria-hidden="true" />{t('orderDetail.upgrades')}</span>
                    <ul className="mt-1 space-y-1">
                      {order.upgrades.map((u, i) => (
                        <li key={i} className="flex justify-between text-xs text-gray-700">
                          <span>{u.description}</span>
                          <span className="font-bold">{money(u.price)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Section>

              <Section icon={<Gift className="w-4 h-4" aria-hidden="true" />} title={t('orderDetail.sectionPricing')}>
                <Row label={t('orderDetail.base')} value={money(order.base_price)} />
                <Row label={t('orderDetail.upgradesTotal')} value={order.upgrades_total ? money(order.upgrades_total) : null} />
                <Row label={t('orderDetail.deliveryFee')} value={order.delivery_price ? money(order.delivery_price) : null} />
                <Row label={t('orderDetail.coupon')} value={order.coupon_code} />
                <Row label={t('orderDetail.discount')} value={order.coupon_discount ? `−${money(order.coupon_discount)}` : null} />
                <div className="flex justify-between gap-3 pt-2 mt-1 border-t border-gray-200 text-sm font-black text-[#8C6D3F]">
                  <span>{t('orderDetail.total')}</span>
                  <span>{money(order.total_price)}</span>
                </div>
              </Section>

              <Section icon={<FileSignature className="w-4 h-4" aria-hidden="true" />} title={t('orderDetail.sectionSignatures')}>
                <div className="grid grid-cols-2 gap-3">
                  {([['groom', order.groom_sign_date], ['bride', order.bride_sign_date]] as const).map(([who, date]) => (
                    <div key={who}>
                      <p className="text-[11px] font-bold text-gray-600 mb-1">{t(who === 'groom' ? 'orderDetail.groomSign' : 'orderDetail.brideSign')}</p>
                      {sigs[who] ? (
                        <img src={sigs[who] as string} alt={t(who === 'groom' ? 'orderDetail.groomSign' : 'orderDetail.brideSign')} className="w-full h-20 object-contain bg-white border border-gray-200 rounded-lg" />
                      ) : (
                        <div className="w-full h-20 flex items-center justify-center bg-white border border-dashed border-gray-200 rounded-lg text-[10px] text-gray-400">
                          {t('orderDetail.signatureOnFile')}
                        </div>
                      )}
                      {date && <p className="text-[10px] text-gray-400 mt-1">{t('orderDetail.signedOn')}: {date}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
