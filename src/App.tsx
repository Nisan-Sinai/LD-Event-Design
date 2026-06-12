import React, { useState, useRef, useEffect } from 'react';
import { isSupabaseConfigured } from './lib/supabase';
import { submitOrder } from './lib/submitOrder';
import { calcPricing } from './lib/pricing';
import { useI18n } from './i18n/i18n';
import { categoryLabel, PACKAGE_EN, localizedAddonName, localizedUnit } from './i18n/content';
import {
  Sparkles,
  Calendar,
  MapPin,
  Phone,
  User,
  Mail,
  Plus,
  Trash2,
  Gift,
  Truck,
  ArrowRight,
  ArrowLeft,
  Printer,
  Check,
  FileText,
  AlertCircle,
  Users,
  X
} from 'lucide-react';

// --- קטגוריות החבילות ---
const CATEGORIES = {
  WEDDING: 'חתונה',
  HENNA: 'חינה',
  EVENTS: 'אירועים (בר/בת מצווה, ברית/ה, יומולדת)',
  BARS: 'עמדות בר מתוק'
} as const;

// --- קוד קופון להטבת ₪500 לשדרוג העיצוב ---
const COUPON_CODE = 'מתנה';
const COUPON_VALUE = 500;

// --- פריטי תוספת לחבילת עיצוב חתונה ---
// hasFlowers=true => פריט הכולל פרחים, ולכן לא ניתן לממש עליו את הטבת ה-₪500
interface Addon {
  id: string;
  name: string;
  price: number;
  hasFlowers: boolean;
  unit?: string; // לדוגמה: "למטר"
}

const WEDDING_ADDONS: Addon[] = [
  { id: 'entrance-sign', name: 'שלט כניסה קאפה על מעמד', price: 500, hasFlowers: false },
  { id: 'sign-flowers', name: 'תוספת פרחים לשלט', price: 300, hasFlowers: true },
  { id: 'carpet-5', name: 'שטיח לשביל חופה 5 מטר', price: 250, hasFlowers: false },
  { id: 'carpet-10', name: 'שטיח לשביל חופה 10 מטר', price: 500, hasFlowers: false },
  { id: 'cylinder-candles-10', name: '10 נרות בצילינדר לשביל חופה', price: 400, hasFlowers: false },
  { id: 'candles-flower-vessel-6', name: '6 נרות בכלי מעוצב פרחים', price: 900, hasFlowers: true },
  { id: 'chair-clasps-6', name: '6 חבקי פרחים לכסאות', price: 600, hasFlowers: true },
  { id: 'side-clasp-yod', name: 'חבק פרחים צדדי לחופה בצורת י׳', price: 300, hasFlowers: true },
  { id: 'top-clasp', name: 'חבק פרחים עליון לחופה', price: 400, hasFlowers: true },
  { id: 'clasp-resh-upgrade', name: 'שדרוג לחבק פרחים בצורת ר׳ לחופה', price: 900, hasFlowers: true },
  { id: 'top-crown-full', name: 'פס עליון כתר פרחים מלא ויוקרתי', price: 3000, hasFlowers: true },
  { id: 'chet-shape', name: 'צורת ח׳ פרחים לחופה', price: 12000, hasFlowers: true },
  { id: 'back-fabrics-2', name: 'תוספת 2 בדים אחוריים לחופה', price: 300, hasFlowers: false },
  { id: 'top-parochet', name: 'פרוכת עליונה לחופה', price: 500, hasFlowers: false },
  { id: 'composite-10-12', name: 'קומפוזיציה 10/12 בקבוקוני פרחים ונרות לשולחן אבירים', price: 300, hasFlowers: true },
  { id: 'composite-5-6', name: 'קומפוזיציה 5/6 בקבוקוני פרחים ונרות לשולחן רגיל', price: 180, hasFlowers: true },
  { id: 'sponge-round', name: 'סידור פרחים עגול בספוג', price: 180, hasFlowers: true },
  { id: 'sponge-medium', name: 'סידור פרחים בינוני בספוג', price: 300, hasFlowers: true },
  { id: 'deco-small', name: 'סידור פרחים קטן בכלי דקורטיבי', price: 280, hasFlowers: true },
  { id: 'deco-medium', name: 'סידור פרחים בינוני בכלי דקורטיבי', price: 400, hasFlowers: true },
  { id: 'deco-large', name: 'סידור פרחים גדול בכלי דקורטיבי', price: 600, hasFlowers: true },
  { id: 'deco-xl', name: 'סידור פרחים ענק בכלי דקורטיבי', price: 900, hasFlowers: true },
  { id: 'bamboo-chuppah', name: 'חופת במבוק בנויה', price: 1800, hasFlowers: false },
  { id: 'chuppah-stage', name: 'במה לחופה', price: 4500, hasFlowers: false },
  { id: 'knights-gyps-line', name: 'שולחן אבירים קו אמצע גיבסניות ונרות', price: 500, hasFlowers: true, unit: 'למטר' }
];

// --- פריטי תוספת לעמדות בר מתוק ---
const BAR_ADDONS: Addon[] = [
  { id: 'bar-balloon-arch', name: 'שער בלונים מסביב לשולחן הבר', price: 700, hasFlowers: false },
  { id: 'bar-balloon-columns', name: '2 עמודי בלונים בצידי הבר', price: 500, hasFlowers: false },
  { id: 'bar-name-sign', name: 'שלט קפה עם שם הילד/ה', price: 600, hasFlowers: false }
];

// --- טיפוסים ---
type Category = (typeof CATEGORIES)[keyof typeof CATEGORIES];

interface PackageDetails {
  chuppah?: string[];
  options?: string[];
  tables?: string[];
  bar?: string[];
  entrance?: string[];
  highlight?: string[];
  photoOp?: string[];
}

interface Package {
  id: string;
  category: Category;
  title: string;
  subtitle: string;
  price: number;
  description: string;
  benefits: string;
  details: PackageDetails;
  svgType: string;
  pricingTiers?: Record<number, number>;
}

interface ClientInfo {
  groomName: string;
  brideName: string;
  groomPhone: string;
  bridePhone: string;
  email: string;
  eventDate: string;
  eventLocation: string;
  notes: string;
  compositesCount: string;
  spongeCount: string;
}

interface Upgrade {
  id: string;
  description: string;
  price: number;
}

type CanvasPointerEvent =
  | React.MouseEvent<HTMLCanvasElement>
  | React.TouchEvent<HTMLCanvasElement>;

// --- סעיפי הפירוט המוצגים בכרטיס החבילה (סדר + תווית עברית) ---
const DETAIL_SECTIONS: { key: keyof PackageDetails; labelKey: string }[] = [
  { key: 'chuppah', labelKey: 'step2.detail.chuppah' },
  { key: 'options', labelKey: 'step2.detail.options' },
  { key: 'tables', labelKey: 'step2.detail.tables' },
  { key: 'bar', labelKey: 'step2.detail.bar' },
  { key: 'entrance', labelKey: 'step2.detail.entrance' },
  { key: 'highlight', labelKey: 'step2.detail.highlight' },
  { key: 'photoOp', labelKey: 'step2.detail.photoOp' }
];

