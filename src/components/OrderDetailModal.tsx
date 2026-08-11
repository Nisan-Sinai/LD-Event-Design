import { useEffect, useState, type ReactNode } from 'react';
import { X, User, Calendar, MapPin, Phone, Mail, Package, Gift, ClipboardList, Palette, PenTool } from 'lucide-react';
import { useI18n } from '../i18n/i18n';
import { fetchOrderById, signatureUrl, type OrderDetail } from '../lib/orders';

const WEBSITE_QUOTE_SOURCE = 'website-quote-builder';
const WEBSITE_ORDER_SOURCE = 'website-order-selection';

interface QuoteMetadata {
  customColors: string;
  flowerColor: string;
  balloonColor: string;
  tableclothColor: string;
  customRequest: string;
  customerNotes: string;
}

function parseQuoteMetadata(value: string | null | undefined): QuoteMetadata | null {
  if (!value?.trim()) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

    const data = parsed as Record<string, unknown>;
    const stringValue = (key: string) => (typeof data[key] === 'string' ? data[key].trim() : '');
    const hasQuoteFields =
      data.quoteOnly === true ||
      ['customColors', 'flowerColor', 'balloonColor', 'tableclothColor', 'customRequest', 'customerNotes']
        .some((key) => typeof data[key] === 'string');

    if (!hasQuoteFields) return null;

    return {
      customColors: stringValue('customColors'),
      flowerColor: stringValue('flowerColor'),
      balloonColor: stringValue('balloonColor'),
      tableclothColor: stringValue('tableclothColor'),
      customRequest: stringValue('customRequest'),
      customerNotes: stringValue('customerNotes')
    };
  } catch {
    return null;
  }
}

function isReadableReferralDetail(value: string | null | undefined) {
  if (!value?.trim()) return false;
  const trimmed = value.trim();
  return trimmed.length <= 160 && !trimmed.startsWith('{') && !trimmed.startsWith('[');
}

