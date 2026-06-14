// תוכן דו-לשוני לקטגוריות, חבילות ותוספות.
// העברית היא מקור (יושבת בנתוני App.tsx); כאן מוגדר התרגום לאנגלית + תוויות תצוגה.
import type { Lang } from './i18n';

// --- תוויות קטגוריות (תצוגה מקוצרת בשתי השפות) ---
// המפתח הוא ערך הקטגוריה (id הפנימי שנשמר בנתונים).
export const CATEGORY_LABELS: Record<string, { he: string; en: string }> = {
  'חתונה': { he: 'חתונה', en: 'Wedding' },
  'חינה': { he: 'חינה', en: 'Henna' },
  'אירועים (בר/בת מצווה, ברית/ה, יומולדת)': { he: 'אירועים', en: 'Events' },
  'עמדות בר מתוק': { he: 'עמדות בר מתוק', en: 'Sweet Bars' }
};

export function categoryLabel(catId: string, lang: Lang): string {
  const entry = CATEGORY_LABELS[catId];
  if (!entry) return catId;
  return lang === 'en' ? entry.en : entry.he;
}

// --- תרגום אנגלי לחבילות (לפי id) ---
export interface PackageTextEN {
  title: string;
  subtitle: string;
  description: string;
  benefits: string;
  details: {
    chuppah?: string[];
    options?: string[];
    tables?: string[];
    bar?: string[];
    entrance?: string[];
    highlight?: string[];
    photoOp?: string[];
  };
}

const GIFT_500_EN = 'Exclusive perk: ₪500 gift toward a design upgrade!';
const BAR_GIFT_EN = 'Perk: book a bar — 2 premium silk bouquets to style the bar, on us!';