// --- מאגר החבילות המלא ---
const PACKAGES: Package[] = [
  {
    id: 'classic-s',
    category: CATEGORIES.WEDDING,
    title: 'חבילת עיצוב חתונה - Classic S',
    subtitle: 'עיצוב חופה + 10 שולחנות מעוצבים',
    price: 2900,
    description: 'עיצוב קלאסי, אלגנטי ועל-זמני שמדבר את שפת הלב. שילוב מושלם של פרחים עשירים, נרות רכים ובדים זורמים, יוצרים אווירה רומנטית, יוקרתית וחגיגית שתשאיר אתכם ואת האורחים עם זיכרון בלתי נשכח.',
    benefits: 'הטבה בלעדית: ₪500 מתנה לשדרוג העיצוב!',
    details: {
      chuppah: [
        '2 בדים קדמיים יוקרתיים',
        '2 חבקי פרחים עשירים (צורת י׳) לעמודי החופה'
      ],
      tables: [
        'קומפוזיציה שילוב עשיר 5/6 פרחים ונרות בכל שולחן / סידור פרחים עגול בספוג'
      ]
    },
    svgType: 'chuppah-s'
  },
  {
    id: 'classic-m',
    category: CATEGORIES.WEDDING,
    title: 'חבילת עיצוב חתונה - Classic M',
    subtitle: 'עיצוב חופה + 20 שולחנות מעוצבים',
    price: 4600,
    description: 'חבילה מושלמת לחתונה גדולה ומרשימה. עיצוב עשיר והרמוני שממלא את החלל באווירה חגיגית, טבעית ומרהיבה. פרחים, אור ונרות משתלבים יחד ליצירת חוויה בלתי נשכחת שמשאירה חותם בלב של כל אורח.',
    benefits: 'הטבה בלעדית: ₪500 מתנה לשדרוג העיצוב!',
    details: {
      chuppah: [
        '2 בדים קדמיים יוקרתיים',
        '2 חבקי פרחים עשירים (צורת י׳) לעמודי החופה'
      ],
      tables: [
        'קומפוזיציה שילוב עשיר 5/6 פרחים ונרות בכל שולחן / סידור פרחים עגול בספוג'
      ]
    },
    svgType: 'chuppah-m'
  },
  {
    id: 'classic-l',
    category: CATEGORIES.WEDDING,
    title: 'חבילת עיצוב חתונה - Classic L',
    subtitle: 'עיצוב חופה + 30 שולחנות מעוצבים',
    price: 6300,
    description: 'עיצוב בלתי נשכח, שמייצר רגעים של וואו מהכניסה ועד רחבת הריקודים. שפע של פרחים, תאורה רכה ונרות מהפנטים משתלבים יחד ליצירת אירוע מרגש, יוקרתי ומלא בסטייל. כי מגיע לכם לחגוג בגדול – בדיוק כמו שחלמתם.',
    benefits: 'הטבה בלעדית: ₪500 מתנה לשדרוג העיצוב!',
    details: {
      chuppah: [
        '2 בדים קדמיים יוקרתיים',
        '2 חבקי פרחים עשירים (צורת י׳) לעמודי החופה'
      ],
      tables: [
        'קומפוזיציה שילוב עשיר 5/6 פרחים ונרות בכל שולחן / סידור פרחים עגול בספוג'
      ]
    },
    svgType: 'chuppah-l'
  },
  {
    id: 'gypsophila',
    category: CATEGORIES.WEDDING,
    title: 'עיצוב חתונה בגיבסניות - חופה + 40 שולחנות',
    subtitle: 'עיצוב קסום ורומנטי של גיבסניות עשירות ומלאות',
    price: 2900,
    description: 'עיצוב אלגנטי ועדין בגבסוניות רכות בגוונים שונים, בשילוב נרות רומנטיים ליצירת אווירה קסומה ומלאת רגש. כל פרט מעוצב בקפידה כדי להפוך את יום החתונה לחוויה בלתי נשכחת.',
    benefits: 'הטבה בלעדית: ₪500 מתנה לשדרוג העיצוב!',
    details: {
      chuppah: [
        '2 חבקי פרחים בצורת י׳ לעמודי החופה מגיבסניות',
        'בעיצוב של פחות מ-40 שולחנות, את הפרחים הנותרים נעצב בזרי קשירה לכסאות בשביל החופה'
      ],
      tables: [
        'קומפוזיציה שילוב עשיר של פרחי גיבסניות ונרות בכל שולחן / סידור פרחים עגול בספוג'
      ]
    },
    svgType: 'gypsophila'
  },
  {
    id: 'chuppah-drapes',
    category: CATEGORIES.WEDDING,
    title: 'חבילת עיצוב חופה - בדים נשפכים + שדרת חופה',
    subtitle: 'שדרה רומנטית מוארת וחופה מרהיבה',
    price: 2900,
    description: 'תנו לאהבה שלכם במה מושלמת. חופה מרהיבה עם בדים נשפכים, שדרת חופה רומנטית ומוארת, לעיצוב שיגרום לכל רגע להרגיש כמו חלום שמתגשם.',
    benefits: 'הטבה בלעדית: ₪500 מתנה לשדרוג העיצוב!',
    details: {
      chuppah: [
        '4 בדים קדמיים נשפכים ברמה גבוהה',
        '2 חבקי פרחים עשירים (צורת י׳) לעמודי החופה'
      ],
      options: [
        '6 חבקי פרחים קשורים לכסאות',
        'שטיח לשדרת החופה עם נרות בצילינדרים'
      ]
    },
    svgType: 'chuppah-drapes'
  },

  // --- חבילות חינה ---
  {
    id: 'henna-cookies',
    category: CATEGORIES.HENNA,
    title: 'חבילת בר עוגיות מרוקאיות מסורתי',
    subtitle: 'בר עוגיות עבודת יד בעיצוב מלכותי אותנטי (ל-150-200 מוזמנים)',
    price: 2900,
    description: 'חגיגה אותנטית של טעמים, ריחות וצבעים! כולל בר עשיר ומפואר של עוגיות מרוקאיות מובחרות ביותר בעבודת יד, כלי נחושת מלכותיים, מפות מעוצבות בהתאמה ונרות אווירה.',
    benefits: 'הטבה בלעדית: 2 זרי משי מרהיבים לעיצוב - מתנה ממני!',
    details: {
      bar: [
        'מכלול עשיר ומפואר של עוגיות מרוקאיות אותנטיות בעבודת יד — טריות, נימוחות וטעימות במיוחד',
        'שילוב מנצח של עוגיות צבעוניות מסורתיות לצד מבחר עוגיות פרימיום קלאסיות ומעוצבות',
        'עיצוב עשיר בכלי זהב ונחושת מלכותיים המתאימים בדיוק לאווירת החינה',
        'מפות מעוצבות בהתאמה אישית ונרות רומנטיים ליצירת אווירה קסומה'
      ]
    },
    svgType: 'henna'
  },
  {
    id: 'henna-market',
    category: CATEGORIES.HENNA,
    title: 'חבילת בר "שוק חינה" משולב',
    subtitle: 'בר עוגיות מסורתיות + שוק פיצוחים יוקרתי (ל-150-200 מוזמנים)',
    price: 4900,
    description: 'השדרוג המושלם שיהפוך למרכז האירוע! משלב את מגוון העוגיות המרוקאיות המשובחות לצד שוק פיצוחים מעוצב בשקי יוטה אותנטיים עם מגוון עשיר של פיצוחים איכותיים ופירות יבשים.',
    benefits: 'הטבה בלעדית: 2 זרי משי מרהיבים לעיצוב - מתנה ממני!',
    details: {
      bar: [
        'בר עוגיות מרוקאיות פרימיום בעבודת יד',
        'עמדת "שוק פיצוחים" מעוצבת בשקי יוטה עם שפע פיצוחים ופירות יבשים',
        'עיצוב אותנטי מלא הכולל כלי זהב מלכותיים, נרות אווירה ומפות ייחודיות'
      ]
    },
    svgType: 'henna'
  },

  // --- חבילות אירועים ומצווה ---
  {
    id: 'event-classic',
    category: CATEGORIES.EVENTS,
    title: 'חבילת "קלאסיק" לאירועים',
    subtitle: 'המראה הנקי, הרומנטי והאלגנטי ביותר',
    price: 2900,
    description: 'רוצים אירוע בעיצוב נקי, רומנטי ויוקרתי שיחמיא לאולם וייצור אווירה קלאסית ומזמינה? החבילה הזו מתמקדת בפרטים הקטנים שעושים את ההבדל הגדול, עם נגיעות של טבע ונרות אווירה.',
    benefits: 'כולל שלט כניסה מעוצב ומותאם אישית בשילוב שובל בלונים עדין או פרחים חיים!',
    details: {
      tables: ['קומפוזיציות מעוצבות של בקבוקוני פרחים חיים ורעננים בשילוב נרות / סידורי ספוג נמוכים ורומנטיים, בהתאמה לאופי השולחן'],
      entrance: ['שלט כניסה מעוצב ומותאם אישית שמקבל את פני האורחים בסטייל'],
      highlight: ['נגיעת סטייל: שובל בלונים עדין או תוספת פרחים חיים לבחירה']
    },
    svgType: 'event-classic',
    pricingTiers: { 10: 2900, 20: 4600, 30: 6300 }
  },
  {
    id: 'event-balloon',
    category: CATEGORIES.EVENTS,
    title: 'חבילת "בלון ארט" לאירועים',
    subtitle: 'המראה המודרני, החגיגי והצבעוני',
    price: 3200,
    description: 'לחגוג בענק ובצבע! אם אתם מחפשים אירוע תוסס, שמח ומלא באנרגיה, חבילת הבלונים שלנו תרים את האולם לגובה. עיצוב מודרני, יצירתי ובעל נוכחות מטורפת שאי אפשר להתעלם ממנה.',
    benefits: 'כולל שער בלונים חגיגי, עשיר ומעוצב בכניסה לאולם!',
    details: {
      tables: ['סידורי בלונים גבוהים, מרשימים ואומנותיים שיוצרים אפקט "וואו" מכל פינה באולם'],
      entrance: ['שלט כניסה מעוצב ומותאם אישית לבעלי השמחה'],
      highlight: ['שער בלונים חגיגי, עשיר ומעוצב בכניסה המוביל את האורחים פנימה']
    },
    svgType: 'event-balloon',
    pricingTiers: { 10: 3200, 20: 5200, 30: 7200 }
  },
  {
    id: 'event-vip',
    category: CATEGORIES.EVENTS,
    title: 'חבילת "הצגה" (VIP) - עמדת צילום יוקרה',
    subtitle: 'עיצוב שולחנות עשיר ועמדת צילום מטורפת',
    price: 4000,
    description: 'החבילה מיועדת למי שלא מוכן להתפשר על פחות ממושלם. אנחנו מייצרים עבורכם אירוע מהסרטים עם שואו עיצובי חסר תקדים, חומרי גלם עשירים, והדובדבן שבקצפת – עמדת צילום יוקרתית שתהפוך למרכז העניינים ותשאיר לאורחים שלכם מזכרת מטורפת.',
    benefits: 'עמדת צילום VIP מלאה עם קשת בלונים אמנותית, קיר רקע ואקססוריז!',
    details: {
      tables: ['לבחירתכם: קומפוזיציות עם פרחים חיים ונרות / סידורי בלונים גבוהים ומעוצבים'],
      entrance: ['שלט כניסה מותאם אישית בקו נקי, אלגנטי ויוקרתי'],
      photoOp: ['קשת בלונים אמנותית וענקית באולם, הכוללת קיר רקע, אקססוריז מעוצבים ונגיעות פרחים מעודנות — המקום שבו כולם יעמדו כדי להצטלם!']
    },
    svgType: 'event-vip',
    pricingTiers: { 10: 4000, 20: 6000, 30: 8000 }
  },

  // --- עמדות בר מתוק ---
  {
    id: 'bar-candy',
    category: CATEGORIES.BARS,
    title: 'בר חמצוצים וגומי צבעוני',
    subtitle: 'בר תוסס, שמח ועשיר לכל הגילאים',
    price: 2500,
    description: 'בר תוסס, שמח ועשיר בטירוף שמלא בכל סוגי הגומי האיכותיים, החמצוצים והמרשמלו. מעוצב בכלים דקורטיביים ובגבהים שונים, ומושך אליו את האורחים (מכל הגילאים!) לאורך כל הערב.',
    benefits: 'הטבה: למזמינים בר — 2 זרי משי יוקרתיים לעיצוב הבר במתנה!',
    details: {
      bar: [
        'מבחר עשיר של גומי איכותי, חמצוצים ומרשמלו',
        'הצגה בכלים דקורטיביים ובגבהים שונים',
        'עיצוב צבעוני ותוסס שמושך אורחים מכל הגילאים לאורך כל הערב'
      ]
    },
    svgType: 'bar'
  },
  {
    id: 'bar-branded',
    category: CATEGORIES.BARS,
    title: 'בר קונספט ממותג באריזות אישיות',
    subtitle: 'ה-טופ של הסטייל — בר שנתפר לקונספט שלכם',
    price: 3500,
    description: 'ה-טופ של הסטייל! בר שנתפר במיוחד לפי הקונספט והצבעים של האירוע שלכם. כל החטיפים, השוקולדים והממתקים מגיעים באריזות מעוצבות וממותגות עם השם שלכם או גרפיקה ייחודית. זה נראה מיליון דולר וכל אורח פשוט חייב לעצור ולצלם את זה.',
    benefits: 'הטבה: למזמינים בר — 2 זרי משי יוקרתיים לעיצוב הבר במתנה!',
    details: {
      bar: [
        'חטיפים, שוקולדים וממתקים באריזות מעוצבות וממותגות אישית',
        'מיתוג עם השם שלכם או גרפיקה ייחודית לאירוע',
        'כולל שלט קפה מעוצב עם שם החוגג/ת'
      ]
    },
    svgType: 'bar'
  },
  {
    id: 'bar-boutique',
    category: CATEGORIES.BARS,
    title: 'בר קינוחי בוטיק אקסקלוסיבי',
    subtitle: 'חוויה קולינרית מושלמת לחובבי המתוקים',
    price: 4500,
    description: 'חוויה קולינרית מושלמת לחובבי המתוקים. הבר כולל מגוון קינוחים בעבודת יד, בטעמים עשירים ומרקמים מושלמים, מחומרי גלם איכותיים ביותר ובתצוגה סופר אלגנטית ומוקפדת.',
    benefits: 'הטבה: למזמינים בר — 2 זרי משי יוקרתיים לעיצוב הבר במתנה!',
    details: {
      bar: [
        'מגוון קינוחי בוטיק בעבודת יד',
        'טעמים עשירים, מרקמים מושלמים וחומרי גלם איכותיים ביותר',
        'תצוגה סופר אלגנטית ומוקפדת'
      ]
    },
    svgType: 'bar'
  }
];

// --- פלטת צבעים ואלמנטים משותפים לאיורים (קו-ארט בסגנון הפלאיירים) ---
const ART = { gold: '#B29259', deep: '#8C6D3F', soft: '#D8C29A', cream: '#FAF7F2', sage: '#A7B58C' };

// ורד יחיד — עיגול עם סלסול ספירלה פנימי
function Rose({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <path d={`M${cx} ${cy} m ${-r * 0.45} 0 a ${r * 0.45} ${r * 0.45} 0 1 1 ${r * 0.9} 0`} fill="none" stroke={ART.deep} strokeWidth={Math.max(0.5, r * 0.18)} opacity="0.45" strokeLinecap="round" />
      <path d={`M${cx} ${cy} q ${r * 0.4} ${-r * 0.3} 0 ${-r * 0.6}`} fill="none" stroke={ART.deep} strokeWidth={Math.max(0.5, r * 0.16)} opacity="0.4" strokeLinecap="round" />
    </g>
  );
}

// עלה ירוק עדין
function Leaf({ cx, cy, rot, len = 9 }: { cx: number; cy: number; rot: number; len?: number }) {
  return (
    <path d={`M${cx} ${cy} q ${len * 0.5} ${-len * 0.45} ${len} 0 q ${-len * 0.5} ${len * 0.45} ${-len} 0 Z`} fill={ART.sage} opacity="0.7" transform={`rotate(${rot} ${cx} ${cy})`} />
  );
}

