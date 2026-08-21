import type { OverrideMap, PackageOverride } from '../lib/packages';

const DEFAULT_PRODUCT_CATEGORIES = {
  CENTERPIECES: 'מרכזי שולחן',
  CHUPPAH: 'עיצוב חופה',
  ENTRANCE: 'עיצוב כניסה',
  SWEET_BAR: 'בר מתוק ואביזרים'
} as const;

const CATEGORY_PREFIX = 'catalog-category:';
const DEFAULT_CATEGORY_DEFINITIONS = [
  { key: 'CENTERPIECES', id: 'centerpieces', name: DEFAULT_PRODUCT_CATEGORIES.CENTERPIECES },
  { key: 'CHUPPAH', id: 'chuppah', name: DEFAULT_PRODUCT_CATEGORIES.CHUPPAH },
  { key: 'ENTRANCE', id: 'entrance', name: DEFAULT_PRODUCT_CATEGORIES.ENTRANCE },
  { key: 'SWEET_BAR', id: 'sweet-bar', name: DEFAULT_PRODUCT_CATEGORIES.SWEET_BAR }
] as const;

type CategoryKey = (typeof DEFAULT_CATEGORY_DEFINITIONS)[number]['key'];
type CategoryMap = Record<string, string> & Record<CategoryKey, string>;

let activeCategoryEntries: Record<string, string> = { ...DEFAULT_PRODUCT_CATEGORIES };

export const SHOP_PRODUCT_CATEGORIES = new Proxy({ ...DEFAULT_PRODUCT_CATEGORIES } as CategoryMap, {
  ownKeys: () => Reflect.ownKeys(activeCategoryEntries),
  getOwnPropertyDescriptor: (_target, property) => {
    if (typeof property === 'string' && property in activeCategoryEntries) {
      return { configurable: true, enumerable: true, writable: false, value: activeCategoryEntries[property] };
    }
    return undefined;
  },
  get: (target, property, receiver) => {
    if (typeof property === 'string' && property in activeCategoryEntries) return activeCategoryEntries[property];
    return Reflect.get(target, property, receiver);
  }
});

export type ShopProductCategory = string;