export const PACKAGE_EN: Record<string, PackageTextEN> = {
  'classic-s': {
    title: 'Wedding Design Package — Classic S',
    subtitle: 'Chuppah design + 10 styled tables',
    description:
      'A classic, elegant and timeless design that speaks straight to the heart. A perfect blend of rich florals, soft candles and flowing fabrics, creating a romantic, luxurious and festive atmosphere that leaves you and your guests with an unforgettable memory.',
    benefits: GIFT_500_EN,
    details: {
      chuppah: ['2 luxurious front fabrics', "2 rich floral clasps (Yod shape) on the chuppah posts"],
      tables: ['Rich 5/6 composition of flowers and candles per table / round floral foam arrangement']
    }
  },
  'classic-m': {
    title: 'Wedding Design Package — Classic M',
    subtitle: 'Chuppah design + 20 styled tables',
    description:
      'The perfect package for a large, impressive wedding. A rich, harmonious design that fills the space with a festive, natural and stunning atmosphere. Flowers, light and candles combine into an unforgettable experience that leaves a mark on every guest’s heart.',
    benefits: GIFT_500_EN,
    details: {
      chuppah: ['2 luxurious front fabrics', '2 rich floral clasps (Yod shape) on the chuppah posts'],
      tables: ['Rich 5/6 composition of flowers and candles per table / round floral foam arrangement']
    }
  },
  'classic-l': {
    title: 'Wedding Design Package — Classic L',
    subtitle: 'Chuppah design + 30 styled tables',
    description:
      'An unforgettable design that creates wow moments from the entrance to the dance floor. An abundance of flowers, soft lighting and mesmerizing candles combine into a moving, luxurious and stylish event. Because you deserve to celebrate big — exactly as you dreamed.',
    benefits: GIFT_500_EN,
    details: {
      chuppah: ['2 luxurious front fabrics', '2 rich floral clasps (Yod shape) on the chuppah posts'],
      tables: ['Rich 5/6 composition of flowers and candles per table / round floral foam arrangement']
    }
  },
  'gypsophila': {
    title: 'Gypsophila Wedding Design — Chuppah + 40 tables',
    subtitle: 'A magical, romantic design of rich, full gypsophila',
    description:
      'An elegant, delicate design with soft gypsophila in varied shades, combined with romantic candles for a magical, emotional atmosphere. Every detail is carefully crafted to turn the wedding day into an unforgettable experience.',
    benefits: GIFT_500_EN,
    details: {
      chuppah: [
        '2 gypsophila floral clasps (Yod shape) on the chuppah posts',
        'For fewer than 40 tables, the remaining flowers are styled as tie-on bouquets for the aisle chairs'
      ],
      tables: ['Rich composition of gypsophila and candles per table / round floral foam arrangement']
    }
  },
  'chuppah-drapes': {
    title: 'Chuppah Design Package — Flowing Fabrics + Aisle',
    subtitle: 'A romantic, lit aisle and a stunning chuppah',
    description:
      'Give your love the perfect stage. A stunning chuppah with flowing fabrics and a romantic, illuminated aisle — a design that makes every moment feel like a dream coming true.',
    benefits: GIFT_500_EN,
    details: {
      chuppah: ['4 high-level flowing front fabrics', '2 rich floral clasps (Yod shape) on the chuppah posts'],
      options: ['6 tie-on floral chair clasps', 'Aisle runner with candles in cylinders']
    }
  },
  'henna-cookies': {
    title: 'Traditional Moroccan Cookie Bar',
    subtitle: 'Handcrafted cookie bar in an authentic royal style (for 150–200 guests)',
    description:
      'An authentic celebration of flavors, aromas and colors! Includes a rich, lavish bar of the finest handmade Moroccan cookies, royal copper vessels, custom-styled cloths and ambiance candles.',
    benefits: 'Exclusive perk: 2 stunning silk bouquets for styling — on me!',
    details: {
      bar: [
        'A rich, lavish selection of authentic handmade Moroccan cookies — fresh, soft and especially tasty',
        'A winning mix of traditional colorful cookies alongside classic, styled premium cookies',
        'Lavish styling with royal gold & copper vessels suited to the henna ambiance',
        'Custom-styled cloths and romantic candles for a magical atmosphere'
      ]
    }
  },
  'henna-market': {
    title: 'Combined “Henna Market” Bar',
    subtitle: 'Traditional cookie bar + premium nut market (for 150–200 guests)',
    description:
      'The perfect upgrade that becomes the heart of the event! Combines the selection of fine Moroccan cookies alongside a nut market styled in authentic jute sacks with a rich variety of quality nuts and dried fruit.',
    benefits: 'Exclusive perk: 2 stunning silk bouquets for styling — on me!',
    details: {
      bar: [
        'Premium handmade Moroccan cookie bar',
        'A styled “nut market” in jute sacks with an abundance of nuts and dried fruit',
        'Full authentic styling including royal gold vessels, ambiance candles and unique cloths'
      ]
    }
  },
  'event-classic': {
    title: '“Classic” Events Package',
    subtitle: 'The cleanest, most romantic and elegant look',
    description:
      'Want a clean, romantic and luxurious event design that flatters the hall and creates a classic, inviting atmosphere? This package focuses on the small details that make the big difference, with touches of nature and ambiance candles.',
    benefits: 'Includes a custom-designed entrance sign with a delicate balloon trail or fresh flowers!',
    details: {
      tables: ['Styled compositions of fresh, lush bud-vase flowers with candles / low, romantic foam arrangements, matched to the table'],
      entrance: ['A custom-designed entrance sign that welcomes guests in style'],
      highlight: ['Style touch: a delicate balloon trail or fresh-flower add-on of your choice']
    }
  },
  'event-balloon': {
    title: '“Balloon Art” Events Package',
    subtitle: 'The modern, festive and colorful look',
    description:
      'Celebrate big and bold! If you want a vibrant, joyful, energetic event, our balloon package lifts the hall to new heights. A modern, creative design with a striking presence you can’t ignore.',
    benefits: 'Includes a festive, rich, styled balloon arch at the hall entrance!',
    details: {
      tables: ['Tall, impressive, artistic balloon arrangements that create a “wow” effect from every corner'],
      entrance: ['A custom-designed entrance sign for the celebrants'],
      highlight: ['A festive, rich, styled balloon arch at the entrance leading guests inside']
    }
  },
  'event-vip': {
    title: '“Showtime” (VIP) Package — Luxury Photo Booth',
    subtitle: 'Rich table styling and an over-the-top photo booth',
    description:
      'For those who won’t settle for less than perfect. We create a movie-worthy event with an unprecedented design show, rich materials, and the cherry on top — a luxury photo booth that becomes the center of attention and leaves your guests with an unforgettable keepsake.',
    benefits: 'A full VIP photo booth with an artistic balloon arch, backdrop wall and accessories!',
    details: {
      tables: ['Your choice: compositions with fresh flowers and candles / tall, styled balloon arrangements'],
      entrance: ['A custom entrance sign in a clean, elegant and luxurious line'],
      photoOp: ['A giant artistic balloon arch in the hall, including a backdrop wall, styled accessories and refined floral touches — the spot where everyone stops to take photos!']
    }
  },
  'bar-candy': {
    title: 'Sour & Colorful Gummy Bar',
    subtitle: 'A vibrant, joyful bar for all ages',
    description:
      'A vibrant, joyful and wildly rich bar filled with all kinds of premium gummies, sour candies and marshmallows. Styled in decorative vessels at varying heights, drawing guests (of all ages!) all evening long.',
    benefits: BAR_GIFT_EN,
    details: {
      bar: [
        'A rich selection of quality gummies, sour candies and marshmallows',
        'Displayed in decorative vessels at varying heights',
        'A colorful, vibrant design that draws guests of all ages all evening'
      ]
    }
  },
  'bar-branded': {
    title: 'Branded Concept Bar with Personalized Wrapping',
    subtitle: 'The top of style — a bar tailored to your concept',
    description:
      'The top of style! A bar tailored specifically to your event’s concept and colors. All the snacks, chocolates and candies arrive in designed, branded wrapping with your name or unique graphics. It looks like a million dollars and every guest simply has to stop and photograph it.',
    benefits: BAR_GIFT_EN,
    details: {
      bar: [
        'Snacks, chocolates and candies in designed, personally branded wrapping',
        'Branding with your name or unique event graphics',
        'Includes a designed coffee sign with the celebrant’s name'
      ]
    }
  },
  'bar-boutique': {
    title: 'Exclusive Boutique Dessert Bar',
    subtitle: 'A perfect culinary experience for sweet lovers',
    description:
      'A perfect culinary experience for sweet lovers. The bar includes a variety of handmade desserts with rich flavors and perfect textures, made from the finest ingredients and presented in a super-elegant, meticulous display.',
    benefits: BAR_GIFT_EN,
    details: {
      bar: [
        'A variety of handmade boutique desserts',
        'Rich flavors, perfect textures and the finest ingredients',
        'A super-elegant, meticulous display'
      ]
    }
  }
};