// זר / חבק פרחים עשיר: ורדים + עלים + עלווה נשפכת מטה
function Bouquet({ cx, cy, s = 1, accent = ART.gold }: { cx: number; cy: number; s?: number; accent?: string }) {
  const leaves: [number, number, number][] = [[-9, -3, -35], [9, -4, 35], [-8, 7, -70], [8, 8, 70], [0, -10, 0], [-3, 9, -115], [4, 9, 115]];
  const roses: [number, number, number, string][] = [[0, 0, 5, accent], [-6, -1, 3.6, ART.soft], [6, -2, 4, ART.soft], [-3, 5, 3.4, accent], [4, 5, 3.2, ART.soft], [0, -6, 3.4, accent], [-7, 4, 2.6, ART.soft], [7, 3, 2.8, accent]];
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d="M-2 6 q-4 12 -7 22" fill="none" stroke={ART.sage} strokeWidth="1" opacity="0.6" />
      <path d="M3 6 q3 13 6 24" fill="none" stroke={ART.sage} strokeWidth="1" opacity="0.6" />
      <path d="M0 7 q0 14 0 26" fill="none" stroke={ART.sage} strokeWidth="0.9" opacity="0.5" />
      {leaves.map(([lx, ly, r], i) => <Leaf key={`l${i}`} cx={lx} cy={ly} rot={r} />)}
      {roses.map(([rx, ry, rr, f], i) => <Rose key={`r${i}`} cx={rx} cy={ry} r={rr} fill={f} />)}
    </g>
  );
}

// אשכול גיבסניות — נקודות עדינות
function Gyps({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  const dots = Array.from({ length: 24 }).map((_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const rad = 3.5 + (i % 4) * 2.6;
    return [Math.cos(a) * rad, Math.sin(a) * rad * 0.92, i % 3 === 0 ? 1.9 : 1.2] as const;
  });
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d="M-2 4 q-3 12 -5 22" fill="none" stroke={ART.sage} strokeWidth="0.9" opacity="0.5" />
      <path d="M3 4 q2 12 4 22" fill="none" stroke={ART.sage} strokeWidth="0.9" opacity="0.5" />
      {dots.map(([dx, dy, r], i) => <circle key={i} cx={dx} cy={dy} r={r} fill={i % 2 ? ART.gold : ART.soft} opacity="0.9" />)}
    </g>
  );
}

// נר עמוד עם להבה
function PillarCandle({ x, base, h, w = 7 }: { x: number; base: number; h: number; w?: number }) {
  return (
    <g>
      <rect x={x - w / 2} y={base - h} width={w} height={h} rx="2" fill={ART.cream} stroke={ART.soft} />
      <ellipse cx={x} cy={base - h} rx={w / 2} ry="1.6" fill={ART.soft} opacity="0.6" />
      <line x1={x} y1={base - h} x2={x} y2={base - h - 3} stroke={ART.deep} strokeWidth="0.8" />
      <path d={`M${x} ${base - h - 3} q 3 -3 0 -7 q -3 4 0 7`} fill={ART.gold} />
    </g>
  );
}

// --- איורים וקטוריים לכל סוג חבילה (קו-ארט נאמן לפלאיירים) ---
function renderPackageSVG(type: string) {
  const { gold, soft, cream } = ART;

  // מסגרת חופה משותפת: עמודים, קורה עליונה ורצפה
  const chuppahFrame = (children: React.ReactNode) => (
    <svg width="100%" height="104" viewBox="0 0 200 108" aria-hidden="true" focusable="false">
      <path d="M40 26 Q100 18 160 26" stroke={gold} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <rect x="44" y="25" width="4.5" height="72" rx="2" fill={gold} />
      <rect x="151.5" y="25" width="4.5" height="72" rx="2" fill={gold} />
      {children}
      <line x1="22" y1="98" x2="178" y2="98" stroke={gold} strokeWidth="1.6" opacity="0.4" />
    </svg>
  );

  // איור חופה קלאסית: 2 בדים נשפכים בצדדים + תליית בד עליונה + 2 זרי ורדים
  const chuppahCurtains = (withDrapes: boolean) =>
    chuppahFrame(
      <>
        {withDrapes && (
          <g opacity="0.6" fill={soft} stroke={gold} strokeOpacity="0.35" strokeWidth="0.6">
            {/* תליית בד מרכזית (swag) */}
            <path d="M50 28 Q100 60 150 28 Q138 44 100 50 Q62 44 50 28 Z" />
            {/* פאנל בד שמאל */}
            <path d="M52 28 Q44 64 54 95 Q60 70 60 30 Z" />
            {/* פאנל בד ימין */}
            <path d="M148 28 Q156 64 146 95 Q140 70 140 30 Z" />
          </g>
        )}
        <Bouquet cx={52} cy={34} s={1.15} />
        <Bouquet cx={148} cy={34} s={1.15} />
      </>
    );

  // איור חופת בדים נשפכים: תליית בד רחבה + 4 בדים זורמים + 2 זרים גדולים
  const chuppahDrapes = () =>
    chuppahFrame(
      <>
        <g opacity="0.6" fill={soft} stroke={gold} strokeOpacity="0.35" strokeWidth="0.6">
          {/* תליית בד רחבה */}
          <path d="M48 28 Q100 66 152 28 Q138 48 100 56 Q62 48 48 28 Z" />
          {/* 4 בדים נשפכים */}
          <path d="M52 28 Q44 66 54 95 Q60 72 60 30 Z" />
          <path d="M74 30 Q70 64 78 95 Q84 70 82 32 Z" />
          <path d="M126 30 Q130 64 122 95 Q116 70 118 32 Z" />
          <path d="M148 28 Q156 66 146 95 Q140 72 140 30 Z" />
        </g>
        <Bouquet cx={52} cy={34} s={1.3} />
        <Bouquet cx={148} cy={34} s={1.3} />
      </>
    );

  // איור בר חינה מרוקאי: מגדל עוגיות תלת-קומתי + קומקום נחושת + כוסות + נרות
  const henna = () => (
    <svg width="100%" height="104" viewBox="0 0 200 108" aria-hidden="true" focusable="false">
      {/* מגדל עוגיות */}
      <ellipse cx="66" cy="84" rx="34" ry="7" fill={soft} stroke={gold} />
      {[44, 55, 66, 77, 88].map((cx, i) => <circle key={`c1${i}`} cx={cx} cy={81} r="3.4" fill={gold} opacity="0.85" />)}
      <rect x="64" y="58" width="4" height="24" fill={gold} />
      <ellipse cx="66" cy="58" rx="22" ry="5" fill={soft} stroke={gold} />
      {[52, 60, 66, 72, 80].map((cx, i) => <circle key={`c2${i}`} cx={cx} cy={55} r="3" fill={gold} opacity="0.85" />)}
      <rect x="64.5" y="42" width="3" height="16" fill={gold} />
      <ellipse cx="66" cy="42" rx="11" ry="3.4" fill={soft} stroke={gold} />
      {[60, 66, 72].map((cx, i) => <circle key={`c3${i}`} cx={cx} cy={39.5} r="2.6" fill={gold} opacity="0.85" />)}
      <circle cx="66" cy="34" r="2.2" fill={gold} />
      {/* קומקום מרוקאי */}
      <ellipse cx="142" cy="86" rx="20" ry="3.6" fill={cream} stroke={soft} />
      <path d="M130 80 Q127 60 142 58 Q157 60 154 80 Z" fill={gold} opacity="0.9" />
      <path d="M133 58 L151 58 L142 47 Z" fill={gold} />
      <circle cx="142" cy="45" r="2.4" fill={ART.deep} />
      <path d="M154 64 Q167 60 164 82" fill="none" stroke={gold} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M130 66 Q120 68 124 80" fill="none" stroke={gold} strokeWidth="2.4" strokeLinecap="round" />
      {/* כוסות תה */}
      {[120, 170].map((x, i) => (
        <path key={`tg${i}`} d={`M${x - 4} 76 L${x - 3} 86 L${x + 3} 86 L${x + 4} 76 Z`} fill={soft} stroke={gold} strokeWidth="0.6" />
      ))}
      {/* נרות אווירה */}
      <PillarCandle x={107} base={86} h={18} w={6} />
      <PillarCandle x={24} base={86} h={12} w={6} />
    </svg>
  );

  // איור חצי-קשת בלונים (שימוש חוזר לבלון ארט ול-VIP)
  const balloonArch = (cxBase: number, yBase: number, radiusX: number, radiusY: number, count: number, prefix: string) =>
    Array.from({ length: count }).map((_, i) => {
      const angle = Math.PI * (i / (count - 1)); // 0..PI => קשת מלאה
      return (
        <circle
          key={`${prefix}-${i}`}
          cx={cxBase - Math.cos(angle) * radiusX}
          cy={yBase - Math.sin(angle) * radiusY}
          r={5 + (i % 3)}
          fill={i % 2 ? gold : soft}
          opacity="0.9"
        />
      );
    });

  // איור "קלאסיק" לאירועים: 2 אגרטלים עם זרי ורדים + צילינדר נר צף במרכז
  const eventClassic = () => (
    <svg width="100%" height="104" viewBox="0 0 200 108" aria-hidden="true" focusable="false">
      {/* צילינדר נר צף מרכזי */}
      <rect x="93" y="52" width="15" height="38" rx="2" fill={cream} stroke={soft} />
      <ellipse cx="100.5" cy="52" rx="7.5" ry="2.4" fill="none" stroke={soft} />
      <rect x="97.5" y="66" width="6" height="10" rx="1.5" fill={soft} />
      <path d="M100.5 62 q3 3 0 7 q-3 -3 0 -7" fill={gold} />
      {/* 2 אגרטלים עם זרי ורדים */}
      {[58, 143].map((x, i) => (
        <g key={`vz${i}`}>
          <Bouquet cx={x} cy={46} s={0.9} />
          <path d={`M${x - 6} 62 Q${x - 7} 82 ${x - 3} 88 L${x + 3} 88 Q${x + 7} 82 ${x + 6} 62 Z`} fill={cream} stroke={soft} />
        </g>
      ))}
      <line x1="24" y1="92" x2="176" y2="92" stroke={gold} strokeWidth="1.6" opacity="0.4" />
    </svg>
  );

  // איור "בלון ארט": שער בלונים חגיגי
  const eventBalloon = () => (
    <svg width="100%" height="104" viewBox="0 0 200 108" aria-hidden="true" focusable="false">
      {balloonArch(100, 92, 66, 64, 13, 'arch')}
      <line x1="34" y1="92" x2="166" y2="92" stroke={gold} strokeWidth="1.6" opacity="0.4" />
    </svg>
  );

  // איור "הצגה" (VIP): עמדת צילום — קיר רקע מוקף בקשת בלונים
  const eventVip = () => (
    <svg width="100%" height="104" viewBox="0 0 200 108" aria-hidden="true" focusable="false">
      <rect x="72" y="34" width="56" height="50" rx="6" fill={cream} stroke={gold} strokeWidth="1.5" />
      <circle cx="100" cy="56" r="10" fill="none" stroke={soft} strokeWidth="1.5" />
      {balloonArch(100, 88, 72, 66, 11, 'vip')}
      <line x1="28" y1="88" x2="172" y2="88" stroke={gold} strokeWidth="1.6" opacity="0.4" />
    </svg>
  );

  // איור חופת גיבסניות: בד עדין בצדדים + 2 אשכולות גיבסניות
  const gypsophila = () =>
    chuppahFrame(
      <>
        <g opacity="0.5" fill={soft} stroke={gold} strokeOpacity="0.3" strokeWidth="0.5">
          <path d="M52 28 Q46 64 56 95 Q60 70 60 30 Z" />
          <path d="M148 28 Q154 64 144 95 Q140 70 140 30 Z" />
        </g>
        <Gyps cx={52} cy={36} s={1.15} />
        <Gyps cx={148} cy={36} s={1.15} />
      </>
    );

  // איור עמדת בר מתוק: שולחן + 2 צנצנות ממתקים + מגדל קינוחים + זר משי
  const bar = () => (
    <svg width="100%" height="104" viewBox="0 0 200 108" aria-hidden="true" focusable="false">
      {/* שולחן הבר */}
      <rect x="18" y="86" width="164" height="8" rx="2" fill={soft} stroke={gold} strokeWidth="0.6" />
      {/* 2 צנצנות ממתקים (אפותקרי) */}
      {[40, 62].map((x, i) => (
        <g key={`jar${i}`}>
          <path d={`M${x - 9} 60 Q${x - 10} 85 ${x} 85 Q${x + 10} 85 ${x + 9} 60 Z`} fill={cream} stroke={gold} strokeWidth="0.8" />
          <ellipse cx={x} cy={60} rx="9" ry="2.6" fill={soft} stroke={gold} strokeWidth="0.6" />
          <circle cx={x} cy={55} r="2.4" fill={gold} />
          {[[-4, 73], [3, 71], [-1, 78], [5, 78], [-5, 68], [2, 65]].map(([dx, dy], k) => (
            <circle key={k} cx={x + dx} cy={dy} r="2.3" fill={k % 2 ? gold : soft} opacity="0.9" />
          ))}
        </g>
      ))}
      {/* מגדל קינוחים דו-קומתי */}
      <ellipse cx="108" cy="85" rx="22" ry="4" fill={soft} stroke={gold} strokeWidth="0.6" />
      {[97, 105, 113, 119].map((cx, k) => <circle key={`d1${k}`} cx={cx} cy={81} r="2.6" fill={k % 2 ? gold : soft} />)}
      <rect x="106" y="64" width="4" height="19" fill={gold} />
      <ellipse cx="108" cy="64" rx="14" ry="3.4" fill={soft} stroke={gold} strokeWidth="0.6" />
      {[101, 108, 115].map((cx, k) => <circle key={`d2${k}`} cx={cx} cy={60.5} r="2.6" fill={k % 2 ? gold : soft} />)}
      {/* זר משי לעיצוב הבר */}
      <Bouquet cx={160} cy={64} s={0.8} />
      <path d="M154 78 Q153 85 156 86 L164 86 Q167 85 166 78 Z" fill={cream} stroke={soft} />
    </svg>
  );

  switch (type) {
    case 'chuppah-s':
    case 'chuppah-m':
    case 'chuppah-l':
      return chuppahCurtains(true);
    case 'chuppah-drapes':
      return chuppahDrapes();
    case 'gypsophila':
      return gypsophila();
    case 'henna':
      return henna();
    case 'event-classic':
      return eventClassic();
    case 'event-balloon':
      return eventBalloon();
    case 'event-vip':
      return eventVip();
    case 'event':
      return eventClassic();
    case 'bar':
      return bar();
    default:
      return (
        <div className="flex items-center justify-center h-[92px]">
          <Sparkles className="w-8 h-8 text-[#B29259]" />
        </div>
      );
  }
}

