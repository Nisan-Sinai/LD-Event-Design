import type { Lang } from './i18n';

export interface ProductTextEN {
  title: string;
  subtitle: string;
}

export const PRODUCT_EN: Record<string, ProductTextEN> = {
  'product-composite-5-6': {
    title: 'Flower & Candle Table Composition',
    subtitle: '5–6 flower bud vases and candles for a standard table'
  },
  'product-sponge-round': {
    title: 'Round Flower Arrangement',
    subtitle: 'Round floral foam arrangement for a table centerpiece'
  },
  'product-sponge-medium': {
    title: 'Medium Flower Arrangement',
    subtitle: 'Rich floral foam arrangement for a table centerpiece'
  },
  'product-deco-small': {
    title: 'Small Floral Arrangement in a Decorative Vessel',
    subtitle: 'A delicate compact design for a table or reception area'
  },
  'product-deco-medium': {
    title: 'Medium Floral Arrangement in a Decorative Vessel',
    subtitle: 'A medium, impressive arrangement for the event'
  },
  'product-deco-large': {
    title: 'Large Floral Arrangement in a Decorative Vessel',
    subtitle: 'A large statement design for a table centerpiece'
  },
  'product-chair-clasps-6': {
    title: '6 Floral Chair Clasps',
    subtitle: 'Styled floral clasps for chuppah chairs'
  },
  'product-side-clasp-yod': {
    title: 'Side Floral Clasp for the Chuppah',
    subtitle: 'Yod-shaped floral clasp for a chuppah post'
  },
  'product-top-clasp': {
    title: 'Top Floral Clasp for the Chuppah',
    subtitle: 'Decorative top floral clasp for the chuppah'
  },
  'product-back-fabrics-2': {
    title: '2 Back Fabrics for the Chuppah',
    subtitle: 'Additional back fabrics for a rich, romantic look'
  },
  'product-top-parochet': {
    title: 'Top Parochet for the Chuppah',
    subtitle: 'Decorative top parochet for the chuppah'
  },
  'product-carpet-5': {
    title: 'Chuppah Aisle Runner — 5 m',
    subtitle: 'Styled runner for the chuppah entrance aisle'
  },
  'product-entrance-sign': {
    title: 'Entrance Sign on a Stand',
    subtitle: 'Custom-designed Kappa entrance sign for the event'
  },
  'product-sign-flowers': {
    title: 'Flowers for the Entrance Sign',
    subtitle: 'Floral upgrade for the entrance sign'
  },
  'product-cylinder-candles-10': {
    title: '10 Cylinder Candles',
    subtitle: 'Cylinder candles for the entrance aisle or chuppah'
  },
  'product-bar-balloon-arch': {
    title: 'Balloon Arch for the Sweet Bar',
    subtitle: 'Balloon arch around the bar table'
  },
  'product-bar-balloon-columns': {
    title: '2 Balloon Columns',
    subtitle: 'Balloon columns on both sides of the sweet bar'
  },
  'product-bar-name-sign': {
    title: 'Personalized Sweet-Bar Name Sign',
    subtitle: "Custom sign with the child's name"
  }
};

const PRODUCT_CATEGORY_EN: Record<string, string> = {
  'מרכזי שולחן': 'Table centerpieces',
  'עיצוב חופה': 'Chuppah styling',
  'עיצוב כניסה': 'Entrance styling',
  'בר מתוק ואביזרים': 'Sweet bar & accessories'
};

export function localizedProductText(
  id: string,
  fallback: { title: string; subtitle: string },
  lang: Lang
): { title: string; subtitle: string } {
  if (lang !== 'en') return fallback;
  return PRODUCT_EN[id] ?? fallback;
}

export function localizedProductCategory(category: string, lang: Lang): string {
  if (lang !== 'en') return category;
  return PRODUCT_CATEGORY_EN[category] ?? category;
}