export interface ShopProductCategoryRecord {
  id: string;
  sourceName: string;
  name: string;
  aliases: string[];
  hidden: boolean;
  custom: boolean;
  sortOrder: number;
}

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
    category: DEFAULT_PRODUCT_CATEGORIES.CENTERPIECES,
    title: 'קומפוזיציית פרחים ונרות לשולחן',
    subtitle: '5–6 בקבוקוני פרחים ונרות לשולחן רגיל',
    price: 180,
    svgType: 'tables'
  },
  {
    id: 'product-sponge-round',
    category: DEFAULT_PRODUCT_CATEGORIES.CENTERPIECES,
    title: 'סידור פרחים עגול',
    subtitle: 'סידור פרחים עגול בספוג למרכז שולחן',
    price: 180,
    svgType: 'tables'
  },
  {
    id: 'product-sponge-medium',
    category: DEFAULT_PRODUCT_CATEGORIES.CENTERPIECES,
    title: 'סידור פרחים בינוני',
    subtitle: 'סידור עשיר בספוג למרכז שולחן',
    price: 300,
    svgType: 'tables'
  },
  {
    id: 'product-deco-small',
    category: DEFAULT_PRODUCT_CATEGORIES.CENTERPIECES,
    title: 'סידור פרחים קטן בכלי דקורטיבי',
    subtitle: 'עיצוב קטן ועדין לשולחן או לאזור קבלת פנים',
    price: 280,
    svgType: 'tables'
  },
  {
    id: 'product-deco-medium',
    category: DEFAULT_PRODUCT_CATEGORIES.CENTERPIECES,
    title: 'סידור פרחים בינוני בכלי דקורטיבי',
    subtitle: 'סידור בינוני ומרשים לאירוע',
    price: 400,
    svgType: 'tables'
  },
  {
    id: 'product-deco-large',
    category: DEFAULT_PRODUCT_CATEGORIES.CENTERPIECES,
    title: 'סידור פרחים גדול בכלי דקורטיבי',
    subtitle: 'עיצוב גדול ובולט למרכז שולחן',
    price: 600,
    svgType: 'tables'
  },
  {
    id: 'product-chair-clasps-6',
    category: DEFAULT_PRODUCT_CATEGORIES.CHUPPAH,
    title: '6 חבקי פרחים לכיסאות',
    subtitle: 'חבקי פרחים מעוצבים לכיסאות החופה',
    price: 600,
    svgType: 'chuppah-s'
  },
  {
    id: 'product-side-clasp-yod',
    category: DEFAULT_PRODUCT_CATEGORIES.CHUPPAH,
    title: 'חבק פרחים צדדי לחופה',
    subtitle: 'חבק פרחים בצורת י׳ לעמוד החופה',
    price: 300,
    svgType: 'chuppah-s'
  },
  {
    id: 'product-top-clasp',
    category: DEFAULT_PRODUCT_CATEGORIES.CHUPPAH,
    title: 'חבק פרחים עליון לחופה',
    subtitle: 'חבק עליון מעוצב לחופה',
    price: 400,
    svgType: 'chuppah-m'
  },
  {
    id: 'product-back-fabrics-2',
    category: DEFAULT_PRODUCT_CATEGORIES.CHUPPAH,
    title: '2 בדים אחוריים לחופה',
    subtitle: 'תוספת בדים אחוריים במראה עשיר ורומנטי',
    price: 300,
    svgType: 'chuppah-drapes'
  },
  {
    id: 'product-top-parochet',
    category: DEFAULT_PRODUCT_CATEGORIES.CHUPPAH,
    title: 'פרוכת עליונה לחופה',
    subtitle: 'פרוכת עליונה דקורטיבית לחופה',
    price: 500,
    svgType: 'chuppah-drapes'
  },
  {
    id: 'product-carpet-5',
    category: DEFAULT_PRODUCT_CATEGORIES.CHUPPAH,
    title: 'שטיח לשביל חופה — 5 מטר',
    subtitle: 'שטיח מעוצב לשביל הכניסה לחופה',
    price: 250,
    svgType: 'chuppah-s'
  },
  {
    id: 'product-entrance-sign',
    category: DEFAULT_PRODUCT_CATEGORIES.ENTRANCE,
    title: 'שלט כניסה על מעמד',
    subtitle: 'שלט קאפה מעוצב ומותאם אישית לאירוע',
    price: 500,
    svgType: 'entrance'
  },
  {
    id: 'product-sign-flowers',
    category: DEFAULT_PRODUCT_CATEGORIES.ENTRANCE,
    title: 'תוספת פרחים לשלט כניסה',
    subtitle: 'שדרוג פרחוני לשלט הכניסה',
    price: 300,
    svgType: 'entrance'
  },
  {
    id: 'product-cylinder-candles-10',
    category: DEFAULT_PRODUCT_CATEGORIES.ENTRANCE,
    title: '10 נרות בצילינדר',
    subtitle: 'נרות בצילינדר לעיצוב שביל הכניסה או החופה',
    price: 400,
    svgType: 'candles'
  },
  {
    id: 'product-bar-balloon-arch',
    category: DEFAULT_PRODUCT_CATEGORIES.SWEET_BAR,
    title: 'שער בלונים לבר מתוק',
    subtitle: 'שער בלונים מסביב לשולחן הבר',
    price: 700,
    svgType: 'bar'
  },
  {
    id: 'product-bar-balloon-columns',
    category: DEFAULT_PRODUCT_CATEGORIES.SWEET_BAR,
    title: '2 עמודי בלונים',
    subtitle: 'עמודי בלונים משני צידי הבר המתוק',
    price: 500,
    svgType: 'bar'
  },
  {
    id: 'product-bar-name-sign',
    category: DEFAULT_PRODUCT_CATEGORIES.SWEET_BAR,
    title: 'שלט שם לבר מתוק',
    subtitle: 'שלט מעוצב בהתאמה אישית עם שם הילד/ה',
    price: 600,
    svgType: 'bar'
  }
];

export function getDefaultShopProductPosition(productId: string): number {
  const target = SHOP_PRODUCTS.find((product) => product.id === productId);
  if (!target) return Number.MAX_SAFE_INTEGER;

  let position = 0;
  for (const product of SHOP_PRODUCTS) {
    if (product.category === target.category) position += 1;
    if (product.id === productId) return position;
  }
  return Number.MAX_SAFE_INTEGER;
}