// איור בחירת עיצוב שולחן: קומפוזיציה (3 בקבוקוני פרחים + 2 נרות צפים) / סידור עגול בספוג
function renderTableChoiceSVG() {
  const gold = '#B29259';
  const soft = '#D8C29A';
  const cream = '#FAF7F2';
  return (
    <svg width="100%" height="104" viewBox="0 0 240 104" aria-hidden="true" focusable="false">
      {/* קומפוזיציה: 3 בקבוקוני פרחים */}
      {[30, 48, 66].map((x, i) => {
        const top = i === 1 ? 22 : 30;
        return (
          <g key={`b${i}`}>
            <line x1={x} y1={top} x2={x} y2={62} stroke={soft} strokeWidth="1.5" />
            <circle cx={x} cy={top} r="4.5" fill={gold} opacity="0.9" />
            <circle cx={x - 4} cy={top + 4} r="2.6" fill={soft} />
            <circle cx={x + 4} cy={top + 4} r="2.6" fill={soft} />
            <rect x={x - 3} y={62} width="6" height="16" rx="2" fill={cream} stroke={soft} />
          </g>
        );
      })}
      {/* 2 נרות צפים */}
      {[18, 80].map((x, i) => (
        <g key={`c${i}`}>
          <ellipse cx={x} cy={84} rx="9" ry="3.5" fill="none" stroke={gold} strokeWidth="1" opacity="0.5" />
          <rect x={x - 3} y={76} width="6" height="8" rx="1.5" fill={soft} />
          <path d={`M${x} 70 q3 3 0 6 q-3 -3 0 -6`} fill={gold} />
        </g>
      ))}
      {/* קו סלש לבחירה (זה או זה) */}
      <line x1="116" y1="20" x2="130" y2="86" stroke={gold} strokeWidth="3" strokeLinecap="round" />
      {/* סידור עגול בספוג */}
      <g>
        <path d="M150 60 Q186 26 222 60 Z" fill={soft} opacity="0.55" />
        {[[164, 50], [186, 42], [208, 50], [158, 56], [186, 50], [214, 56], [172, 46], [200, 46]].map(([x, y], i) => (
          <circle key={`s${i}`} cx={x} cy={y} r="4.5" fill={gold} opacity="0.9" />
        ))}
        <ellipse cx="186" cy="62" rx="38" ry="8" fill={cream} stroke={soft} />
      </g>
    </svg>
  );
}