// --- תרגום אנגלי לשמות התוספות (לפי id) ---
export const ADDON_EN: Record<string, string> = {
  'entrance-sign': 'Kappa entrance sign on a stand',
  'sign-flowers': 'Flower add-on for the sign',
  'carpet-5': 'Aisle runner 5 m',
  'carpet-10': 'Aisle runner 10 m',
  'cylinder-candles-10': '10 candles in cylinders for the aisle',
  'candles-flower-vessel-6': '6 candles in a styled floral vessel',
  'chair-clasps-6': '6 floral chair clasps',
  'side-clasp-yod': 'Side floral clasp for the chuppah (Yod shape)',
  'top-clasp': 'Top floral clasp for the chuppah',
  'clasp-resh-upgrade': 'Upgrade to a Resh-shaped floral clasp for the chuppah',
  'top-crown-full': 'Full luxurious top floral crown band',
  'chet-shape': 'Chet-shaped floral frame for the chuppah',
  'back-fabrics-2': '2 additional back fabrics for the chuppah',
  'top-parochet': 'Top parochet for the chuppah',
  'composite-10-12': 'Composition of 10/12 bud-vase flowers & candles for a knights’ table',
  'composite-5-6': 'Composition of 5/6 bud-vase flowers & candles for a regular table',
  'sponge-round': 'Round floral foam arrangement',
  'sponge-medium': 'Medium floral foam arrangement',
  'deco-small': 'Small flower arrangement in a decorative vessel',
  'deco-medium': 'Medium flower arrangement in a decorative vessel',
  'deco-large': 'Large flower arrangement in a decorative vessel',
  'deco-xl': 'Extra-large flower arrangement in a decorative vessel',
  'bamboo-chuppah': 'Built bamboo chuppah',
  'chuppah-stage': 'Chuppah stage',
  'knights-gyps-line': 'Knights’ table center line of gypsophila & candles',
  'bar-balloon-arch': 'Balloon arch around the bar table',
  'bar-balloon-columns': '2 balloon columns beside the bar',
  'bar-name-sign': 'Coffee sign with the child’s name'
};

export function localizedAddonName(id: string, fallbackHe: string, lang: Lang): string {
  if (lang === 'en') return ADDON_EN[id] ?? fallbackHe;
  return fallbackHe;
}

// יחידת מידה (כמו "למטר") מתורגמת
export function localizedUnit(unit: string | undefined, lang: Lang): string | undefined {
  if (!unit) return undefined;
  if (lang === 'en') return unit === 'למטר' ? 'per meter' : unit;
  return unit;
}