function parseAliases(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } catch {
    return [];
  }
}

function categoryRecordFromOverride(override: PackageOverride): ShopProductCategoryRecord | null {
  if (!override.package_id.startsWith(CATEGORY_PREFIX)) return null;
  const sourceName = override.category?.trim() || override.title?.trim();
  const name = override.title?.trim();
  if (!sourceName || !name) return null;
  return {
    id: override.package_id,
    sourceName,
    name,
    aliases: parseAliases(override.description),
    hidden: override.hidden,
    custom: override.package_id.startsWith(`${CATEGORY_PREFIX}custom-`),
    sortOrder: override.sort_order ?? Number.MAX_SAFE_INTEGER
  };
}

export function getShopProductCategoryRecords(
  overrides: OverrideMap,
  includeHidden = false
): ShopProductCategoryRecord[] {
  const records: ShopProductCategoryRecord[] = DEFAULT_CATEGORY_DEFINITIONS.map((definition, index) => {
    const id = `${CATEGORY_PREFIX}${definition.id}`;
    const override = overrides[id];
    const parsed = override ? categoryRecordFromOverride(override) : null;
    return parsed ?? {
      id,
      sourceName: definition.name,
      name: definition.name,
      aliases: [],
      hidden: false,
      custom: false,
      sortOrder: index
    };
  });

  const customRecords = Object.values(overrides)
    .filter((override) => override.package_id.startsWith(`${CATEGORY_PREFIX}custom-`))
    .map(categoryRecordFromOverride)
    .filter((record): record is ShopProductCategoryRecord => record !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'he'));

  const all = [...records, ...customRecords];
  return includeHidden ? all : all.filter((record) => !record.hidden);
}

function matchingCategoryRecord(category: string, overrides: OverrideMap): ShopProductCategoryRecord | undefined {
  const normalized = category.trim();
  return getShopProductCategoryRecords(overrides, true).find((record) =>
    record.sourceName === normalized || record.name === normalized || record.aliases.includes(normalized)
  );
}

export function resolveShopProductCategory(category: string, overrides: OverrideMap): string {
  return matchingCategoryRecord(category, overrides)?.name ?? category;
}

export function buildShopProductCategories(overrides: OverrideMap): string[] {
  return getShopProductCategoryRecords(overrides).map((record) => record.name);
}

export function syncShopProductCategories(overrides: OverrideMap): void {
  const activeRecords = getShopProductCategoryRecords(overrides);
  const nextEntries: Record<string, string> = {};

  for (const definition of DEFAULT_CATEGORY_DEFINITIONS) {
    const record = activeRecords.find((item) => item.id === `${CATEGORY_PREFIX}${definition.id}`);
    if (record) nextEntries[definition.key] = record.name;
  }

  for (const record of activeRecords.filter((item) => item.custom)) {
    nextEntries[`CUSTOM_${record.id.slice(CATEGORY_PREFIX.length).replace(/[^a-zA-Z0-9_]/g, '_')}`] = record.name;
  }

  activeCategoryEntries = nextEntries;

  for (const product of SHOP_PRODUCTS) {
    product.category = resolveShopProductCategory(product.category, overrides);
  }
}

export function normalizeProductCategoryOverrides(overrides: OverrideMap): OverrideMap {
  const next: OverrideMap = {};
  for (const [id, override] of Object.entries(overrides)) {
    if (id.startsWith('product-') && override.category) {
      next[id] = { ...override, category: resolveShopProductCategory(override.category, overrides) };
    } else {
      next[id] = override;
    }
  }
  return next;
}