export default function App() {
  const { t, tList, lang, dir, setLang } = useI18n();

  // טקסט חבילה בשפה הנוכחית (עברית מהנתונים, אנגלית ממודול התוכן)
  const L = (pkg: Package) =>
    lang === 'en' && PACKAGE_EN[pkg.id]
      ? PACKAGE_EN[pkg.id]
      : {
          title: pkg.title,
          subtitle: pkg.subtitle,
          description: pkg.description,
          benefits: pkg.benefits,
          details: pkg.details
        };

  const [currentStep, setCurrentStep] = useState(1);
  const [activeCategory, setActiveCategory] = useState<Category>(CATEGORIES.WEDDING);

  // פרטי לקוח (דרישות טלפון חתן וטלפון כלה כחובה)
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    groomName: '',
    brideName: '',
    groomPhone: '',
    bridePhone: '',
    email: '',
    eventDate: '',
    eventLocation: '',
    notes: '',
    compositesCount: '',
    spongeCount: ''
  });

  // מצב הזמנה: לקוח פרטי / מנהל (בעל העסק יוצר עבור לקוח)
  const [orderMode, setOrderMode] = useState<'client' | 'admin'>('client');
  const isAdmin = orderMode === 'admin';
  const [adminInfo, setAdminInfo] = useState({
    source: '',
    receivedBy: '',
    status: 'draft',
    internalNotes: '',
    manualDiscount: '',
    manualTotal: ''
  });

  // חבילות נבחרות (ניתן לבחור יותר מחבילה אחת, גם בין קטגוריות)
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>(['classic-s']);
  const [selectedTableTier, setSelectedTableTier] = useState(10);
  const [packagesError, setPackagesError] = useState(false);

  // תוספות והובלה (הובלה כבויה כברירת מחדל — חובה לאשר ידנית)
  const [includeDelivery, setIncludeDelivery] = useState(false);
  const [customUpgrades, setCustomUpgrades] = useState<Upgrade[]>([]); // [{ id, description, price }]
  const [newUpgradeDesc, setNewUpgradeDesc] = useState('');
  const [newUpgradePrice, setNewUpgradePrice] = useState('');

  // קוד קופון להטבת ₪500 לשדרוג העיצוב
  const [couponCode, setCouponCode] = useState('');

  // פריטי תוספת שנבחרו (id → כמות) והפריט שעליו ממומשת הטבת ה-₪500
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
  const [giftAddonId, setGiftAddonId] = useState('');

  // שגיאות תקינות
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSignatureError, setShowSignatureError] = useState(false);
  const [showDeliveryError, setShowDeliveryError] = useState(false);

  // אישור תקנון/פרטיות + מודאל מסמכים משפטיים
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [legalModal, setLegalModal] = useState<null | 'privacy' | 'terms' | 'accessibility'>(null);

  // מצב שליחה/שמירה
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // חתימות דיגיטליות (חתן וכלה בנפרד + תאריכים)
  const [isGroomSigned, setIsGroomSigned] = useState(false);
  const [isBrideSigned, setIsBrideSigned] = useState(false);
  const [groomSignDate, setGroomSignDate] = useState(new Date().toISOString().split('T')[0]);
  const [brideSignDate, setBrideSignDate] = useState(new Date().toISOString().split('T')[0]);

  const groomCanvasRef = useRef<HTMLCanvasElement>(null);
  const brideCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isGroomDrawing, setIsGroomDrawing] = useState(false);
  const [isBrideDrawing, setIsBrideDrawing] = useState(false);

  const selectedPackages = PACKAGES.filter(p => selectedPackageIds.includes(p.id));

  const hasWeddingPackage = selectedPackages.some(p => p.category === CATEGORIES.WEDDING);
  const hasBarPackage = selectedPackages.some(p => p.category === CATEGORIES.BARS);

  // מחיר חבילה בודדת (כולל מדרגת שולחנות אם קיימת לחבילה)
  const packagePrice = (pkg: Package) =>
    pkg.pricingTiers && pkg.pricingTiers[selectedTableTier]
      ? pkg.pricingTiers[selectedTableTier]
      : pkg.price;

  // החלפת בחירת חבילה (הוספה/הסרה) — מאפשר ריבוי חבילות
  const togglePackage = (pkg: Package) => {
    setPackagesError(false);
    setSelectedPackageIds(prev =>
      prev.includes(pkg.id) ? prev.filter(id => id !== pkg.id) : [...prev, pkg.id]
    );
    if (pkg.pricingTiers && !pkg.pricingTiers[selectedTableTier]) {
      setSelectedTableTier(10);
    }
  };

  // קטלוג התוספות הרלוונטי לפי החבילות שנבחרו
  const activeAddons: Addon[] = [
    ...(hasWeddingPackage ? WEDDING_ADDONS : []),
    ...(hasBarPackage ? BAR_ADDONS : [])
  ];

  // פריטי התוספת שנבחרו (כמות > 0) והסכום שלהם
  const selectedAddons = activeAddons
    .map(a => ({ ...a, qty: addonQty[a.id] || 0 }))
    .filter(a => a.qty > 0);
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price * a.qty, 0);

  // פריטים שזכאים להטבת ה-₪500: נבחרו ואינם כוללים פרחים
  const giftEligibleAddons = selectedAddons.filter(a => !a.hasFlowers);

  // האם אחת מהחבילות שנבחרו זכאית להטבת ₪500, והאם הוזן קוד תקין
  const isCouponEligible = selectedPackages.some(p => p.benefits.includes('₪500'));
  const isCouponValid = isCouponEligible && couponCode.trim() === COUPON_CODE;

  // הפריט שעליו ממומשת ההטבה (חייב להיות זכאי) וההנחה בפועל (עד ₪500, לא יותר משווי הפריט)
  const giftAddon = giftEligibleAddons.find(a => a.id === giftAddonId);
  const couponDiscount = isCouponValid && giftAddon
    ? Math.min(COUPON_VALUE, giftAddon.price * giftAddon.qty)
    : 0;

  // חישוב מחירים
  const getPricing = () => {
    const basePrice = selectedPackages.reduce((sum, p) => sum + packagePrice(p), 0);
    const upgradesTotal = customUpgrades.reduce((sum, item) => sum + (item.price || 0), 0);
    const adminDiscount = isAdmin ? parseFloat(adminInfo.manualDiscount) || 0 : 0;
    const manualTotal =
      isAdmin && adminInfo.manualTotal.trim() !== '' ? parseFloat(adminInfo.manualTotal) || 0 : null;
    return calcPricing({
      basePrice,
      upgradesTotal,
      addonsTotal,
      includeDelivery,
      couponDiscount,
      adminDiscount,
      manualTotal
    });
  };

  const pricing = getPricing();

  // סגירת המודאל המשפטי במקש Esc (נגישות)
  useEffect(() => {
    if (!legalModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLegalModal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [legalModal]);

  // הוספת שדרוג חופשי ידני
  const handleAddUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpgradeDesc.trim() || !newUpgradePrice) return;

    const newUpgrade: Upgrade = {
      id: Date.now().toString(),
      description: newUpgradeDesc,
      price: parseFloat(newUpgradePrice) || 0
    };

    setCustomUpgrades([...customUpgrades, newUpgrade]);
    setNewUpgradeDesc('');
    setNewUpgradePrice('');
  };

  const handleRemoveUpgrade = (id: string) => {
    setCustomUpgrades(customUpgrades.filter(item => item.id !== id));
  };

  // עדכון כמות של פריט תוספת מהקטלוג
  const updateAddonQty = (id: string, value: string) => {
    const n = Math.max(0, Math.floor(Number(value) || 0));
    setAddonQty(prev => ({ ...prev, [id]: n }));
  };

  // תיאור פריט תוספת לשורת הזמנה (כולל כמות/יחידה)
  const addonLineDescription = (a: Addon & { qty: number }) => {
    const name = localizedAddonName(a.id, a.name, lang);
    const unit = localizedUnit(a.unit, lang);
    return unit
      ? `${name} — ${a.qty} ${unit}`
      : a.qty > 1
        ? `${name} × ${a.qty}`
        : name;
  };

  // בדיקת תקינות טופס שלב 1 (עם 2 מספרי טלפון חובה)
  const validateStep = (step: number) => {
    const tempErrors: Record<string, string> = {};
    if (step === 1) {
      const groomNameTrimmed = clientInfo.groomName.trim();
      if (!groomNameTrimmed) tempErrors.groomName = t('errors.groomNameRequired');
      else if (groomNameTrimmed.split(/\s+/).length < 2) tempErrors.groomName = t('errors.groomNameFull');

      const brideNameTrimmed = clientInfo.brideName.trim();
      if (!brideNameTrimmed) tempErrors.brideName = t('errors.brideNameRequired');
      else if (brideNameTrimmed.split(/\s+/).length < 2) tempErrors.brideName = t('errors.brideNameFull');
      if (!clientInfo.groomPhone.trim()) tempErrors.groomPhone = t('errors.groomPhoneRequired');
      if (!clientInfo.bridePhone.trim()) tempErrors.bridePhone = t('errors.bridePhoneRequired');
      if (!clientInfo.eventDate) tempErrors.eventDate = t('errors.eventDateRequired');
      if (!clientInfo.eventLocation.trim()) tempErrors.eventLocation = t('errors.eventLocationRequired');
      if (!isAdmin && !clientInfo.email.trim()) tempErrors.email = t('errors.emailRequired');
      else if (clientInfo.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientInfo.email)) tempErrors.email = t('errors.emailInvalid');
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 2 && selectedPackageIds.length === 0) {
      setPackagesError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // אישור — שומר ב-Supabase, מפעיל שליחת מיילים, ואז מדפיס
  const handleConfirm = async () => {
    if (!includeDelivery) {
      setShowDeliveryError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!termsAccepted) {
      setShowTermsError(true);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }
    if (!isGroomSigned || !isBrideSigned) {
      setShowSignatureError(true);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }
    setShowSignatureError(false);
    setSubmitError(null);

    // אם Supabase לא הוגדר עדיין — מדפיסים בלי לשמור (כדי שהאפליקציה תעבוד בינתיים)
    if (!isSupabaseConfigured) {
      window.print();
      return;
    }

    const groomSignatureDataUrl = groomCanvasRef.current?.toDataURL('image/png') ?? '';
    const brideSignatureDataUrl = brideCanvasRef.current?.toDataURL('image/png') ?? '';

    setIsSubmitting(true);
    try {
      await submitOrder(
        {
          groomName: clientInfo.groomName,
          brideName: clientInfo.brideName,
          groomPhone: clientInfo.groomPhone,
          bridePhone: clientInfo.bridePhone,
          email: clientInfo.email,
          eventDate: clientInfo.eventDate,
          eventLocation: clientInfo.eventLocation,
          packageId: selectedPackageIds.join(','),
          packageTitle: selectedPackages.map(p => p.title).join(' + '),
          tableTier: selectedPackages.some(p => p.pricingTiers) ? selectedTableTier : null,
          compositesCount: clientInfo.compositesCount,
          spongeCount: clientInfo.spongeCount,
          includeDelivery,
          upgrades: [
            ...customUpgrades.map(u => ({ description: u.description, price: u.price })),
            ...selectedAddons.map(a => ({ description: addonLineDescription(a), price: a.price * a.qty }))
          ],
          basePrice: pricing.basePrice,
          upgradesTotal: pricing.upgradesTotal + pricing.addonsTotal,
          deliveryPrice: pricing.deliveryPrice,
          couponCode: isCouponValid ? couponCode.trim() : '',
          couponDiscount: pricing.couponDiscount,
          totalPrice: pricing.totalPrice,
          groomSignDate,
          brideSignDate
        },
        groomSignatureDataUrl,
        brideSignatureDataUrl
      );
      window.print();
    } catch (err) {
      console.error('שמירת ההזמנה נכשלה:', err);
      setSubmitError(t('errors.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // אתחול קנבסים לחתימה דיגיטלית (חתן וכלה)
  useEffect(() => {
    if (currentStep === 3) {
      setTimeout(() => {
        const groom = groomCanvasRef.current;
        if (groom) {
          const ctx = groom.getContext('2d');
          if (ctx) {
            ctx.strokeStyle = '#1F2937';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
          }
        }
        const bride = brideCanvasRef.current;
        if (bride) {
          const ctx = bride.getContext('2d');
          if (ctx) {
            ctx.strokeStyle = '#1F2937';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
          }
        }
      }, 120);
    }
  }, [currentStep]);

  // לוגיקת חתימה חתן
  const startGroomDrawing = (e: CanvasPointerEvent) => {
    const canvas = groomCanvasRef.current;
    if (!canvas) return;
    setIsGroomDrawing(true);
    setShowSignatureError(false);
    const pos = getEventPos(e, canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const drawGroom = (e: CanvasPointerEvent) => {
    const canvas = groomCanvasRef.current;
    if (!isGroomDrawing || !canvas) return;
    e.preventDefault();
    const pos = getEventPos(e, canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setIsGroomSigned(true);
  };

  const stopGroomDrawing = () => {
    setIsGroomDrawing(false);
  };

  const clearGroomSignature = () => {
    const canvas = groomCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsGroomSigned(false);
  };

  // לוגיקת חתימה כלה
  const startBrideDrawing = (e: CanvasPointerEvent) => {
    const canvas = brideCanvasRef.current;
    if (!canvas) return;
    setIsBrideDrawing(true);
    setShowSignatureError(false);
    const pos = getEventPos(e, canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const drawBride = (e: CanvasPointerEvent) => {
    const canvas = brideCanvasRef.current;
    if (!isBrideDrawing || !canvas) return;
    e.preventDefault();
    const pos = getEventPos(e, canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setIsBrideSigned(true);
  };

  const stopBrideDrawing = () => {
    setIsBrideDrawing(false);
  };

  const clearBrideSignature = () => {
    const canvas = brideCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsBrideSigned(false);
  };

  const getEventPos = (e: CanvasPointerEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-gray-800 font-sans antialiased pb-12 selection:bg-[#B29259] selection:text-white animate-fadeIn" dir={dir}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:start-2 focus:bg-[#B29259] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-bold"
      >
        {t('a11y.skip')}
      </a>

      {/* --- לוגו וכותרת ראשית --- */}
      <header className="bg-white border-b border-[#EAE3D2] shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#B29259] text-white p-2 rounded-full shadow-md">
              <Sparkles className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <div className="text-start">
              <h1 className="text-xl sm:text-2xl font-bold text-[#8C6D3F] font-serif tracking-wide">LD Event Design</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{t('brand.tagline')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* מתג שפה */}
            <div className="flex items-center bg-[#FAF7F2] rounded-full border border-[#EAE3D2] p-0.5" role="group" aria-label={t('lang.switch')}>
              <button
                type="button"
                onClick={() => setLang('he')}
                aria-pressed={lang === 'he'}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${lang === 'he' ? 'bg-[#B29259] text-white' : 'text-gray-500 hover:text-[#B29259]'}`}
              >
                עברית
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${lang === 'en' ? 'bg-[#B29259] text-white' : 'text-gray-500 hover:text-[#B29259]'}`}
              >
                EN
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 bg-[#FAF7F2] py-1.5 px-3 rounded-full border border-[#EAE3D2]">
              <Phone className="w-4 h-4 text-[#B29259]" aria-hidden="true" />
              <span className="font-bold" dir="ltr">{t('brand.phone')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* --- מד התקדמות השלבים --- */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EAE3D2] mb-6">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-100 z-0"></div>
            <div
              className="absolute start-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#B29259] transition-all duration-300 z-0"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            ></div>

            {[
              { step: 1, label: t('steps.s1') },
              { step: 2, label: t('steps.s2') },
              { step: 3, label: t('steps.s3') }
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center z-10 relative" aria-current={currentStep === item.step ? 'step' : undefined}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  currentStep >= item.step
                    ? 'bg-[#B29259] text-white ring-4 ring-[#FAF7F2] shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-400'
                }`}>
                  {currentStep > item.step ? <Check className="w-4 h-4" aria-hidden="true" /> : item.step}
                </div>
                <span className={`text-[10px] sm:text-xs mt-1.5 font-bold ${
                  currentStep >= item.step ? 'text-gray-800' : 'text-gray-400'
                }`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- תוכן האפליקציה לפי שלבים --- */}
      <main id="main" tabIndex={-1} className="max-w-4xl mx-auto px-4 outline-none">

        {/* ================= שלב 1: פרטי החתן, הכלה והאירוע (עם 2 טלפונים חובה) ================= */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#EAE3D2] space-y-6 animate-fadeIn">
            {/* בחירת סוג מזמין: לקוח פרטי / מנהל */}
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">{t('orderType.title')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label={t('orderType.title')}>
                {([
                  { mode: 'client' as const, icon: <User className="w-4 h-4" aria-hidden="true" />, title: t('orderType.client'), desc: t('orderType.clientDesc') },
                  { mode: 'admin' as const, icon: <Users className="w-4 h-4" aria-hidden="true" />, title: t('orderType.admin'), desc: t('orderType.adminDesc') }
                ]).map((opt) => (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => setOrderMode(opt.mode)}
                    aria-pressed={orderMode === opt.mode}
                    className={`text-start p-3 rounded-xl border flex items-start gap-2.5 transition-all ${
                      orderMode === opt.mode ? 'border-[#B29259] bg-[#FAF7F2] ring-1 ring-[#B29259]/20' : 'border-gray-200 hover:border-[#B29259]/50'
                    }`}
                  >
                    <span className={`mt-0.5 ${orderMode === opt.mode ? 'text-[#B29259]' : 'text-gray-400'}`}>{opt.icon}</span>
                    <span>
                      <span className="block text-sm font-bold text-gray-800">{opt.title}</span>
                      <span className="block text-[11px] text-gray-500">{opt.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-[#8C6D3F] flex items-center gap-2">
                <Users className="w-5.5 h-5.5 text-[#B29259]" aria-hidden="true" />
                {t('step1.heading')}
              </h2>
              <p className="text-xs text-gray-500 mt-1">{t('step1.sub')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* שם בעל האירוע */}
              <div>
                <label htmlFor="f-groomName" className="block text-xs font-bold text-gray-700 mb-1.5">{t('step1.groomName')}</label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="f-groomName"
                    type="text"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.groomName}
                    value={clientInfo.groomName}
                    onChange={(e) => setClientInfo({ ...clientInfo, groomName: e.target.value })}
                    placeholder={t('step1.groomNamePh')}
                    className={`w-full ps-9 pe-3 py-2.5 bg-[#FAF7F2] border ${errors.groomName ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all`}
                  />
                </div>
                {errors.groomName && <p className="text-[10px] text-red-500 mt-1">{errors.groomName}</p>}
              </div>

              {/* שם בעלת האירוע */}
              <div>
                <label htmlFor="f-brideName" className="block text-xs font-bold text-gray-700 mb-1.5">{t('step1.brideName')}</label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="f-brideName"
                    type="text"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.brideName}
                    value={clientInfo.brideName}
                    onChange={(e) => setClientInfo({ ...clientInfo, brideName: e.target.value })}
                    placeholder={t('step1.brideNamePh')}
                    className={`w-full ps-9 pe-3 py-2.5 bg-[#FAF7F2] border ${errors.brideName ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all`}
                  />
                </div>
                {errors.brideName && <p className="text-[10px] text-red-500 mt-1">{errors.brideName}</p>}
              </div>

              {/* טלפון בעל האירוע - חובה */}
              <div>
                <label htmlFor="f-groomPhone" className="block text-xs font-bold text-gray-700 mb-1.5">{t('step1.groomPhone')}</label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="f-groomPhone"
                    type="tel"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.groomPhone}
                    value={clientInfo.groomPhone}
                    onChange={(e) => setClientInfo({ ...clientInfo, groomPhone: e.target.value })}
                    placeholder={t('step1.groomPhonePh')}
                    className={`w-full ps-9 pe-3 py-2.5 bg-[#FAF7F2] border ${errors.groomPhone ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all`}
                  />
                </div>
                {errors.groomPhone && <p className="text-[10px] text-red-500 mt-1">{errors.groomPhone}</p>}
              </div>

              {/* טלפון בעלת האירוע - חובה */}
              <div>
                <label htmlFor="f-bridePhone" className="block text-xs font-bold text-gray-700 mb-1.5">{t('step1.bridePhone')}</label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="f-bridePhone"
                    type="tel"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.bridePhone}
                    value={clientInfo.bridePhone}
                    onChange={(e) => setClientInfo({ ...clientInfo, bridePhone: e.target.value })}
                    placeholder={t('step1.bridePhonePh')}
                    className={`w-full ps-9 pe-3 py-2.5 bg-[#FAF7F2] border ${errors.bridePhone ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all`}
                  />
                </div>
                {errors.bridePhone && <p className="text-[10px] text-red-500 mt-1">{errors.bridePhone}</p>}
              </div>

              {/* תאריך אירוע */}
              <div>
                <label htmlFor="f-eventDate" className="block text-xs font-bold text-gray-700 mb-1.5">{t('step1.eventDate')}</label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="f-eventDate"
                    type="date"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.eventDate}
                    value={clientInfo.eventDate}
                    onChange={(e) => setClientInfo({ ...clientInfo, eventDate: e.target.value })}
                    className={`w-full ps-9 pe-3 py-2.5 bg-[#FAF7F2] border ${errors.eventDate ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all`}
                  />
                </div>
                {errors.eventDate && <p className="text-[10px] text-red-500 mt-1">{errors.eventDate}</p>}
              </div>

              {/* מיקום האירוע */}
              <div>
                <label htmlFor="f-eventLocation" className="block text-xs font-bold text-gray-700 mb-1.5">{t('step1.eventLocation')}</label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MapPin className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="f-eventLocation"
                    type="text"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.eventLocation}
                    value={clientInfo.eventLocation}
                    onChange={(e) => setClientInfo({ ...clientInfo, eventLocation: e.target.value })}
                    placeholder={t('step1.eventLocationPh')}
                    className={`w-full ps-9 pe-3 py-2.5 bg-[#FAF7F2] border ${errors.eventLocation ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all`}
                  />
                </div>
                {errors.eventLocation && <p className="text-[10px] text-red-500 mt-1">{errors.eventLocation}</p>}
              </div>

              {/* אימייל */}
              <div className="sm:col-span-2">
                <label htmlFor="f-email" className="block text-xs font-bold text-gray-700 mb-1.5">{isAdmin ? t('admin.emailOptional') : t('step1.email')}</label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="f-email"
                    type="email"
                    required={!isAdmin}
                    aria-required={!isAdmin}
                    aria-invalid={!!errors.email}
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                    placeholder={t('step1.emailPh')}
                    className={`w-full ps-9 pe-3 py-2.5 bg-[#FAF7F2] border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all`}
                  />
                </div>
                {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>}
              </div>

            </div>

            {/* פאנל מנהל — מקור/סטטוס/הערות פנימיות */}
            {isAdmin && (
              <div className="bg-[#FAF7F2] border border-[#EAE3D2] rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#8C6D3F]">{t('admin.panelTitle')}</h3>
                  <p className="text-[11px] text-gray-500">{t('admin.panelSub')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="admin-source" className="block text-xs font-bold text-gray-700 mb-1">{t('admin.source')}</label>
                    <select
                      id="admin-source"
                      value={adminInfo.source}
                      onChange={(e) => setAdminInfo({ ...adminInfo, source: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    >
                      <option value="">{t('admin.sourcePh')}</option>
                      {['phone', 'whatsapp', 'meeting', 'instagram', 'facebook', 'other'].map((s) => (
                        <option key={s} value={s}>{t(`admin.source_${s}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="admin-received" className="block text-xs font-bold text-gray-700 mb-1">{t('admin.receivedBy')}</label>
                    <select
                      id="admin-received"
                      value={adminInfo.receivedBy}
                      onChange={(e) => setAdminInfo({ ...adminInfo, receivedBy: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    >
                      <option value="">{t('admin.sourcePh')}</option>
                      <option value="owner">{t('admin.received_owner')}</option>
                      <option value="employee">{t('admin.received_employee')}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="admin-status" className="block text-xs font-bold text-gray-700 mb-1">{t('admin.status')}</label>
                    <select
                      id="admin-status"
                      value={adminInfo.status}
                      onChange={(e) => setAdminInfo({ ...adminInfo, status: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    >
                      {['draft', 'pending', 'approved', 'deposit', 'paid', 'cancelled', 'done'].map((s) => (
                        <option key={s} value={s}>{t(`admin.status_${s}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="admin-notes" className="block text-xs font-bold text-gray-700 mb-1">{t('admin.internalNotes')}</label>
                  <textarea
                    id="admin-notes"
                    value={adminInfo.internalNotes}
                    onChange={(e) => setAdminInfo({ ...adminInfo, internalNotes: e.target.value })}
                    rows={2}
                    placeholder={t('admin.internalNotesPh')}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNext}
                className="bg-[#B29259] hover:bg-[#8C6D3F] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
              >
                {t('step1.next')}
                {lang === 'he' ? <ArrowLeft className="w-4 h-4" aria-hidden="true" /> : <ArrowRight className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
        )}

        {/* ================= שלב 2: בחירת חבילה ופרטים לבחירה אישית ================= */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fadeIn">

            {/* סינון קטגוריות */}
            <div className="bg-white p-1.5 rounded-2xl border border-[#EAE3D2] shadow-sm flex flex-wrap gap-1">
              {Object.values(CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    activeCategory === cat
                      ? 'bg-[#B29259] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-[#FAF7F2] hover:text-[#B29259]'
                  }`}
                >
                  {categoryLabel(cat, lang)}
                </button>
              ))}
            </div>

            {/* בחירת כמות שולחנות לאירועים — לפני הצגת החבילות */}
            {activeCategory === CATEGORIES.EVENTS && (
              <div className="bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-sm">
                <p className="text-xs font-bold text-[#8C6D3F] mb-2">{t('step2.eventTablesQuestion')}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 20, 30].map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTableTier(tier)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                        selectedTableTier === tier
                          ? 'bg-[#8C6D3F] text-white shadow-sm'
                          : 'bg-[#FAF7F2] border border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {t('step2.tablesLabel', { n: tier })}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* הנחיית בחירה מרובה + שגיאת ולידציה */}
            <div className="bg-[#FAF7F2] border border-[#EAE3D2] rounded-xl px-4 py-2.5 flex items-center gap-2 text-[11px] text-[#8C6D3F]">
              <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {t('step2.multiHint')}
            </div>
            {packagesError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                {t('errors.packagesRequired')}
              </div>
            )}

            {/* גריד חבילות דינמי */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {PACKAGES.filter(p => p.category === activeCategory).map((pkg) => {
                const isSelected = selectedPackageIds.includes(pkg.id);

                const currentPrice = packagePrice(pkg);
                const Lp = L(pkg);

                return (
                  <div
                    key={pkg.id}
                    onClick={() => togglePackage(pkg)}
                    className={`bg-white rounded-2xl border-2 p-5 flex flex-col justify-between cursor-pointer transition-all relative ${
                      isSelected
                        ? 'border-[#B29259] shadow-md ring-1 ring-[#B29259]/20'
                        : 'border-[#EAE3D2] hover:border-gray-300'
                    }`}
                  >
                    {/* תג חבילה נבחרת */}
                    {isSelected && (
                      <span className="absolute -top-2.5 end-4 bg-[#B29259] text-white text-[10px] font-bold py-0.5 px-2.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" aria-hidden="true" />
                        {t('step2.selectedBadge')}
                      </span>
                    )}

                    <div>
                      {/* איור וקטורי */}
                      <div className="bg-[#FAF7F2] rounded-xl p-3 mb-3 flex items-center justify-center border border-[#FAF7F2]">
                        {renderPackageSVG(pkg.svgType)}
                      </div>

                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-800 leading-tight">{Lp.title}</h3>
                        <span className="text-[#B29259] font-black text-base whitespace-nowrap">₪{currentPrice.toLocaleString()}</span>
                      </div>

                      <p className="text-[11px] font-bold text-[#8C6D3F] mb-2">{Lp.subtitle}</p>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4">{Lp.description}</p>

                      {/* מפרט חבילה */}
                      <div className="bg-[#FAF7F2] rounded-xl p-3 space-y-2 border border-[#EAE3D2] text-[11px]">
                        <p className="font-bold text-gray-700 border-b border-gray-200 pb-1">{t('step2.whatIncluded')}</p>

                        {DETAIL_SECTIONS.map(({ key, labelKey }) => {
                          const items = Lp.details[key];
                          if (!items || items.length === 0) return null;
                          return (
                            <div key={key}>
                              <span className="font-bold text-[#8C6D3F]">{t(labelKey)}</span>
                              <ul className="list-disc list-inside text-gray-600 ms-1.5 space-y-0.5">
                                {items.map((item, i) => <li key={i}>{item}</li>)}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 mt-4 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <Gift className="w-3 h-3" aria-hidden="true" />
                        {Lp.benefits}{pkg.benefits.includes('₪500') ? ` ${t('step2.couponHint')}` : ''}
                      </span>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'border-[#B29259] bg-[#B29259] text-white' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* סיכום החבילות שנבחרו (ריבוי חבילות) */}
            {selectedPackages.length > 0 && (
              <div className="bg-white border border-[#EAE3D2] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-bold text-[#8C6D3F]">{t('step2.selectedTitle', { n: selectedPackages.length })}</p>
                  <span className="text-xs font-black text-[#8C6D3F]">{t('step2.selectedTotal', { amount: selectedPackages.reduce((s, p) => s + packagePrice(p), 0).toLocaleString() })}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedPackages.map((p) => (
                    <span key={p.id} className="inline-flex items-center gap-1.5 bg-[#FAF7F2] border border-[#EAE3D2] rounded-full pe-3 ps-2 py-1 text-[11px] text-gray-700">
                      {L(p).title} · ₪{packagePrice(p).toLocaleString()}
                      <button type="button" onClick={() => togglePackage(p)} className="text-gray-400 hover:text-red-500" title={t('step2.removePackage')} aria-label={`${t('step2.removePackage')}: ${L(p).title}`}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* פרטים לבחירה אישית מתוך החוזה — מוצג אם נבחרה חבילת חתונה */}
            {hasWeddingPackage && (
              <div className="bg-white p-6 rounded-2xl border border-[#EAE3D2] shadow-sm space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-bold text-[#8C6D3F]">{t('step2.tableChoiceHeading')}</h3>
                  <p className="text-[10px] text-gray-400">{t('step2.tableChoiceDesc')}</p>
                </div>

                {/* איור הבחירה: קומפוזיציה / סידור עגול בספוג */}
                <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#EAE3D2]">
                  <div className="max-w-md mx-auto">{renderTableChoiceSVG()}</div>
                  <div className="flex justify-between text-[10px] font-bold text-[#8C6D3F] mt-1 px-2">
                    <span>{t('step2.compositionLabel')}</span>
                    <span>{t('step2.spongeLabel')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t('step2.compositesCount')}</label>
                    <input
                      type="number"
                      min="0"
                      value={clientInfo.compositesCount}
                      onChange={(e) => setClientInfo({ ...clientInfo, compositesCount: e.target.value })}
                      placeholder={t('step2.tablesCountPh')}
                      className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t('step2.spongeCount')}</label>
                    <input
                      type="number"
                      min="0"
                      value={clientInfo.spongeCount}
                      onChange={(e) => setClientInfo({ ...clientInfo, spongeCount: e.target.value })}
                      placeholder={t('step2.tablesCountPh')}
                      className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* בקרי ניווט שלב 2 */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-sm mt-6">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-[#B29259] text-xs font-bold flex items-center gap-1 px-3 py-1.5"
              >
                {lang === 'he' ? <ArrowRight className="w-4 h-4" aria-hidden="true" /> : <ArrowLeft className="w-4 h-4" aria-hidden="true" />}
                {t('step2.back')}
              </button>

              <button
                onClick={handleNext}
                className="bg-[#B29259] hover:bg-[#8C6D3F] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                {t('step2.next')}
                {lang === 'he' ? <ArrowLeft className="w-4 h-4" aria-hidden="true" /> : <ArrowRight className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>

          </div>
        )}

        {/* ================= שלב 3: תוספות, חוזה רשמי וחתימות כפולות ================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">

            {/* הובלה והרכבה */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAE3D2] space-y-5">
              <div>
                <h3 className="text-lg font-bold text-[#8C6D3F] flex items-center gap-1.5">
                  <Truck className="w-5 h-5 text-[#B29259]" aria-hidden="true" />
                  {t('step3.deliveryHeading')}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{t('step3.deliverySub')}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIncludeDelivery(!includeDelivery);
                  setShowDeliveryError(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-right transition-all ${
                  includeDelivery
                    ? 'bg-[#FAF7F2] border-[#B29259]'
                    : showDeliveryError
                      ? 'bg-red-50 border-red-400'
                      : 'bg-white border-gray-200 hover:border-[#B29259]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Truck className={`w-5 h-5 ${includeDelivery ? 'text-[#B29259]' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{t('step3.deliveryTitle')}</h4>
                    <p className="text-[11px] text-gray-500">{t('step3.deliveryDesc')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700">₪500</span>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    includeDelivery ? 'bg-[#B29259] border-[#B29259] text-white' : 'bg-white border-gray-300'
                  }`}>
                    {includeDelivery && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </button>

              {showDeliveryError && !includeDelivery && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {t('errors.deliveryRequired')}
                </div>
              )}

              {/* הוספת שדרוגים ותמחור ידני על ידי הלקוח/מעצב */}
              <div className="border-t border-gray-100 pt-5 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                    <Plus className="w-4.5 h-4.5 text-[#B29259]" aria-hidden="true" />
                    {t('step3.upgradesHeading')}
                  </h3>
                  <p className="text-xs text-gray-500">{t('step3.upgradesSub')}</p>
                </div>

                <form onSubmit={handleAddUpgrade} className="flex flex-col sm:flex-row gap-3 bg-[#FAF7F2] p-4 rounded-xl border border-[#EAE3D2]">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">{t('step3.upgradeDesc')}</label>
                    <input
                      type="text"
                      value={newUpgradeDesc}
                      onChange={(e) => setNewUpgradeDesc(e.target.value)}
                      placeholder={t('step3.upgradeDescPh')}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    />
                  </div>
                  <div className="sm:w-32">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">{t('step3.upgradePrice')}</label>
                    <input
                      type="number"
                      value={newUpgradePrice}
                      onChange={(e) => setNewUpgradePrice(e.target.value)}
                      placeholder="₪"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#8C6D3F] hover:bg-[#705630] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm self-end w-full sm:w-auto mt-2 sm:mt-0 transition-all"
                  >
                    {t('step3.addUpgrade')}
                  </button>
                </form>

                {customUpgrades.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-gray-700">{t('step3.upgradesAddedTitle')}</p>
                    <div className="border border-gray-150 rounded-xl divide-y divide-gray-100 bg-white">
                      {customUpgrades.map((item) => (
                        <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-gray-800">{item.description}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-[#8C6D3F]">₪{item.price.toLocaleString()}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveUpgrade(item.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-md transition-colors"
                              title={t('step3.deleteUpgrade')}
                              aria-label={t('step3.deleteUpgrade')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic">{t('step3.noUpgrades')}</p>
                )}
              </div>
            </div>

            {/* תוספות ושדרוגים לחבילות שנבחרו (קטלוג עם כמויות) */}
            {activeAddons.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAE3D2] space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#8C6D3F] flex items-center gap-1.5">
                    <Plus className="w-4.5 h-4.5 text-[#B29259]" aria-hidden="true" />
                    {t('step3.addonsHeading')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{t('step3.addonsSub')}</p>
                </div>

                <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                  {activeAddons.map((a) => {
                    const qty = addonQty[a.id] || 0;
                    return (
                      <div key={a.id} className={`flex items-center justify-between gap-3 p-3 ${qty > 0 ? 'bg-[#FAF7F2]' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800">{localizedAddonName(a.id, a.name, lang)}</p>
                          <p className="text-[10px] text-gray-500">
                            ₪{a.price.toLocaleString()}{a.unit ? ` ${localizedUnit(a.unit, lang)}` : ''}
                            {!a.hasFlowers && isCouponValid && <span className="text-emerald-600 font-bold"> · {t('step3.addonsCanCoupon')}</span>}
                          </p>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={qty || ''}
                          onChange={(e) => updateAddonQty(a.id, e.target.value)}
                          placeholder={a.unit ? t('step3.metersPh') : t('step3.qtyPh')}
                          className="w-20 px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                        />
                      </div>
                    );
                  })}
                </div>

                {addonsTotal > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-[#8C6D3F] pt-1">
                    <span>{t('step3.addonsTotal')}</span>
                    <span>₪{addonsTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* קוד קופון — ₪500 מתנה לפריט תוספת אחד (ללא פרחים) */}
            {isCouponEligible && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAE3D2] space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#8C6D3F] flex items-center gap-1.5">
                    <Gift className="w-4.5 h-4.5 text-[#B29259]" aria-hidden="true" />
                    {t('step3.couponHeading')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('step3.couponDesc')}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">{t('step3.couponLabel')}</label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={t('step3.couponPh')}
                    className={`w-full px-3 py-2.5 bg-[#FAF7F2] border ${
                      isCouponValid
                        ? 'border-emerald-400'
                        : couponCode.trim()
                          ? 'border-red-400'
                          : 'border-gray-200'
                    } rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#B29259]`}
                  />
                </div>

                {couponCode.trim() && !isCouponValid && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl" role="alert">
                    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {t('step3.couponInvalid')}
                  </div>
                )}

                {isCouponValid && (
                  giftEligibleAddons.length > 0 ? (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-gray-600">{t('step3.couponSelect')}</label>
                      <select
                        value={giftAddonId}
                        onChange={(e) => setGiftAddonId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                      >
                        <option value="">{t('step3.couponChoose')}</option>
                        {giftEligibleAddons.map((a) => (
                          <option key={a.id} value={a.id}>
                            {addonLineDescription(a)} (₪{(a.price * a.qty).toLocaleString()})
                          </option>
                        ))}
                      </select>
                      {couponDiscount > 0 && giftAddon && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold p-3 rounded-xl">
                          <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                          {t('step3.couponRealized', { amount: couponDiscount.toLocaleString(), name: localizedAddonName(giftAddon.id, giftAddon.name, lang) })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold p-3 rounded-xl">
                      <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      {t('step3.couponNeedItem')}
                    </div>
                  )
                )}
              </div>
            )}

            {/* תמחור ידני — מנהל */}
            {isAdmin && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAE3D2] space-y-4">
                <h3 className="text-base font-bold text-[#8C6D3F] flex items-center gap-1.5">
                  <Plus className="w-4.5 h-4.5 text-[#B29259]" aria-hidden="true" />
                  {t('admin.pricingTitle')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="admin-discount" className="block text-xs font-bold text-gray-700 mb-1">{t('admin.manualDiscount')}</label>
                    <input
                      id="admin-discount"
                      type="number"
                      min="0"
                      value={adminInfo.manualDiscount}
                      onChange={(e) => setAdminInfo({ ...adminInfo, manualDiscount: e.target.value })}
                      placeholder={t('admin.manualDiscountPh')}
                      className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-total" className="block text-xs font-bold text-gray-700 mb-1">{t('admin.manualTotal')}</label>
                    <input
                      id="admin-total"
                      type="number"
                      min="0"
                      value={adminInfo.manualTotal}
                      onChange={(e) => setAdminInfo({ ...adminInfo, manualTotal: e.target.value })}
                      placeholder={t('admin.manualTotalPh')}
                      className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* סיכום חוזה רשמי והזמנה לחתונה */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAE3D2] space-y-6">
              <div className="text-center pb-4 border-b border-gray-100">
                <FileText className="w-6 h-6 text-[#B29259] mx-auto mb-1" aria-hidden="true" />
                <h3 className="text-lg font-bold text-gray-800">{t('step3.contractHeading')}</h3>
                <p className="text-xs text-gray-400">{t('step3.contractSub')}</p>
              </div>

              {/* כרטיסיית פרטי אירוע (חתן כלה) */}
              <div className="grid grid-cols-2 gap-3 bg-[#FAF7F2] p-4 rounded-xl border border-[#EAE3D2] text-xs">
                <div>
                  <span className="text-gray-400 font-medium">{t('step3.infoGroomName')}</span>
                  <p className="font-bold text-gray-700 mt-0.5">{clientInfo.groomName}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">{t('step3.infoBrideName')}</span>
                  <p className="font-bold text-gray-700 mt-0.5">{clientInfo.brideName}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">{t('step3.infoGroomPhone')}</span>
                  <p className="font-bold text-gray-700 mt-0.5" dir="ltr">{clientInfo.groomPhone}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">{t('step3.infoBridePhone')}</span>
                  <p className="font-bold text-gray-700 mt-0.5" dir="ltr">{clientInfo.bridePhone}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">{t('step3.infoDate')}</span>
                  <p className="font-bold text-gray-700 mt-0.5">{clientInfo.eventDate}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">{t('step3.infoLocation')}</span>
                  <p className="font-bold text-gray-700 mt-0.5">{clientInfo.eventLocation}</p>
                </div>
                {clientInfo.compositesCount && (
                  <div>
                    <span className="text-gray-400 font-medium">{t('step3.infoComposites')}</span>
                    <p className="font-bold text-gray-700 mt-0.5">{t('step3.tablesUnit', { n: clientInfo.compositesCount })}</p>
                  </div>
                )}
                {clientInfo.spongeCount && (
                  <div>
                    <span className="text-gray-400 font-medium">{t('step3.infoSponge')}</span>
                    <p className="font-bold text-gray-700 mt-0.5">{t('step3.tablesUnit', { n: clientInfo.spongeCount })}</p>
                  </div>
                )}
                {isAdmin && (
                  <>
                    <div>
                      <span className="text-gray-400 font-medium">{t('admin.statusLabel')}</span>
                      <p className="font-bold text-gray-700 mt-0.5">{t(`admin.status_${adminInfo.status}`)}</p>
                    </div>
                    {adminInfo.source && (
                      <div>
                        <span className="text-gray-400 font-medium">{t('admin.sourceLabel')}</span>
                        <p className="font-bold text-gray-700 mt-0.5">{t(`admin.source_${adminInfo.source}`)}</p>
                      </div>
                    )}
                    {adminInfo.receivedBy && (
                      <div>
                        <span className="text-gray-400 font-medium">{t('admin.receivedLabel')}</span>
                        <p className="font-bold text-gray-700 mt-0.5">{t(`admin.received_${adminInfo.receivedBy}`)}</p>
                      </div>
                    )}
                    {adminInfo.internalNotes.trim() && (
                      <div className="col-span-2">
                        <span className="text-gray-400 font-medium">{t('admin.notesLabel')}</span>
                        <p className="font-bold text-gray-700 mt-0.5 whitespace-pre-wrap">{adminInfo.internalNotes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* פירוט כספי */}
              <div className="space-y-3 text-xs">
                {selectedPackages.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-gray-600">
                    <span>{p.title}{p.pricingTiers ? ` (${selectedTableTier} שולחנות)` : ''}</span>
                    <span className="font-bold text-gray-800">₪{packagePrice(p).toLocaleString()}</span>
                  </div>
                ))}

                {customUpgrades.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-gray-600">
                    <span>{item.description}</span>
                    <span className="font-bold text-gray-800">₪{item.price.toLocaleString()}</span>
                  </div>
                ))}

                {selectedAddons.map((a) => (
                  <div key={a.id} className="flex justify-between items-center text-gray-600">
                    <span>{addonLineDescription(a)}</span>
                    <span className="font-bold text-gray-800">₪{(a.price * a.qty).toLocaleString()}</span>
                  </div>
                ))}

                {includeDelivery && (
                  <div className="flex justify-between items-center text-gray-600">
                    <span>{t('step3.lineDelivery')}</span>
                    <span className="font-bold text-gray-800">₪500</span>
                  </div>
                )}

                {pricing.couponDiscount > 0 && giftAddon && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>{t('step3.lineCoupon', { name: localizedAddonName(giftAddon.id, giftAddon.name, lang) })}</span>
                    <span className="font-bold">−₪{pricing.couponDiscount.toLocaleString()}</span>
                  </div>
                )}

                {pricing.adminDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>{t('admin.lineDiscount')}</span>
                    <span className="font-bold">−₪{pricing.adminDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-sm font-black text-gray-800">
                  <span>{t('step3.totalLabel')}</span>
                  <span className="text-lg text-[#8C6D3F]">₪{pricing.totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* מדיניות ביטולים ושינויים המלאה והמדויקת לפי התמונה */}
              <div className="bg-stone-50 rounded-xl p-4 border border-gray-200 text-right space-y-3">
                <div className="text-[11px] text-gray-600 space-y-2.5 leading-relaxed">

                  <p className="font-bold text-[#8C6D3F] border-b border-gray-200 pb-1">{t('step3.policyTitle')}</p>
                  <ul className="list-disc list-inside space-y-2 ps-1 text-gray-600">
                    <li>
                      <strong>{t('step3.policyForceStrong')}</strong> {t('step3.policyForce')}
                    </li>
                    <li>
                      {t('step3.policyOther')}
                    </li>
                    <li>
                      {t('step3.policyNoAlt')}
                    </li>
                  </ul>

                  <p className="font-bold text-[#8C6D3F] border-b border-gray-200 pt-1 pb-1">{t('step3.changesTitle')}</p>
                  <ul className="list-disc list-inside space-y-1 ps-1 text-gray-600">
                    <li>{t('step3.changes1')}</li>
                    <li><strong>{t('step3.equipmentStrong')}</strong> {t('step3.equipment')}</li>
                  </ul>

                  <p className="font-bold text-[#8C6D3F] border-b border-gray-200 pt-1 pb-1">{t('step3.balanceTitle')}</p>
                  <p className="ps-1 text-gray-600">{t('step3.balance')}</p>
                </div>
              </div>

              {/* לוחות חתימה דיגיטליים כפולים (חתן וכלה) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* חתימת בעל האירוע */}
                <div className="border border-dashed border-[#B29259]/60 rounded-xl p-4 bg-stone-50">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-800">{t('step3.groomSign')}</label>
                    {isGroomSigned && (
                      <button type="button" onClick={clearGroomSignature} className="text-[10px] text-red-500 hover:text-red-700 font-bold">{t('step3.clear')}</button>
                    )}
                  </div>
                  <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden h-24">
                    <canvas
                      ref={groomCanvasRef}
                      width={350}
                      height={96}
                      onMouseDown={startGroomDrawing}
                      onMouseMove={drawGroom}
                      onMouseUp={stopGroomDrawing}
                      onMouseLeave={stopGroomDrawing}
                      onTouchStart={startGroomDrawing}
                      onTouchMove={drawGroom}
                      onTouchEnd={stopGroomDrawing}
                      className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                    />
                    {!isGroomSigned && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-[10px]">
                        {t('step3.groomSignHere')}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">{t('step3.signDate')}</span>
                    <input
                      type="date"
                      value={groomSignDate}
                      onChange={(e) => setGroomSignDate(e.target.value)}
                      className="bg-white border rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    />
                  </div>
                </div>

                {/* חתימת בעלת האירוע */}
                <div className="border border-dashed border-[#B29259]/60 rounded-xl p-4 bg-stone-50">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-800">{t('step3.brideSign')}</label>
                    {isBrideSigned && (
                      <button type="button" onClick={clearBrideSignature} className="text-[10px] text-red-500 hover:text-red-700 font-bold">{t('step3.clear')}</button>
                    )}
                  </div>
                  <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden h-24">
                    <canvas
                      ref={brideCanvasRef}
                      width={350}
                      height={96}
                      onMouseDown={startBrideDrawing}
                      onMouseMove={drawBride}
                      onMouseUp={stopBrideDrawing}
                      onMouseLeave={stopBrideDrawing}
                      onTouchStart={startBrideDrawing}
                      onTouchMove={drawBride}
                      onTouchEnd={stopBrideDrawing}
                      className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                    />
                    {!isBrideSigned && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-[10px]">
                        {t('step3.brideSignHere')}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">{t('step3.signDate')}</span>
                    <input
                      type="date"
                      value={brideSignDate}
                      onChange={(e) => setBrideSignDate(e.target.value)}
                      className="bg-white border rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    />
                  </div>
                </div>
              </div>

              {/* הודעת שגיאת חתימה */}
              {showSignatureError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {t('errors.signatureRequired')}
                </div>
              )}
            </div>

            {/* אישור תקנון ומדיניות פרטיות (חובה) */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EAE3D2] no-print">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => { setTermsAccepted(e.target.checked); setShowTermsError(false); }}
                  className="mt-0.5 w-4 h-4 accent-[#B29259]"
                  aria-describedby={showTermsError ? 'terms-error' : undefined}
                />
                <span className="text-xs text-gray-700 leading-relaxed">
                  {t('terms.label')} *{' '}
                  <button type="button" onClick={() => setLegalModal('terms')} className="text-[#8C6D3F] underline font-bold">{t('legal.terms')}</button>
                  {' · '}
                  <button type="button" onClick={() => setLegalModal('privacy')} className="text-[#8C6D3F] underline font-bold">{t('legal.privacy')}</button>
                </span>
              </label>
              {showTermsError && (
                <p id="terms-error" role="alert" className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {t('terms.required')}
                </p>
              )}
            </div>

            {/* הודעת שגיאת שמירה */}
            {submitError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl no-print" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {submitError}
              </div>
            )}

            {/* בקרי ניווט שלב 3 */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-sm no-print">
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="text-gray-600 hover:text-[#B29259] text-xs font-bold flex items-center gap-1 px-3 py-1.5 disabled:opacity-50"
              >
                {lang === 'he' ? <ArrowRight className="w-4 h-4" aria-hidden="true" /> : <ArrowLeft className="w-4 h-4" aria-hidden="true" />}
                {t('step3.back')}
              </button>

              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="bg-[#B29259] hover:bg-[#8C6D3F] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4" aria-hidden="true" />
                {isSubmitting ? t('step3.submitting') : t('step3.submitIdle')}
              </button>
            </div>

          </div>
        )}

      </main>

      {/* --- כותרת תחתונה --- */}
      <footer className="max-w-4xl mx-auto px-4 mt-10 text-center no-print">
        <div className="border-t border-[#EAE3D2] pt-6 text-xs text-gray-400 space-y-0.5">
          <p className="font-bold text-[#8C6D3F] font-serif text-sm">LD Event Design</p>
          <p>{t('footer.line1')}</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2" aria-label={t('legal.terms')}>
            <button type="button" onClick={() => setLegalModal('privacy')} className="hover:text-[#B29259] underline">{t('legal.privacy')}</button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={() => setLegalModal('terms')} className="hover:text-[#B29259] underline">{t('legal.terms')}</button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={() => setLegalModal('accessibility')} className="hover:text-[#B29259] underline">{t('legal.accessibility')}</button>
          </nav>
          <p className="mt-1">{t('footer.rights', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>

      {/* מודאל מסמכים משפטיים (פרטיות / תקנון / נגישות) */}
      {legalModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 no-print"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-title"
          onClick={() => setLegalModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-auto p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 id="legal-title" className="text-lg font-bold text-[#8C6D3F]">{t(`legal.${legalModal}`)}</h2>
              <button type="button" onClick={() => setLegalModal(null)} aria-label={t('legal.close')} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-2.5 text-sm text-gray-600 leading-relaxed">
              {tList(`legal.${legalModal}Body`).map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <button
              type="button"
              onClick={() => setLegalModal(null)}
              className="mt-5 w-full bg-[#B29259] hover:bg-[#8C6D3F] text-white py-2.5 rounded-xl text-sm font-bold"
            >
              {t('legal.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
