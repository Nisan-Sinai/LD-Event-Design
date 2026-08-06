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
  const { t, lang } = useI18n();
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

  const capabilityCards = lang === 'he'
    ? [
        { title: 'תמונות ומדיה', body: 'העלאת תמונה חדשה, החלפה, תצוגה מקדימה והסרת תמונה.', icon: ImagePlus },
        { title: 'תוכן ומחירים', body: 'שינוי שמות, תיאורים, יתרונות, קטגוריות ומחירים.', icon: Pencil },
        { title: 'שליטה מלאה בקטלוג', body: 'הוספה, הסתרה, הצגה, שחזור ומחיקה של מוצרים וחבילות.', icon: EyeOff }
      ]
    : [
        { title: 'Images & media', body: 'Upload, replace, preview and remove catalogue images.', icon: ImagePlus },
        { title: 'Content & pricing', body: 'Edit names, descriptions, benefits, categories and prices.', icon: Pencil },
        { title: 'Full catalogue control', body: 'Create, hide, show, restore and delete products and packages.', icon: EyeOff }
      ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="rounded-[2rem] border border-[#E8C5B8]/70 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F4E3E3]/45 p-5 shadow-[0_24px_70px_rgba(140,109,63,0.10)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-black text-[#8C6D3F] sm:text-3xl">
              <LayoutDashboard className="h-6 w-6 text-[#B29259]" aria-hidden="true" />
              {lang === 'he' ? 'ניהול האתר והקטלוג' : 'Website & catalogue management'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
              {lang === 'he'
                ? 'מכאן אפשר לעדכן את התמונות, החבילות, המוצרים, הטקסטים והמחירים שמופיעים באתר. השינויים נשמרים ב־Supabase ומופיעים לכל הלקוחות.'
                : 'Manage the images, packages, products, copy and prices shown on the website. Changes are stored in Supabase and published to all visitors.'}
            </p>
          </div>
          {user?.email && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700" dir="ltr">
              {user.email}
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {capabilityCards.map(({ title, body, icon: Icon }) => (
            <div key={title} className="rounded-2xl border border-[#EAE3D2] bg-white/85 p-4 shadow-sm">
              <Icon className="h-5 w-5 text-[#B8860B]" aria-hidden="true" />
              <h3 className="mt-2 text-sm font-black text-[#4D4037]">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="my-6 flex flex-wrap gap-1 rounded-2xl border border-[#EAE3D2] bg-white p-1.5 shadow-sm" role="tablist" aria-label={t('adminPage.adminArea')}>
        {tabBtn('catalog', lang === 'he' ? 'תמונות, מוצרים וחבילות' : 'Images, products & packages', PackageIcon)}
        {tabBtn('orders', t('adminPage.tabOrders'), ClipboardList)}
      </div>

      {tab === 'catalog' && (
        <div className="space-y-6">
          <div id="admin-products" className="scroll-mt-28">
            <div className="mb-3 flex items-center gap-2 px-1">
              <ShoppingBag className="h-5 w-5 text-[#B8860B]" aria-hidden="true" />
              <p className="text-sm font-black text-[#4D4037]">{lang === 'he' ? 'ניהול מוצרים ופריטים' : 'Products and design pieces'}</p>
            </div>
            <ProductManager />
          </div>
          <div id="admin-packages" className="scroll-mt-28">
            <div className="mb-3 flex items-center gap-2 px-1">
              <PackageIcon className="h-5 w-5 text-[#B8860B]" aria-hidden="true" />
              <p className="text-sm font-black text-[#4D4037]">{lang === 'he' ? 'ניהול חבילות עיצוב' : 'Design packages'}</p>
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