export function createProductCategoryOverride(
  name: string,
  existing?: PackageOverride,
  aliases: string[] = [],
  hidden = false
): PackageOverride {
  const cleanName = name.trim();
  const id = existing?.package_id ?? `${CATEGORY_PREFIX}custom-${crypto.randomUUID().slice(0, 8)}`;
  const sourceName = existing?.category?.trim() || cleanName;
  return {
    package_id: id,
    price: null,
    title: cleanName,
    subtitle: null,
    description: JSON.stringify([...new Set(aliases.map((item) => item.trim()).filter(Boolean))]),
    benefits: null,
    image_url: null,
    image_url_2: null,
    image_url_3: null,
    image_url_4: null,
    category: sourceName,
    svg_type: 'category',
    pricing_tiers: null,
    hidden,
    is_custom: true,
    sort_order: existing?.sort_order ?? Date.now()
  };
}

export function categoryOverrideForRecord(
  record: ShopProductCategoryRecord,
  overrides: OverrideMap,
  name = record.name,
  hidden = record.hidden,
  aliases = record.aliases
): PackageOverride {
  const existing = overrides[record.id];
  return createProductCategoryOverride(name, existing ?? {
    package_id: record.id,
    price: null,
    title: record.name,
    subtitle: null,
    description: JSON.stringify(record.aliases),
    benefits: null,
    image_url: null,
    image_url_2: null,
    image_url_3: null,
    image_url_4: null,
    category: record.sourceName,
    svg_type: 'category',
    pricing_tiers: null,
    hidden: record.hidden,
    is_custom: record.custom,
    sort_order: record.sortOrder
  }, aliases, hidden);
}

function firstOverrideImage(override: PackageOverride): string | undefined {
  return override.image_url ?? override.image_url_2 ?? override.image_url_3 ?? override.image_url_4 ?? undefined;
}

interface OrderedShopProduct {
  product: ShopProduct;
  categoryOrder: number;
  sortOrder: number;
  explicitOrder: boolean;
  fallbackOrder: number;
}

export function buildShopProducts(overrides: OverrideMap): ShopProduct[] {
  syncShopProductCategories(overrides);
  const categories = buildShopProductCategories(overrides);
  const categoryOrder = new Map(categories.map((category, index) => [category, index]));
  const activeCategories = new Set(categories);
  const ordered: OrderedShopProduct[] = [];

  SHOP_PRODUCTS.forEach((product, index) => {
    const override = overrides[product.id];
    if (override?.hidden) return;
    const category = resolveShopProductCategory(override?.category ?? product.category, overrides);
    if (!activeCategories.has(category)) return;

    ordered.push({
      product: {
        ...product,
        title: override?.title ?? product.title,
        subtitle: override?.subtitle ?? product.subtitle,
        price: override?.price ?? product.price,
        image: firstOverrideImage(override ?? ({} as PackageOverride)) ?? product.image,
        category,
        svgType: override?.svg_type ?? product.svgType
      },
      categoryOrder: categoryOrder.get(category) ?? Number.MAX_SAFE_INTEGER,
      sortOrder: override?.sort_order ?? getDefaultShopProductPosition(product.id),
      explicitOrder: override?.sort_order != null,
      fallbackOrder: index
    });
  });

  Object.values(overrides)
    .filter((override) => override.is_custom && override.package_id.startsWith('product-') && !override.hidden)
    .forEach((override, index) => {
      const product = productFromOverride(override);
      const category = resolveShopProductCategory(product.category, overrides);
      if (!activeCategories.has(category)) return;
      ordered.push({
        product: { ...product, category },
        categoryOrder: categoryOrder.get(category) ?? Number.MAX_SAFE_INTEGER,
        sortOrder: override.sort_order ?? Number.MAX_SAFE_INTEGER,
        explicitOrder: override.sort_order != null,
        fallbackOrder: SHOP_PRODUCTS.length + index
      });
    });

  ordered.sort((a, b) =>
    a.categoryOrder - b.categoryOrder ||
    a.sortOrder - b.sortOrder ||
    Number(b.explicitOrder) - Number(a.explicitOrder) ||
    a.fallbackOrder - b.fallbackOrder
  );

  return ordered.map((entry) => entry.product);
}

export function productFromOverride(override: PackageOverride): ShopProduct {
  return {
    id: override.package_id,
    category: override.category ?? DEFAULT_PRODUCT_CATEGORIES.CENTERPIECES,
    title: override.title ?? '',
    subtitle: override.subtitle ?? '',
    price: override.price ?? 0,
    image: firstOverrideImage(override),
    svgType: override.svg_type ?? 'default'
  };
}