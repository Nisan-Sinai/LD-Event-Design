import type { OverrideMap, PackageOverride } from '../lib/packages';

export const SHOP_PRODUCT_CATEGORIES = {
  CENTERPIECES: 'מרכזי שולחן',
  CHUPPAH: 'עיצוב חופה',
  ENTRANCE: 'עיצוב כניסה',
  SWEET_BAR: 'בר מתוק ואביזרים'
} as const;

export type ShopProductCategory = (typeof SHOP_PRODUCT_CATEGORIES)[keyof typeof SHOP_PRODUCT_CATEGORIES];

export interface ShopProduct {
  id: string;
  category: ShopProductCategory;
  title: string;
  subtitle: string;
  price: number;
  image?: string;
  svgType: string;
  hidden?: boolean;
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 'product-composite-5-6',
    category: SHOP_PRODUCT_CATEGORIES.CENTERPIECES,
    title: 'קומפוזיציית פרחים ונרות לשולחן',
    subtitle: '5–6 בקבוקוני פרחים ונרות לשולחן רגיל',
    price: 180,
    svgType: 'tables'
  },
  {
    id: 'product-sponge-round',
    category: SHOP_PRODUCT_CATEGORIES.CENTERPIECES,
    title: 'סידור פרחים עגול',
    subtitle: 'סידור פרחים עגול בספוג למרכז שולחן',
    price: 180,
    svgType: 'tables'
  },
  {
    id: 'product-sponge-medium',
    category: SHOP_PRODUCT_CATEGORIES.CENTERPIECES,
    title: 'סידור פרחים בינוני',
    subtitle: 'סידור עשיר בספוג למרכז שולחן',
    price: 300,
    svgType: 'tables'
  },
  {
    id: 'product-deco-small',
    category: SHOP_PRODUCT_CATEGORIES.CENTERPIECES,
    title: 'סידור פרחים קטן בכלי דקורטיבי',
    subtitle: 'עיצוב קטן ועדין לשולחן או לאזור קבלת פנים',
    price: 280,
    svgType: 'tables'
  },
  {
    id: 'product-deco-medium',
    category: SHOP_PRODUCT_CATEGORIES.CENTERPIECES,
    title: 'סידור פרחים בינוני בכלי דקורטיבי',
    subtitle: 'סידור בינוני ומרשים לאירוע',
    price: 400,
    svgType: 'tables'
  },
  {
    id: 'product-deco-large',
    category: SHOP_PRODUCT_CATEGORIES.CENTERPIECES,
    title: 'סידור פרחים גדול בכלי דקורטיבי',
    subtitle: 'עיצוב גדול ובולט למרכז שולחן',
    price: 600,
    svgType: 'tables'
  },
  {
    id: 'product-chair-clasps-6',
    category: SHOP_PRODUCT_CATEGORIES.CHUPPAH,
    title: '6 חבקי פרחים לכיסאות',
    subtitle: 'חבקי פרחים מעוצבים לכיסאות החופה',
    price: 600,
    svgType: 'chuppah-s'
  },
  {
    id: 'product-side-clasp-yod',
    category: SHOP_PRODUCT_CATEGORIES.CHUPPAH,
    title: 'חבק פרחים צדדי לחופה',
    subtitle: 'חבק פרחים בצורת י׳ לעמוד החופה',
    price: 300,
    svgType: 'chuppah-s'
  },
  {
    id: 'product-top-clasp',
    category: SHOP_PRODUCT_CATEGORIES.CHUPPAH,
    title: 'חבק פרחים עליון לחופה',
    subtitle: 'חבק עליון מעוצב לחופה',
    price: 400,
    svgType: 'chuppah-m'
  },
  {
    id: 'product-back-fabrics-2',
    category: SHOP_PRODUCT_CATEGORIES.CHUPPAH,
    title: '2 בדים אחוריים לחופה',
    subtitle: 'תוספת בדים אחוריים במראה עשיר ורומנטי',
    price: 300,
    svgType: 'chuppah-drapes'
  },
  {
    id: 'product-top-parochet',
    category: SHOP_PRODUCT_CATEGORIES.CHUPPAH,
    title: 'פרוכת עליונה לחופה',
    subtitle: 'פרוכת עליונה דקורטיבית לחופה',
    price: 500,
    svgType: 'chuppah-drapes'
  },
  {
    id: 'product-carpet-5',
    category: SHOP_PRODUCT_CATEGORIES.CHUPPAH,
    title: 'שטיח לשביל חופה — 5 מטר',
    subtitle: 'שטיח מעוצב לשביל הכניסה לחופה',
    price: 250,
    svgType: 'chuppah-s'
  },
  {
    id: 'product-entrance-sign',
    category: SHOP_PRODUCT_CATEGORIES.ENTRANCE,
    title: 'שלט כניסה על מעמד',
    subtitle: 'שלט קאפה מעוצב ומותאם אישית לאירוע',
    price: 500,
    svgType: 'entrance'
  },
  {
    id: 'product-sign-flowers',
    category: SHOP_PRODUCT_CATEGORIES.ENTRANCE,
    title: 'תוספת פרחים לשלט כניסה',
    subtitle: 'שדרוג פרחוני לשלט הכניסה',
    price: 300,
    svgType: 'entrance'
  },
  {
    id: 'product-cylinder-candles-10',
    category: SHOP_PRODUCT_CATEGORIES.ENTRANCE,
    title: '10 נרות בצילינדר',
    subtitle: 'נרות בצילינדר לעיצוב שביל הכניסה או החופה',
    price: 400,
    svgType: 'candles'
  },
  {
    id: 'product-bar-balloon-arch',
    category: SHOP_PRODUCT_CATEGORIES.SWEET_BAR,
    title: 'שער בלונים לבר מתוק',
    subtitle: 'שער בלונים מסביב לשולחן הבר',
    price: 700,
    svgType: 'bar'
  },
  {
    id: 'product-bar-balloon-columns',
    category: SHOP_PRODUCT_CATEGORIES.SWEET_BAR,
    title: '2 עמודי בלונים',
    subtitle: 'עמודי בלונים משני צידי הבר המתוק',
    price: 500,
    svgType: 'bar'
  },
  {
    id: 'product-bar-name-sign',
    category: SHOP_PRODUCT_CATEGORIES.SWEET_BAR,
    title: 'שלט שם לבר מתוק',
    subtitle: 'שלט מעוצב בהתאמה אישית עם שם הילד/ה',
    price: 600,
    svgType: 'bar'
  }
];

export function buildShopProducts(overrides: OverrideMap): ShopProduct[] {
  const base = SHOP_PRODUCTS
    .filter((product) => !overrides[product.id]?.hidden)
    .map((product) => {
      const override = overrides[product.id];
      if (!override) return product;
      return {
        ...product,
        title: override.title ?? product.title,
        subtitle: override.subtitle ?? product.subtitle,
        price: override.price ?? product.price,
        image: override.image_url ?? product.image,
        category: (override.category ?? product.category) as ShopProductCategory,
        svgType: override.svg_type ?? product.svgType
      };
    });

  const custom = Object.values(overrides)
    .filter((override) => override.is_custom && override.package_id.startsWith('product-') && !override.hidden)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(productFromOverride);

  return [...base, ...custom];
}

export function productFromOverride(override: PackageOverride): ShopProduct {
  return {
    id: override.package_id,
    category: (override.category ?? SHOP_PRODUCT_CATEGORIES.CENTERPIECES) as ShopProductCategory,
    title: override.title ?? '',
    subtitle: override.subtitle ?? '',
    price: override.price ?? 0,
    image: override.image_url ?? undefined,
    svgType: override.svg_type ?? 'default'
  };
}