function Row({ label, value }: { label: ReactNode; value: ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 border-b border-gray-50 py-1.5 text-xs last:border-0">
      <span className="min-w-0 break-words font-medium leading-relaxed text-gray-400">{label}</span>
      <span className="min-w-0 break-words text-end font-bold leading-relaxed text-gray-700 [overflow-wrap:anywhere]">{value}</span>
    </div>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-[#EAE3D2] bg-[#FAF7F2] p-3.5 sm:p-4">
      <h3 className="mb-2 flex min-w-0 items-center gap-1.5 break-words text-sm font-bold text-[#8C6D3F]">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function SignaturePreview({
  label,
  url,
  signedOn,
  openLabel,
  unavailableLabel
}: {
  label: string;
  url: string | null;
  signedOn: string | null;
  openLabel: string;
  unavailableLabel: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[#EAE3D2] bg-white p-3">
      <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
        <strong className="min-w-0 break-words text-xs text-[#6D5434]">{label}</strong>
        {signedOn ? <span className="text-[11px] text-gray-400">{signedOn}</span> : null}
      </div>
      {url ? (
        <>
          <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-[#EFE7D8] bg-white p-2">
            <img
              src={url}
              alt={label}
              className="mx-auto max-h-40 w-full object-contain"
              loading="lazy"
            />
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex text-xs font-bold text-[#8C6D3F] underline underline-offset-2"
          >
            {openLabel}
          </a>
        </>
      ) : (
        <p className="text-xs text-gray-400">{unavailableLabel}</p>
      )}
    </div>
  );
}

export function OrderDetailModal({ orderId, onClose, showInternal = false }: { orderId: string | null; onClose: () => void; showInternal?: boolean }) {
  const { t, dir } = useI18n();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [primarySignatureUrl, setPrimarySignatureUrl] = useState<string | null>(null);
  const [secondarySignatureUrl, setSecondarySignatureUrl] = useState<string | null>(null);
  const [signatureLoading, setSignatureLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    setOrder(null);
    setError(false);
    setLoading(true);
    setPrimarySignatureUrl(null);
    setSecondarySignatureUrl(null);

    fetchOrderById(orderId)
      .then((o) => {
        if (cancelled) return;
        setOrder(o);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (!showInternal || !order || order.order_source !== WEBSITE_ORDER_SOURCE) return;
    if (!order.groom_signature_path && !order.bride_signature_path) return;

    let cancelled = false;
    setSignatureLoading(true);
    Promise.all([
      signatureUrl(order.groom_signature_path),
      signatureUrl(order.bride_signature_path)
    ])
      .then(([primary, secondary]) => {
        if (cancelled) return;
        setPrimarySignatureUrl(primary);
        setSecondarySignatureUrl(secondary);
      })
      .finally(() => {
        if (!cancelled) setSignatureLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [order, showInternal]);

  useEffect(() => {
    if (!orderId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [orderId, onClose]);

  if (!orderId) return null;

  const labelOr = (key: string, fallback: string) => {
    const label = t(key);
    return label === key ? fallback : label;
  };
  const statusLabel = (s: string) => labelOr(`admin.status_${s}`, s);
  const money = (n: number | null | undefined) => `₪${Number(n ?? 0).toLocaleString()}`;
  const none = t('orderDetail.none');
  const localCopy = dir === 'rtl'
    ? {
        preferences: 'העדפות עיצוב ובקשות',
        flowerColor: 'גוון לפרחים',
        balloonColor: 'גוון לבלונים',
        tableclothColor: 'גוון למפות וטקסטיל',
        customColors: 'צבעים נוספים',
        customRequest: 'בקשה אישית',
        customerNotes: 'הערות ובקשות נוספות',
        websiteQuote: 'בקשת הצעת מחיר מהאתר',
        signatures: 'חתימות',
        customerSignature: 'חתימת הלקוח',
        additionalSignature: 'חתימה נוספת',
        openSignature: 'פתיחת החתימה בגודל מלא',
        signatureLoading: 'טוען חתימה…',
        signatureUnavailable: 'החתימה שמורה אך לא ניתן לטעון אותה כרגע.'
      }
    : {
        preferences: 'Design preferences & requests',
        flowerColor: 'Flower shade',
        balloonColor: 'Balloon shade',
        tableclothColor: 'Table linen shade',
        customColors: 'Additional colors',
        customRequest: 'Custom request',
        customerNotes: 'Additional notes',
        websiteQuote: 'Website quote request',
        signatures: 'Signatures',
        customerSignature: 'Customer signature',
        additionalSignature: 'Additional signature',
        openSignature: 'Open signature full size',
        signatureLoading: 'Loading signature…',
        signatureUnavailable: 'The signature is stored but cannot be loaded right now.'
      };

  const quoteMetadata = order
    ? parseQuoteMetadata(order.internal_notes) ?? parseQuoteMetadata(order.referral_detail)
    : null;
  const internalNotesAreQuoteMetadata = Boolean(order && parseQuoteMetadata(order.internal_notes));
  const internalNotes = order && !internalNotesAreQuoteMetadata ? order.internal_notes : null;
  const referralDetail = order && isReadableReferralDetail(order.referral_detail) ? order.referral_detail!.trim() : null;
  const referralValue = order?.referral_source && order.referral_source !== WEBSITE_QUOTE_SOURCE
    ? `${labelOr(`step1.referral_${order.referral_source}`, order.referral_source)}${referralDetail ? ` — ${referralDetail}` : ''}`
    : null;
  const orderSourceLabel = order?.order_source
    ? order.order_source === WEBSITE_QUOTE_SOURCE
      ? localCopy.websiteQuote
      : labelOr(`admin.source_${order.order_source}`, order.order_source)
    : null;
  const showWebsiteOrderSignatures = Boolean(
    showInternal &&
    order?.order_source === WEBSITE_ORDER_SOURCE &&
    (order.groom_signature_path || order.bride_signature_path)
  );

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-x-hidden bg-black/50 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full min-w-0 max-w-2xl overflow-x-hidden overflow-y-auto rounded-3xl bg-white shadow-xl sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        <div className="sticky top-0 z-10 flex min-w-0 items-center justify-between gap-3 border-b border-[#EAE3D2] bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
          <h2 id="order-detail-title" className="font-display min-w-0 break-words text-lg font-bold text-[#8C6D3F]">{t('orderDetail.title')}</h2>
          <button type="button" onClick={onClose} aria-label={t('legal.close')} className="shrink-0 text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-w-0 space-y-4 p-3 sm:p-6">
          {loading && <p className="py-8 text-center text-sm text-gray-400">{t('adminPage.loading')}</p>}
          {error && <p className="py-8 text-center text-sm text-red-500">{t('adminPage.blocked')}</p>}

          {order && (
            <>
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#B29259] px-3 py-1.5 text-xs font-bold text-white">
                  {t('orderDetail.status')}: {statusLabel(order.status)}
                </span>
                <span className="min-w-0 break-words text-xs text-gray-400 [overflow-wrap:anywhere]">{t('orderDetail.created')}: {new Date(order.created_at).toLocaleString()}</span>
              </div>

              <Section icon={<User className="h-4 w-4 shrink-0" aria-hidden="true" />} title={t('orderDetail.sectionClient')}>
                <Row label={t('orderDetail.groomName')} value={order.groom_name} />
                <Row label={t('orderDetail.brideName')} value={order.bride_name} />
                <Row label={<span className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" aria-hidden="true" />{t('orderDetail.groomPhone')}</span>} value={<span dir="ltr">{order.groom_phone}</span>} />
                <Row label={<span className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" aria-hidden="true" />{t('orderDetail.bridePhone')}</span>} value={<span dir="ltr">{order.bride_phone}</span>} />
                <Row label={<span className="flex items-center gap-1"><Mail className="h-3 w-3 shrink-0" aria-hidden="true" />{t('orderDetail.email')}</span>} value={<span dir="ltr">{order.email}</span>} />
              </Section>

              <Section icon={<Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />} title={t('orderDetail.sectionEvent')}>
                <Row label={t('orderDetail.eventDate')} value={order.event_date ?? none} />
                <Row label={<span className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />{t('orderDetail.eventLocation')}</span>} value={order.event_location ?? none} />
                <Row label={t('orderDetail.tier')} value={order.table_tier ?? null} />
                <Row label={t('orderDetail.composites')} value={order.composites_count} />
                <Row label={t('orderDetail.sponge')} value={order.sponge_count} />
                <Row label={t('orderDetail.referral')} value={referralValue} />
              </Section>

              <Section icon={<Package className="h-4 w-4 shrink-0" aria-hidden="true" />} title={t('orderDetail.sectionPackage')}>
                <Row label={t('orderDetail.packages')} value={order.package_title} />
                <Row label={t('orderDetail.delivery')} value={order.include_delivery ? t('orderDetail.yes') : t('orderDetail.no')} />
                {order.upgrades?.length > 0 && (
                  <div className="min-w-0 pt-2">
                    <span className="flex min-w-0 items-center gap-1 text-xs font-medium text-gray-400"><Gift className="h-3 w-3 shrink-0" aria-hidden="true" />{t('orderDetail.upgrades')}</span>
                    <ul className="mt-1 min-w-0 space-y-1">
                      {order.upgrades.map((u, i) => (
                        <li key={i} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 text-xs text-gray-700">
                          <span className="min-w-0 break-words [overflow-wrap:anywhere]">{u.description}</span>
                          <span className="whitespace-nowrap font-bold">{money(u.price)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Section>

              {quoteMetadata && (
                <Section icon={<Palette className="h-4 w-4 shrink-0" aria-hidden="true" />} title={localCopy.preferences}>
                  <Row label={localCopy.flowerColor} value={quoteMetadata.flowerColor} />
                  <Row label={localCopy.balloonColor} value={quoteMetadata.balloonColor} />
                  <Row label={localCopy.tableclothColor} value={quoteMetadata.tableclothColor} />
                  <Row label={localCopy.customColors} value={quoteMetadata.customColors} />
                  <Row label={localCopy.customRequest} value={quoteMetadata.customRequest} />
                  <Row label={localCopy.customerNotes} value={quoteMetadata.customerNotes} />
                </Section>
              )}

              <Section icon={<Gift className="h-4 w-4 shrink-0" aria-hidden="true" />} title={t('orderDetail.sectionPricing')}>
                <Row label={t('orderDetail.base')} value={money(order.base_price)} />
                <Row label={t('orderDetail.upgradesTotal')} value={order.upgrades_total ? money(order.upgrades_total) : null} />
                <Row label={t('orderDetail.deliveryFee')} value={order.delivery_price ? money(order.delivery_price) : null} />
                <Row label={t('orderDetail.coupon')} value={order.coupon_code} />
                <Row label={t('orderDetail.discount')} value={order.coupon_discount ? `−${money(order.coupon_discount)}` : null} />
                {showInternal && order.admin_discount ? (
                  <Row label={t('orderDetail.adminDiscount')} value={`−${money(order.admin_discount)}`} />
                ) : null}
                <div className="mt-1 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-gray-200 pt-2 text-sm font-black text-[#8C6D3F]">
                  <span className="min-w-0 break-words">{t('orderDetail.total')}</span>
                  <span className="whitespace-nowrap">{money(order.total_price)}</span>
                </div>
              </Section>

              {showWebsiteOrderSignatures && (
                <Section icon={<PenTool className="h-4 w-4 shrink-0" aria-hidden="true" />} title={localCopy.signatures}>
                  {signatureLoading ? <p className="text-xs text-gray-400">{localCopy.signatureLoading}</p> : null}
                  <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                    {order.groom_signature_path ? (
                      <SignaturePreview
                        label={localCopy.customerSignature}
                        url={primarySignatureUrl}
                        signedOn={order.groom_sign_date}
                        openLabel={localCopy.openSignature}
                        unavailableLabel={localCopy.signatureUnavailable}
                      />
                    ) : null}
                    {order.bride_signature_path ? (
                      <SignaturePreview
                        label={localCopy.additionalSignature}
                        url={secondarySignatureUrl}
                        signedOn={order.bride_sign_date}
                        openLabel={localCopy.openSignature}
                        unavailableLabel={localCopy.signatureUnavailable}
                      />
                    ) : null}
                  </div>
                </Section>
              )}

              {showInternal && (orderSourceLabel || order.received_by || internalNotes) && (
                <Section icon={<ClipboardList className="h-4 w-4 shrink-0" aria-hidden="true" />} title={t('orderDetail.sectionAdmin')}>
                  <Row label={t('orderDetail.source')} value={orderSourceLabel} />
                  <Row label={t('orderDetail.receivedBy')} value={order.received_by ? labelOr(`admin.received_${order.received_by}`, order.received_by) : null} />
                  <Row label={t('orderDetail.internalNotes')} value={internalNotes ? <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{internalNotes}</span> : null} />
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
