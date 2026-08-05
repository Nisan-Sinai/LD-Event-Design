import React, { useState, useRef, useEffect } from 'react';
import { isSupabaseConfigured } from './lib/supabase';
import { submitOrder } from './lib/submitOrder';
import { calcPricing } from './lib/pricing';
import { AccessibilityWidget } from './components/AccessibilityWidget';
import { WhatsAppButton } from './components/WhatsAppButton';
import { AuthModal } from './components/AuthModal';
import { Link } from 'react-router';
import { useI18n } from './i18n/i18n';
import { useAuth } from './auth/AuthProvider';
import { usePackages } from './packages/PackagesProvider';
import { buildCatalog } from './lib/packages';
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
  X,
  Home,
  LogOut,
  Building2,
  RotateCcw,
  Pencil
} from 'lucide-react';

// --- קטגוריות החבילות ---
export const CATEGORIES = {
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

export interface Package {
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
  /** תמונה שהועלתה בניהול — מוצגת במקום האיור הווקטורי */
  image?: string;
}

interface ClientInfo {
  groomName: string;
  brideName: string;
  groomPhone: string;
  bridePhone: string;
  email: string;
  eventDate: string;
  eventLocation: string;
  compositesCount: string;
  spongeCount: string;
  referralSource: string;
  referralDetail: string;
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
export const PACKAGES: Package[] = [
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
    svgType: 'henna-market'
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
    svgType: 'bar-branded'
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
    svgType: 'bar-boutique'
  }
];

// --- פלטת צבעים ואלמנטים משותפים לאיורים (קו-ארט בסגנון הפלאיירים) ---
const ART = { gold: '#B29259', deep: '#8C6D3F', soft: '#D8C29A', cream: '#FAF7F2', sage: '#A7B58C' };

// הגדרות משותפות לכל איור: גרדיאנטים לעומק + צל רך לרצפה.
// המזהים זהים בכל מופע (אותה הגדרה) — url() נפתר לראשון, ולכן עקבי.
function ArtDefs() {
  return (
    <defs>
      <radialGradient id="ldRose" cx="38%" cy="30%" r="72%">
        <stop offset="0%" stopColor="#F2E4C8" />
        <stop offset="55%" stopColor={ART.gold} />
        <stop offset="100%" stopColor={ART.deep} />
      </radialGradient>
      <radialGradient id="ldRoseSoft" cx="38%" cy="30%" r="72%">
        <stop offset="0%" stopColor="#FBF4E6" />
        <stop offset="60%" stopColor={ART.soft} />
        <stop offset="100%" stopColor={ART.gold} />
      </radialGradient>
      <linearGradient id="ldPost" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={ART.deep} />
        <stop offset="45%" stopColor="#C9A86B" />
        <stop offset="100%" stopColor={ART.deep} />
      </linearGradient>
      <linearGradient id="ldFabric" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F6EEDE" />
        <stop offset="100%" stopColor={ART.soft} />
      </linearGradient>
      <radialGradient id="ldFlame" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFF6DD" />
        <stop offset="55%" stopColor="#F0C75E" />
        <stop offset="100%" stopColor={ART.gold} />
      </radialGradient>
      <radialGradient id="ldGlow" cx="50%" cy="42%" r="62%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
        <stop offset="55%" stopColor="#F6EEDE" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#EAE3D2" stopOpacity="0" />
      </radialGradient>
      <filter id="ldShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.6" />
      </filter>
      {/* זוהר רך לאלמנטים זוהרים (להבת נר) */}
      <filter id="ldFlameGlow" x="-120%" y="-120%" width="340%" height="340%">
        <feGaussianBlur stdDeviation="1.5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

// אירוח ה-defs פעם אחת בלבד במסמך (מונע id-ים כפולים בריבוי איורים).
// כל איור מפנה אל ה-url(#...) המשותף, וההגדרה קיימת תמיד בעמוד.
export function ArtDefsHost() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <ArtDefs />
    </svg>
  );
}

// ניצוץ זהב בן 4 קצוות — מנצנץ (twinkle)
function Sparkle({ x, y, r, o = 0.5, delay = 0 }: { x: number; y: number; r: number; o?: number; delay?: number }) {
  const a = r * 0.32;
  return (
    <path
      className="ld-twinkle"
      style={{ animationDelay: `${delay}s` }}
      d={`M${x} ${y - r} L${x + a} ${y - a} L${x + r} ${y} L${x + a} ${y + a} L${x} ${y + r} L${x - a} ${y + a} L${x - r} ${y} L${x - a} ${y - a} Z`}
      fill={ART.gold}
      opacity={o}
    />
  );
}

// רקע "במה" משותף לכל איור: זוהר חמים נושם + ניצוצות זהב מנצנצים (יוקרה ואחידות)
function SceneBackdrop() {
  const sparks: [number, number, number, number][] = [
    [18, 22, 3.6, 0.75], [184, 26, 3, 0.7], [12, 70, 2.8, 0.6],
    [188, 72, 3.4, 0.75], [100, 10, 2.6, 0.65], [44, 13, 2.2, 0.55], [158, 15, 2.4, 0.55]
  ];
  return (
    <g aria-hidden="true">
      <rect className="ld-glowpulse" x="0" y="0" width="200" height="108" fill="url(#ldGlow)" />
      {sparks.map(([x, y, r, o], i) => <Sparkle key={i} x={x} y={y} r={r} o={o} delay={i * 0.34} />)}
    </g>
  );
}

// צל רך לרצפה מתחת לאלמנט
function GroundShadow({ cx, cy, rx, ry = 3 }: { cx: number; cy: number; rx: number; ry?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={ART.deep} opacity="0.12" filter="url(#ldShadow)" />;
}

// ורד יחיד — עלי כותרת מרובדים, גרדיאנט עומק ונקודת אור (מראה מלא ועשיר)
function Rose({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const grad = fill === ART.gold ? 'url(#ldRose)' : 'url(#ldRoseSoft)';
  const sw = (k: number) => Math.max(0.4, r * k);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={grad} />
      {/* עלי כותרת חיצוניים */}
      <path d={`M${cx} ${cy} m ${-r * 0.72} 0 a ${r * 0.72} ${r * 0.72} 0 1 1 ${r * 1.44} 0`} fill="none" stroke={ART.deep} strokeWidth={sw(0.1)} opacity="0.28" strokeLinecap="round" />
      {/* סלסול פנימי */}
      <path d={`M${cx} ${cy} m ${-r * 0.44} 0 a ${r * 0.44} ${r * 0.44} 0 1 1 ${r * 0.88} 0`} fill="none" stroke={ART.deep} strokeWidth={sw(0.16)} opacity="0.42" strokeLinecap="round" />
      <path d={`M${cx} ${cy} q ${r * 0.4} ${-r * 0.3} 0 ${-r * 0.6}`} fill="none" stroke={ART.deep} strokeWidth={sw(0.15)} opacity="0.4" strokeLinecap="round" />
      <circle cx={cx - r * 0.28} cy={cy - r * 0.3} r={Math.max(0.4, r * 0.22)} fill="#FFFFFF" opacity="0.55" />
    </g>
  );
}

// עלה ירוק עדין
function Leaf({ cx, cy, rot, len = 9 }: { cx: number; cy: number; rot: number; len?: number }) {
  return (
    <path d={`M${cx} ${cy} q ${len * 0.5} ${-len * 0.45} ${len} 0 q ${-len * 0.5} ${len * 0.45} ${-len} 0 Z`} fill={ART.sage} opacity="0.7" transform={`rotate(${rot} ${cx} ${cy})`} />
  );
}

// ענף אקליפטוס עדין — קו מתעקל
function Sprig({ d }: { d: string }) {
  return <path d={d} fill="none" stroke={ART.sage} strokeWidth="0.8" strokeLinecap="round" opacity="0.65" />;
}

// זר / חבק פרחים עשיר ומלא: ורדים מרובדים + עלים + ענפי אקליפטוס + נגיעות גיבסניות
function Bouquet({ cx, cy, s = 1, accent = ART.gold }: { cx: number; cy: number; s?: number; accent?: string }) {
  const leaves: [number, number, number][] = [[-9, -3, -35], [9, -4, 35], [-8, 7, -70], [8, 8, 70], [0, -10, 0], [-3, 9, -115], [4, 9, 115], [-11, 1, -50], [11, 0, 50]];
  const roses: [number, number, number, string][] = [
    [0, 0, 5.2, accent], [-6, -1, 3.9, ART.soft], [6, -2, 4.2, ART.soft], [-3, 5, 3.6, accent],
    [4, 5, 3.4, ART.soft], [0, -6, 3.6, accent], [-7, 4, 2.8, ART.soft], [7, 3, 3, accent],
    [-9, -4, 2.5, accent], [9, -3, 2.7, ART.soft], [2, -9, 2.6, ART.soft]
  ];
  const gyps: [number, number][] = [[-10, 3], [10, 2], [-5, -8], [8, -7], [0, 9], [-2, -3], [5, 0]];
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      {/* עלווה נשפכת מטה */}
      <path d="M-2 6 q-4 12 -7 22" fill="none" stroke={ART.sage} strokeWidth="1" opacity="0.6" />
      <path d="M3 6 q3 13 6 24" fill="none" stroke={ART.sage} strokeWidth="1" opacity="0.6" />
      <path d="M0 7 q0 14 0 26" fill="none" stroke={ART.sage} strokeWidth="0.9" opacity="0.5" />
      {/* ענפי אקליפטוס בצדדים */}
      <Sprig d="M-8 -2 q-8 -4 -13 -11" />
      <Sprig d="M8 -2 q8 -4 13 -11" />
      {leaves.map(([lx, ly, r], i) => <Leaf key={`l${i}`} cx={lx} cy={ly} rot={r} />)}
      {roses.map(([rx, ry, rr, f], i) => <Rose key={`r${i}`} cx={rx} cy={ry} r={rr} fill={f} />)}
      {/* נגיעות גיבסניות לבנות */}
      {gyps.map(([gx, gy], i) => <circle key={`g${i}`} cx={gx} cy={gy} r="0.9" fill="#FFFFFF" opacity="0.85" />)}
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

// נר עמוד עם להבה זוהרת
function PillarCandle({ x, base, h, w = 7 }: { x: number; base: number; h: number; w?: number }) {
  return (
    <g>
      <rect x={x - w / 2} y={base - h} width={w} height={h} rx="2" fill={ART.cream} stroke={ART.soft} />
      <rect x={x - w / 2} y={base - h} width={w * 0.32} height={h} rx="2" fill="#FFFFFF" opacity="0.4" />
      <ellipse cx={x} cy={base - h} rx={w / 2} ry="1.6" fill={ART.soft} opacity="0.6" />
      <line x1={x} y1={base - h} x2={x} y2={base - h - 3} stroke={ART.deep} strokeWidth="0.8" />
      {/* הילת זוהר נושמת */}
      <circle className="ld-glowpulse" cx={x} cy={base - h - 6} r="6.5" fill="url(#ldFlame)" opacity="0.3" />
      {/* להבה מרצדת וזוהרת */}
      <g className="ld-flame">
        <path d={`M${x} ${base - h - 3} q 3 -3 0 -7 q -3 4 0 7`} fill="url(#ldFlame)" filter="url(#ldFlameGlow)" />
      </g>
    </g>
  );
}

// --- איורים וקטוריים לכל סוג חבילה (קו-ארט נאמן לפלאיירים) ---
export function renderPackageSVG(type: string) {
  const { gold, soft, cream } = ART;

  // מסגרת חופה משותפת: עמודים, קורה עליונה ורצפה
  const chuppahFrame = (children: React.ReactNode) => (
    <svg width="100%" height="104" viewBox="0 0 200 108" aria-hidden="true" focusable="false">
      <SceneBackdrop />
      <GroundShadow cx={100} cy={99} rx={70} ry={3.5} />
      <path d="M40 26 Q100 18 160 26" stroke="url(#ldPost)" strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <rect x="44" y="25" width="4.5" height="72" rx="2.25" fill="url(#ldPost)" />
      <rect x="151.5" y="25" width="4.5" height="72" rx="2.25" fill="url(#ldPost)" />
      {/* נצנוץ עדין על קצות הקורה */}
      <circle cx="46.25" cy="25" r="2.4" fill={gold} />
      <circle cx="153.75" cy="25" r="2.4" fill={gold} />
      {children}
      <line x1="22" y1="98" x2="178" y2="98" stroke={gold} strokeWidth="1.6" opacity="0.4" />
    </svg>
  );

  // איור חופה קלאסית מותאם לדרגה: S פשוט · M עשיר יותר · L יוקרתי ומלא
  // ככל שעולים בדרגה — מתווספים כתר פרחים על הקורה ונרות לאורך השביל.
  const chuppahCurtains = (level: 's' | 'm' | 'l') => {
    const bouqScale = level === 'l' ? 1.75 : level === 'm' ? 1.6 : 1.45;
    return chuppahFrame(
      <>
        {/* בד שקוף ונשפך: swag מרכזי + 2 פאנלים זורמים עם קווי קיפול עדינים */}
        <g>
          <path d="M50 27 Q100 58 150 27 Q140 46 100 52 Q60 46 50 27 Z" fill="url(#ldFabric)" opacity="0.6" stroke={gold} strokeOpacity="0.3" strokeWidth="0.5" />
          <path d="M62 33 Q100 53 138 33" fill="none" stroke={gold} strokeOpacity="0.25" strokeWidth="0.4" />
          <path d="M72 38 Q100 51 128 38" fill="none" stroke={gold} strokeOpacity="0.2" strokeWidth="0.4" />
          <path d="M52 27 Q41 60 50 96 Q58 70 60 30 Z" fill="url(#ldFabric)" opacity="0.5" stroke={gold} strokeOpacity="0.28" strokeWidth="0.5" />
          <path d="M54 31 Q47 62 51 92" fill="none" stroke={gold} strokeOpacity="0.22" strokeWidth="0.4" />
          <path d="M148 27 Q159 60 150 96 Q142 70 140 30 Z" fill="url(#ldFabric)" opacity="0.5" stroke={gold} strokeOpacity="0.28" strokeWidth="0.5" />
          <path d="M146 31 Q153 62 149 92" fill="none" stroke={gold} strokeOpacity="0.22" strokeWidth="0.4" />
        </g>

        {/* M — אשכול פרחים מרכזי על הקורה */}
        {level === 'm' && [92, 100, 108].map((x, i) => (
          <Rose key={`mr${i}`} cx={x} cy={23} r={2.9} fill={i === 1 ? ART.gold : ART.soft} />
        ))}

        {/* L — כתר פרחים מלא לאורך כל הקורה */}
        {level === 'l' && [56, 68, 80, 92, 104, 116, 128, 140].map((x, i) => (
          <Rose key={`lr${i}`} cx={x} cy={22 + (i % 2 ? 1.5 : -1)} r={3} fill={i % 2 ? ART.gold : ART.soft} />
        ))}

        {/* זרי צד — גדלים לפי דרגה */}
        <Bouquet cx={52} cy={34} s={bouqScale} />
        <Bouquet cx={148} cy={34} s={bouqScale} />

        {/* נרות שביל — M: 2 · L: 4 */}
        {level !== 's' && <PillarCandle x={28} base={96} h={13} w={6} />}
        {level !== 's' && <PillarCandle x={172} base={96} h={13} w={6} />}
        {level === 'l' && <PillarCandle x={42} base={96} h={10} w={5} />}
        {level === 'l' && <PillarCandle x={158} base={96} h={10} w={5} />}
      </>
    );
  };

  // איור חופת בדים נשפכים: תליית בד רחבה + 4 בדים זורמים + 2 זרים גדולים
  const chuppahDrapes = () =>
    chuppahFrame(
      <>
        <g opacity="0.85" fill="url(#ldFabric)" stroke={gold} strokeOpacity="0.35" strokeWidth="0.6">
          {/* תליית בד רחבה */}
          <path d="M48 28 Q100 66 152 28 Q138 48 100 56 Q62 48 48 28 Z" />
          {/* 4 בדים נשפכים */}
          <path d="M52 28 Q44 66 54 95 Q60 72 60 30 Z" />
          <path d="M74 30 Q70 64 78 95 Q84 70 82 32 Z" />
          <path d="M126 30 Q130 64 122 95 Q116 70 118 32 Z" />
          <path d="M148 28 Q156 66 146 95 Q140 72 140 30 Z" />
        </g>
        <Bouquet cx={52} cy={34} s={1.65} />
        <Bouquet cx={148} cy={34} s={1.65} />
      </>
    );

  // איור בר חינה מרוקאי: מגדל עוגיות תלת-קומתי + קומקום נחושת + כוסות + נרות
  const henna = () => (
    <svg width="100%" height="104" viewBox="0 0 200 108" aria-hidden="true" focusable="false">
      <SceneBackdrop />
      <GroundShadow cx={100} cy={92} rx={78} ry={4} />
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
      const bx = cxBase - Math.cos(angle) * radiusX;
      const by = yBase - Math.sin(angle) * radiusY;
      const r = 5 + (i % 3);
      return (
        <g key={`${prefix}-${i}`} className="ld-float" style={{ animationDelay: `${i * 0.16}s` }}>
          <circle cx={bx} cy={by} r={r} fill={i % 2 ? gold : soft} opacity="0.92" />
          <circle cx={bx - r * 0.3} cy={by - r * 0.35} r={r * 0.28} fill="#FFFFFF" opacity="0.55" />
        </g>
      );
    });

  // איור "קלאסיק" לאירועים: 2 אגרטלים עם זרי ורדים + צילינדר נר צף במרכז
  const eventClassic = () => (
    <svg width="100%" height="104" viewBox="0 0 200 108" aria-hidden="true" focusable="false">
      <SceneBackdrop />
      <GroundShadow cx={100} cy={93} rx={74} ry={4} />
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
      <SceneBackdrop />
      {balloonArch(100, 92, 66, 64, 13, 'arch')}
      <line x1="34" y1="92" x2="166" y2="92" stroke={gold} strokeWidth="1.6" opacity="0.4" />
    </svg>
  );

  // איור "הצגה" (VIP): עמדת צילום — קיר רקע מוקף בקשת בלונים
  const eventVip = () => (
    <svg width="100%" height="104" viewBox="0 0 200 108" aria-hidden="true" focusable="false">
      <SceneBackdrop />
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

  // איור בר חמצוצים: צנצנות אפותקרי עם מכסה-כיפה מלאות ממתקים + מגדל ממתקים + צנצנת מקלות
  const candyColor = (k: number) => (k % 3 === 0 ? gold : k % 3 === 1 ? soft : ART.sage);
  const apothecaryJar = (x: number, h: number, w: number) => {
    const base = 87;
    const top = base - h;
    const dots: [number, number, number][] = [];
    const rows = Math.floor((h - 6) / 4.6);
    for (let r = 0; r < rows; r++) {
      const yy = base - 4 - r * 4.6;
      const cols = w > 15 ? 3 : 2;
      const span = w - 8;
      for (let c = 0; c < cols; c++) dots.push([x - span / 2 + (c * span) / (cols - 1), yy, dots.length]);
    }
    return (
      <g key={`jar${x}`}>
        <path d={`M${x - w / 2} ${top + 5} Q${x - w / 2 - 1.5} ${base} ${x} ${base} Q${x + w / 2 + 1.5} ${base} ${x + w / 2} ${top + 5} Z`} fill={cream} stroke={gold} strokeWidth="0.7" opacity="0.96" />
        {dots.map(([dx, dy, k]) => <circle key={k} cx={dx} cy={dy} r="1.9" fill={candyColor(k)} opacity="0.9" />)}
        <rect x={x - w * 0.3} y={top} width={w * 0.6} height="3.4" rx="0.8" fill={cream} stroke={gold} strokeWidth="0.5" />
        <path d={`M${x - w * 0.37} ${top} Q${x} ${top - w * 0.6} ${x + w * 0.37} ${top} Z`} fill={soft} stroke={gold} strokeWidth="0.6" />
        <circle cx={x} cy={top - w * 0.48} r="1.7" fill={gold} />
      </g>
    );
  };
  const bar = () => (
    <svg width="100%" height="104" viewBox="0 0 200 108" aria-hidden="true" focusable="false">
      <SceneBackdrop />
      <GroundShadow cx={100} cy={92} rx={80} ry={3.6} />
      <rect x="14" y="87" width="172" height="7" rx="2" fill={soft} stroke={gold} strokeWidth="0.6" />
      {apothecaryJar(38, 42, 19)}
      {apothecaryJar(63, 33, 15)}
      {/* מגדל ממתקים דו-קומתי */}
      <g>
        <rect x="105" y="58" width="3" height="29" fill={gold} />
        <ellipse cx="106.5" cy="86" rx="20" ry="3.6" fill={cream} stroke={gold} strokeWidth="0.6" />
        {[92, 99, 106, 113, 121].map((cx, k) => <circle key={`t1${k}`} cx={cx} cy={82} r="2.5" fill={candyColor(k)} />)}
        <ellipse cx="106.5" cy="58" rx="12" ry="3" fill={cream} stroke={gold} strokeWidth="0.6" />
        {[99, 106, 113].map((cx, k) => <circle key={`t2${k}`} cx={cx} cy={54.5} r="2.5" fill={candyColor(k + 1)} />)}
      </g>
      {/* צנצנת מקלות (breadsticks/לוליפופ) */}
      <g>
        <rect x="142" y="60" width="13" height="27" rx="1.5" fill={cream} stroke={gold} strokeWidth="0.6" opacity="0.95" />
        {[145, 148.5, 152].map((sx, k) => <line key={k} x1={sx} y1="62" x2={sx + (k - 1) * 1.5} y2="40" stroke={k % 2 ? gold : soft} strokeWidth="1.4" strokeLinecap="round" />)}
        {[145, 148.5, 152].map((sx, k) => <circle key={`b${k}`} cx={sx + (k - 1) * 1.5} cy="40" r="2" fill={candyColor(k)} />)}
      </g>
      {/* זר משי לעיצוב הבר */}
      <Bouquet cx={173} cy={66} s={0.7} />
      <path d="M168 78 Q167 86 170 87 L176 87 Q179 86 178 78 Z" fill={cream} stroke={soft} strokeWidth="0.5" />
    </svg>
  );

  // קופסת מתנה ממותגת עם סרט ופפיון
  const giftBox = (x: number, y: number, w: number, h: number, c: string, key: string) => (
    <g key={key}>
      <rect x={x} y={y} width={w} height={h} rx="1.5" fill={c} opacity="0.92" stroke={gold} strokeWidth="0.5" />
      <rect x={x + w / 2 - 1.3} y={y} width="2.6" height={h} fill={cream} opacity="0.85" />
      <path d={`M${x + w / 2} ${y} q -5 -4 -6.5 0 q 4 1 6.5 0 q 2.5 1 6.5 0 q -1.5 -4 -6.5 0`} fill={cream} stroke={gold} strokeWidth="0.4" />
    </g>
  );
  // איור בר ממותג: מדליון מונוגרמה מרכזי + קופסאות מתנה ממותגות + בקבוקים ממותגים
  const barBranded = () => (
    <svg width="100%" height="104" viewBox="0 0 200 108" aria-hidden="true" focusable="false">
      <SceneBackdrop />
      <GroundShadow cx={100} cy={92} rx={80} ry={3.6} />
      <rect x="14" y="87" width="172" height="7" rx="2" fill={soft} stroke={gold} strokeWidth="0.6" />

      {/* מדליון מונוגרמה מרכזי על מעמד, מוקף זר עלים */}
      <rect x="98.5" y="55" width="3" height="32" fill="url(#ldPost)" />
      <circle cx="100" cy="40" r="15" fill={cream} stroke={gold} strokeWidth="1.3" />
      <circle cx="100" cy="40" r="11.5" fill="none" stroke={soft} strokeWidth="0.7" />
      {/* זר עלים סביב המדליון */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return <Leaf key={`w${i}`} cx={100 + Math.cos(a) * 15} cy={40 + Math.sin(a) * 15} rot={(a * 180) / Math.PI + 90} len={4.5} />;
      })}
      {/* פלוריש מונוגרמה מסוגנן */}
      <path d="M96 45 q4 -12 0 -12 q-4 6 4 6 q4 0 0 6" fill="none" stroke={gold} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M104 45 q-4 -12 0 -12 q4 6 -4 6 q-4 0 0 6" fill="none" stroke={gold} strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
      {/* פרחים בבסיס המדליון */}
      <Rose cx={90} cy={64} r={3.4} fill={gold} />
      <Rose cx={110} cy={64} r={3.4} fill={soft} />
      <Rose cx={100} cy={66} r={2.8} fill={soft} />

      {/* קופסאות מתנה מוערמות משמאל */}
      {giftBox(34, 67, 26, 20, gold, 'gb1')}
      {giftBox(40, 53, 16, 14, soft, 'gb2')}

      {/* בקבוקים ממותגים מימין */}
      {[150, 164].map((x, i) => (
        <g key={`btl${i}`}>
          <path d={`M${x - 3.5} 87 L${x - 3.5} 64 Q${x - 3.5} 60 ${x - 1.5} 58 L${x - 1.5} 51 L${x + 1.5} 51 L${x + 1.5} 58 Q${x + 3.5} 60 ${x + 3.5} 64 L${x + 3.5} 87 Z`} fill={i ? soft : cream} stroke={gold} strokeWidth="0.6" opacity="0.95" />
          <rect x={x - 3.5} y="70" width="7" height="9" fill={cream} stroke={gold} strokeWidth="0.4" opacity="0.9" />
          <line x1={x - 2} y1="74" x2={x + 2} y2="74" stroke={gold} strokeWidth="0.5" />
        </g>
      ))}
    </svg>
  );

  // מעמד קינוחים מדורג (מקרונים) — עמוד + מגשים יורדים
  const dessertStand = (x: number, tiers: { dy: number; rx: number }[], key: string) => {
    const base = 87;
    const topDy = tiers[tiers.length - 1].dy;
    return (
      <g key={key}>
        <rect x={x - 1.5} y={base - topDy} width="3" height={topDy} fill="url(#ldPost)" />
        <ellipse cx={x} cy={base} rx={tiers[0].rx * 0.55} ry="1.6" fill={soft} stroke={gold} strokeWidth="0.5" />
        {tiers.map((t, i) => (
          <g key={i}>
            <ellipse cx={x} cy={base - t.dy} rx={t.rx} ry="2.6" fill={cream} stroke={gold} strokeWidth="0.6" />
            {Array.from({ length: Math.max(2, Math.round(t.rx / 3.4)) }).map((_, k, arr) => {
              const span = t.rx * 2 - 5;
              const dx = -span / 2 + (k * span) / (arr.length - 1 || 1);
              return <circle key={k} cx={x + dx} cy={base - t.dy - 2.6} r="2.1" fill={k % 3 === 0 ? gold : k % 3 === 1 ? soft : ART.deep} opacity="0.9" />;
            })}
          </g>
        ))}
        <circle cx={x} cy={base - topDy - 1.5} r="2" fill={gold} />
      </g>
    );
  };
  // גביע שמפניה — גביע צר, רגל ובסיס + בועות
  const flute = (x: number, key: string) => (
    <g key={key}>
      <path d={`M${x - 2.8} 56 Q${x} 70 ${x} 70 Q${x} 70 ${x + 2.8} 56 Z`} fill="url(#ldFabric)" stroke={gold} strokeWidth="0.6" opacity="0.85" />
      <line x1={x} y1="70" x2={x} y2="84" stroke={gold} strokeWidth="0.8" />
      <ellipse cx={x} cy="85" rx="3" ry="0.9" fill={soft} stroke={gold} strokeWidth="0.4" />
      {[60, 63.5, 66].map((by, k) => <circle key={k} cx={x + (k % 2 ? 0.8 : -0.8)} cy={by} r="0.6" fill={gold} opacity="0.7" />)}
    </g>
  );
  // איור בר בוטיק: 2 מעמדי קינוחים מדורגים + גביעי שמפניה + זר גבוה
  const barBoutique = () => (
    <svg width="100%" height="104" viewBox="0 0 200 108" aria-hidden="true" focusable="false">
      <SceneBackdrop />
      <GroundShadow cx={100} cy={92} rx={80} ry={3.6} />
      <rect x="14" y="87" width="172" height="7" rx="2" fill={soft} stroke={gold} strokeWidth="0.6" />
      {dessertStand(48, [{ dy: 6, rx: 18 }, { dy: 24, rx: 13 }, { dy: 40, rx: 8 }], 'st1')}
      {dessertStand(104, [{ dy: 6, rx: 14 }, { dy: 22, rx: 9 }], 'st2')}
      {flute(138, 'fl1')}
      {flute(147, 'fl2')}
      {/* זר גבוה באגרטל */}
      <path d="M168 87 Q166 70 169 66 L177 66 Q180 70 178 87 Z" fill={cream} stroke={gold} strokeWidth="0.6" />
      <Bouquet cx={173} cy={56} s={0.78} />
    </svg>
  );

  // איור "שוק חינה": שקי יוטה עם פיצוחים + כף עץ + נר אווירה
  const hennaMarket = () => (
    <svg width="100%" height="104" viewBox="0 0 200 108" aria-hidden="true" focusable="false">
      <SceneBackdrop />
      <GroundShadow cx={100} cy={92} rx={78} ry={4} />
      {[
        { x: 44, w: 30, h: 32 },
        { x: 82, w: 36, h: 40 },
        { x: 126, w: 30, h: 32 }
      ].map((s, i) => {
        const top = 86 - s.h;
        const mid = s.x + s.w / 2;
        return (
          <g key={`sack${i}`}>
            <path d={`M${s.x} ${top + 6} Q${s.x - 3} 86 ${s.x + 7} 86 L${s.x + s.w - 7} 86 Q${s.x + s.w + 3} 86 ${s.x + s.w} ${top + 6} Z`} fill={soft} stroke={gold} strokeWidth="0.6" opacity="0.9" />
            <line x1={mid} y1={top + 10} x2={mid} y2="84" stroke={gold} strokeOpacity="0.3" strokeWidth="0.6" />
            <path d={`M${s.x - 1} ${top + 6} Q${mid} ${top - 3} ${s.x + s.w + 1} ${top + 6} Q${mid} ${top + 12} ${s.x - 1} ${top + 6} Z`} fill={cream} stroke={gold} strokeWidth="0.5" />
            {[[-5, 5], [3, 4], [-1, 8], [6, 8], [-7, 8]].map(([dx, dy], k) => (
              <circle key={k} cx={mid + dx} cy={top + 4 + dy} r="1.9" fill={k % 2 ? gold : ART.deep} opacity="0.85" />
            ))}
          </g>
        );
      })}
      {/* כף עץ נשענת */}
      <line x1="160" y1="84" x2="173" y2="58" stroke={ART.deep} strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="175" cy="55" rx="5" ry="3.2" fill={cream} stroke={gold} strokeWidth="0.6" transform="rotate(24 175 55)" />
      {/* נר אווירה */}
      <PillarCandle x={26} base={86} h={14} w={6} />
    </svg>
  );

  switch (type) {
    case 'chuppah-s':
      return chuppahCurtains('s');
    case 'chuppah-m':
      return chuppahCurtains('m');
    case 'chuppah-l':
      return chuppahCurtains('l');
    case 'chuppah-drapes':
      return chuppahDrapes();
    case 'gypsophila':
      return gypsophila();
    case 'henna':
      return henna();
    case 'henna-market':
      return hennaMarket();
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
    case 'bar-branded':
      return barBranded();
    case 'bar-boutique':
      return barBoutique();
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
  const { user, signOut } = useAuth();
  const { overrides } = usePackages();

  // קטלוג אפקטיבי: חבילות הבסיס לאחר דריסות + חבילות חדשות שנוצרו בניהול
  const packages = React.useMemo(() => buildCatalog(PACKAGES, overrides), [overrides]);

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
    compositesCount: '',
    spongeCount: '',
    referralSource: '',
    referralDetail: ''
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

  // עריכת שורות הזמנה בידי המנהל: לכל שורה (חבילה/תוספת) טקסט ו/או סכום חלופיים.
  // מפתחות: `pkg:<id>` / `addon:<id>`. ריק = ערך ברירת המחדל.
  const [lineEdits, setLineEdits] = useState<Record<string, { label?: string; amount?: number }>>({});

  // חבילות נבחרות (ללא ברירת מחדל — הלקוח בוחר. ניתן לבחור יותר מאחת, גם בין קטגוריות)
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
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

  // הזמנה נשלחה (guest checkout) — מציגים מסך הצלחה עם הצעה אופציונלית ליצור חשבון
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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

  const selectedPackages = packages.filter(p => selectedPackageIds.includes(p.id));

  const hasWeddingPackage = selectedPackages.some(p => p.category === CATEGORIES.WEDDING);
  const hasBarPackage = selectedPackages.some(p => p.category === CATEGORIES.BARS);

  // מחיר חבילה בודדת (כולל מדרגת שולחנות אם קיימת לחבילה)
  const packagePrice = (pkg: Package) =>
    pkg.pricingTiers && pkg.pricingTiers[selectedTableTier]
      ? pkg.pricingTiers[selectedTableTier]
      : pkg.price;

  // --- עריכת שורות בידי המנהל (טקסט + סכום) ---
  const pkgKey = (id: string) => `pkg:${id}`;
  const addonKey = (id: string) => `addon:${id}`;

  // תווית/סכום אפקטיביים: דריסת המנהל אם קיימת, אחרת ברירת המחדל
  const lineLabel = (key: string, fallback: string) => {
    const e = lineEdits[key];
    return isAdmin && e && e.label !== undefined ? e.label : fallback;
  };
  const lineAmount = (key: string, fallback: number) => {
    const e = lineEdits[key];
    return isAdmin && e && typeof e.amount === 'number' ? Math.max(0, e.amount) : fallback;
  };

  // תווית ברירת מחדל לחבילה (כולל מדרגת שולחנות) — לשימוש בעריכה ובהסכם
  const defaultPkgLabel = (pkg: Package) =>
    pkg.pricingTiers ? `${pkg.title} (${selectedTableTier} שולחנות)` : pkg.title;

  // סכום אפקטיבי לחבילה / לשורת תוספת (לפי דריסת מנהל)
  const effPackageAmount = (pkg: Package) => lineAmount(pkgKey(pkg.id), packagePrice(pkg));

  // עדכון עריכות שורה
  const setLineLabel = (key: string, label: string) =>
    setLineEdits(prev => ({ ...prev, [key]: { ...prev[key], label } }));
  const setLineAmount = (key: string, value: string) =>
    setLineEdits(prev => ({
      ...prev,
      [key]: { ...prev[key], amount: value.trim() === '' ? undefined : Math.max(0, parseFloat(value) || 0) }
    }));
  const resetLine = (key: string) =>
    setLineEdits(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

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
  // סכום שורת תוספת אפקטיבי (כולל דריסת מנהל)
  const effAddonAmount = (a: Addon & { qty: number }) => lineAmount(addonKey(a.id), a.price * a.qty);
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + effAddonAmount(a), 0);

  // פריטים שזכאים להטבת ה-₪500: נבחרו ואינם כוללים פרחים
  const giftEligibleAddons = selectedAddons.filter(a => !a.hasFlowers);

  // האם אחת מהחבילות שנבחרו זכאית להטבת ₪500, והאם הוזן קוד תקין
  const isCouponEligible = selectedPackages.some(p => p.benefits.includes('₪500'));
  const isCouponValid = isCouponEligible && couponCode.trim() === COUPON_CODE;

  // הפריט שעליו ממומשת ההטבה (חייב להיות זכאי) וההנחה בפועל (עד ₪500, לא יותר משווי הפריט
  // האפקטיבי — כולל עריכת מנהל)
  const giftAddon = giftEligibleAddons.find(a => a.id === giftAddonId);
  const couponDiscount = isCouponValid && giftAddon
    ? Math.min(COUPON_VALUE, effAddonAmount(giftAddon))
    : 0;

  // חישוב מחירים
  const getPricing = () => {
    const basePrice = selectedPackages.reduce((sum, p) => sum + effPackageAmount(p), 0);
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
      price: Math.max(0, parseFloat(newUpgradePrice) || 0)
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

  // טקסט "איך הגעת אלינו" לתצוגה ולשמירה (מקור + פירוט שם האולם/הממליץ)
  const referralText = () => {
    if (!clientInfo.referralSource) return '';
    const base = t(`step1.referral_${clientInfo.referralSource}`);
    const detail = clientInfo.referralDetail.trim();
    return detail ? `${base} — ${detail}` : base;
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
      // טלפון: חובה + ולידציה של מספר ישראלי תקין
      //   נייד 05X-XXXXXXX (10 ספרות) או קווי 0X-XXXXXXX (9 ספרות), כולל +972
      const isPhoneValid = (p: string) => {
        let d = p.replace(/\D/g, '');
        if (d.startsWith('972')) d = '0' + d.slice(3);
        return /^0\d{8,9}$/.test(d);
      };
      if (!clientInfo.groomPhone.trim()) tempErrors.groomPhone = t('errors.groomPhoneRequired');
      else if (!isPhoneValid(clientInfo.groomPhone)) tempErrors.groomPhone = t('errors.phoneInvalid');
      if (!clientInfo.bridePhone.trim()) tempErrors.bridePhone = t('errors.bridePhoneRequired');
      else if (!isPhoneValid(clientInfo.bridePhone)) tempErrors.bridePhone = t('errors.phoneInvalid');
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

    // Guest checkout — אין צורך בחשבון. אם הלקוח לא מחובר, ההזמנה נשמרת כאורח (RLS מתיר),
    // והוא יכול לבחור אחר כך ליצור חשבון כדי לעקוב (ההזמנה תשויך לפי האימייל המאומת).
    if (!isSupabaseConfigured) {
      window.print();
      setOrderSubmitted(true);
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
          packageTitle: selectedPackages.map(p => lineLabel(pkgKey(p.id), p.title)).join(' + '),
          tableTier: selectedPackages.some(p => p.pricingTiers) ? selectedTableTier : null,
          compositesCount: clientInfo.compositesCount,
          spongeCount: clientInfo.spongeCount,
          referralSource: clientInfo.referralSource,
          referralDetail: clientInfo.referralDetail.trim(),
          includeDelivery,
          upgrades: [
            ...customUpgrades.map(u => ({ description: u.description, price: u.price })),
            ...selectedAddons.map(a => ({ description: lineLabel(addonKey(a.id), addonLineDescription(a)), price: effAddonAmount(a) }))
          ],
          basePrice: pricing.basePrice,
          upgradesTotal: pricing.upgradesTotal + pricing.addonsTotal,
          deliveryPrice: pricing.deliveryPrice,
          couponCode: isCouponValid ? couponCode.trim() : '',
          couponDiscount: pricing.couponDiscount,
          totalPrice: pricing.totalPrice,
          groomSignDate,
          brideSignDate,
          status: isAdmin ? adminInfo.status : 'new',
          orderSource: isAdmin ? adminInfo.source : '',
          receivedBy: isAdmin ? adminInfo.receivedBy : '',
          internalNotes: isAdmin ? adminInfo.internalNotes.trim() : '',
          adminDiscount: pricing.adminDiscount
        },
        groomSignatureDataUrl,
        brideSignatureDataUrl
      );
      window.print();
      setOrderSubmitted(true);
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
    // קנה-מידה בין גודל התצוגה (w-full) לרזולוציה הפנימית של הקנבס (350×96) —
    // אחרת החתימה מצוירת בהיסט/דחיסה אופקית בכל רוחב מסך שאינו 350px בדיוק.
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-gray-800 font-sans antialiased pb-12 overflow-x-hidden selection:bg-[#B29259] selection:text-white animate-fadeIn" dir={dir}>
      <ArtDefsHost />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:start-2 focus:bg-[#B29259] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-bold"
      >
        {t('a11y.skip')}
      </a>

      {/* --- לוגו וכותרת ראשית --- */}
      <header className="bg-white border-b border-[#EAE3D2] shadow-sm sticky top-0 z-50 no-print">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label={t('nav.home')}>
            <div className="bg-[#B29259] text-white p-2 rounded-full shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <div className="text-start">
              <h1 className="text-xl sm:text-2xl font-bold text-[#8C6D3F] font-serif tracking-wide">LD Event Design</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{t('brand.tagline')}</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-[#B29259] px-2 py-1.5" title={t('nav.home')}>
              <Home className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('nav.home')}</span>
            </Link>
            {user && (
              <button type="button" onClick={() => signOut()} className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-red-500 px-2 py-1.5" title={t('nav.logout')}>
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('nav.logout')}</span>
              </button>
            )}
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
            <a href="tel:+972545740423" className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 hover:text-[#B29259] bg-[#FAF7F2] py-1.5 px-3 rounded-full border border-[#EAE3D2] hover:border-[#B29259] transition-colors">
              <Phone className="w-4 h-4 text-[#B29259]" aria-hidden="true" />
              <span className="font-bold" dir="ltr">{t('brand.phone')}</span>
            </a>
          </div>
        </div>
      </header>

      {/* --- כפתור חזרה עליון (תמיד גלוי): שלב 1 → דף הבית · שלבים 2-3 → השלב הקודם --- */}
      <div className="max-w-4xl mx-auto px-4 pt-4 no-print">
        {currentStep === 1 ? (
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-[#B29259] transition-colors">
            {lang === 'he' ? <ArrowRight className="w-4 h-4" aria-hidden="true" /> : <ArrowLeft className="w-4 h-4" aria-hidden="true" />}
            {t('step1.backHome')}
          </Link>
        ) : (
          <button type="button" onClick={handleBack} className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-[#B29259] transition-colors">
            {lang === 'he' ? <ArrowRight className="w-4 h-4" aria-hidden="true" /> : <ArrowLeft className="w-4 h-4" aria-hidden="true" />}
            {t('nav.back')}
          </button>
        )}
      </div>

      {/* --- מד התקדמות השלבים --- */}
      <div className="max-w-4xl mx-auto px-4 pt-4 no-print">
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

              {/* איך הגעת אלינו? — שדה לא חובה, גלוי בשני המצבים. אפשרות אולם/ממליץ פותחת תיבת שם */}
              <div className="sm:col-span-2">
                <label htmlFor="f-referral" className="block text-xs font-bold text-gray-700 mb-1.5">{t('step1.referral')}</label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Building2 className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <select
                    id="f-referral"
                    value={clientInfo.referralSource}
                    onChange={(e) => setClientInfo({ ...clientInfo, referralSource: e.target.value, referralDetail: '' })}
                    className="w-full ps-9 pe-3 py-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all"
                  >
                    <option value="">{t('step1.referralPh')}</option>
                    {['venue', 'recommendation', 'instagram', 'facebook', 'google', 'other'].map((s) => (
                      <option key={s} value={s}>{t(`step1.referral_${s}`)}</option>
                    ))}
                  </select>
                </div>
                {(clientInfo.referralSource === 'venue' || clientInfo.referralSource === 'recommendation' || clientInfo.referralSource === 'other') && (
                  <input
                    type="text"
                    value={clientInfo.referralDetail}
                    onChange={(e) => setClientInfo({ ...clientInfo, referralDetail: e.target.value })}
                    placeholder={clientInfo.referralSource === 'venue' ? t('step1.referralVenueNamePh') : t('step1.referralDetailNamePh')}
                    aria-label={clientInfo.referralSource === 'venue' ? t('step1.referralVenueName') : t('step1.referralDetailName')}
                    className="mt-2 w-full px-3 py-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all animate-fadeIn"
                  />
                )}
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
                className="sheen bg-[#B29259] hover:bg-[#8C6D3F] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
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
              {packages.filter(p => p.category === activeCategory).map((pkg) => {
                const isSelected = selectedPackageIds.includes(pkg.id);

                const currentPrice = packagePrice(pkg);
                const Lp = L(pkg);

                return (
                  <div
                    key={pkg.id}
                    onClick={() => togglePackage(pkg)}
                    className={`card-hover bg-white rounded-2xl border-2 p-5 flex flex-col justify-between cursor-pointer relative ${
                      isSelected
                        ? 'border-[#B29259] shadow-md ring-1 ring-[#B29259]/20'
                        : 'border-[#EAE3D2]'
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
                      {/* תמונה שהועלתה בניהול, או איור וקטורי כברירת מחדל */}
                      <div className="ld-illus bg-[#FAF7F2] rounded-xl p-3 mb-3 flex items-center justify-center border border-[#FAF7F2] overflow-hidden">
                        {pkg.image ? (
                          <img src={pkg.image} alt={Lp.title} loading="lazy" className="h-[104px] w-full object-cover rounded-lg" />
                        ) : (
                          renderPackageSVG(pkg.svgType)
                        )}
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
                    <label htmlFor="f-composites" className="block text-xs font-bold text-gray-700 mb-1">{t('step2.compositesCount')}</label>
                    <input
                      id="f-composites"
                      type="number"
                      min="0"
                      value={clientInfo.compositesCount}
                      onChange={(e) => setClientInfo({ ...clientInfo, compositesCount: e.target.value })}
                      placeholder={t('step2.tablesCountPh')}
                      className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    />
                  </div>

                  <div>
                    <label htmlFor="f-sponge" className="block text-xs font-bold text-gray-700 mb-1">{t('step2.spongeCount')}</label>
                    <input
                      id="f-sponge"
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
                className="sheen bg-[#B29259] hover:bg-[#8C6D3F] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
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

            {/* הובלה והרכבה — קלט (לא מודפס; ההובלה מופיעה בסיכום הכספי) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAE3D2] space-y-5 no-print">
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
                    <label htmlFor="f-upgrade-desc" className="block text-[10px] font-bold text-gray-600 mb-1">{t('step3.upgradeDesc')}</label>
                    <input
                      id="f-upgrade-desc"
                      type="text"
                      value={newUpgradeDesc}
                      onChange={(e) => setNewUpgradeDesc(e.target.value)}
                      placeholder={t('step3.upgradeDescPh')}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    />
                  </div>
                  <div className="sm:w-32">
                    <label htmlFor="f-upgrade-price" className="block text-[10px] font-bold text-gray-600 mb-1">{t('step3.upgradePrice')}</label>
                    <input
                      id="f-upgrade-price"
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

            {/* תוספות ושדרוגים לחבילות שנבחרו (קטלוג עם כמויות) — קלט, לא מודפס */}
            {activeAddons.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAE3D2] space-y-4 no-print">
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

            {/* קוד קופון — ₪500 מתנה לפריט תוספת אחד (ללא פרחים) — קלט, לא מודפס */}
            {isCouponEligible && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAE3D2] space-y-4 no-print">
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
                  <label htmlFor="f-coupon" className="block text-[10px] font-bold text-gray-600 mb-1">{t('step3.couponLabel')}</label>
                  <input
                    id="f-coupon"
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
                            {addonLineDescription(a)} (₪{effAddonAmount(a).toLocaleString()})
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

            {/* עריכת שורות ההזמנה — מנהל (טקסט + סכום לכל שורה). מוסתר בהדפסה */}
            {isAdmin && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAE3D2] space-y-4 no-print">
                <div>
                  <h3 className="text-base font-bold text-[#8C6D3F] flex items-center gap-1.5">
                    <Pencil className="w-4.5 h-4.5 text-[#B29259]" aria-hidden="true" />
                    {t('admin.editLinesTitle')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{t('admin.editLinesSub')}</p>
                </div>

                {selectedPackages.length === 0 && selectedAddons.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">{t('admin.noEditableLines')}</p>
                ) : (
                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                    {[
                      ...selectedPackages.map((p) => ({
                        key: pkgKey(p.id),
                        defaultLabel: defaultPkgLabel(p),
                        defaultAmount: packagePrice(p),
                        onRemove: () => togglePackage(p)
                      })),
                      ...selectedAddons.map((a) => ({
                        key: addonKey(a.id),
                        defaultLabel: addonLineDescription(a),
                        defaultAmount: a.price * a.qty,
                        onRemove: () => updateAddonQty(a.id, '0')
                      }))
                    ].map((row) => {
                      const edited = !!lineEdits[row.key];
                      return (
                        <div key={row.key} className="flex flex-col sm:flex-row gap-2 sm:items-end p-3">
                          <div className="flex-1 min-w-0">
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">{t('admin.lineLabelField')}</label>
                            <input
                              type="text"
                              value={lineLabel(row.key, row.defaultLabel)}
                              onChange={(e) => setLineLabel(row.key, e.target.value)}
                              aria-label={`${t('admin.lineLabelField')} — ${row.defaultLabel}`}
                              className="w-full px-3 py-2 bg-[#FAF7F2] border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                            />
                          </div>
                          <div className="sm:w-28">
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">{t('admin.linePriceField')}</label>
                            <input
                              type="number"
                              min="0"
                              value={lineEdits[row.key]?.amount ?? ''}
                              placeholder={row.defaultAmount.toLocaleString()}
                              onChange={(e) => setLineAmount(row.key, e.target.value)}
                              aria-label={`${t('admin.linePriceField')} — ${row.defaultLabel}`}
                              className="w-full px-3 py-2 bg-[#FAF7F2] border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                            />
                          </div>
                          <div className="flex items-center gap-1 self-end">
                            {edited && (
                              <button
                                type="button"
                                onClick={() => resetLine(row.key)}
                                title={t('admin.linePriceReset')}
                                aria-label={t('admin.linePriceReset')}
                                className="text-gray-400 hover:text-[#B29259] p-1.5 rounded-md transition-colors"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={row.onRemove}
                              title={t('admin.removeLine')}
                              aria-label={t('admin.removeLine')}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* תמחור ידני — מנהל */}
            {isAdmin && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAE3D2] space-y-4 no-print">
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

            {/* סיכום חוזה רשמי והזמנה לחתונה — זהו המסמך המודפס (PDF) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAE3D2] space-y-6 print-contract">
              {/* כותרת ממותגת — מוצגת בהדפסה בלבד */}
              <div className="print-only mb-2 pb-4 border-b-2 border-[#B29259]">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-start">
                    <p className="font-serif text-2xl font-bold text-[#8C6D3F] tracking-wide">LD Event Design</p>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-semibold">{t('brand.tagline')}</p>
                  </div>
                  <div className="text-end text-[11px] text-gray-500 leading-relaxed">
                    <p className="font-bold text-[#8C6D3F]" dir="ltr">{t('brand.phone')}</p>
                    <p>{t('print.issued')}: {new Date().toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB')}</p>
                  </div>
                </div>
              </div>

              <div className="text-center pb-4 border-b border-gray-100">
                <FileText className="w-6 h-6 text-[#B29259] mx-auto mb-1 no-print" aria-hidden="true" />
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
                {clientInfo.referralSource && (
                  <div>
                    <span className="text-gray-400 font-medium">{t('step3.infoReferral')}</span>
                    <p className="font-bold text-gray-700 mt-0.5">{referralText()}</p>
                  </div>
                )}
                {/* שדות מנהל — מוצגים על המסך בלבד, לא בהסכם המודפס ללקוח */}
                {isAdmin && (
                  <>
                    <div className="no-print">
                      <span className="text-gray-400 font-medium">{t('admin.statusLabel')}</span>
                      <p className="font-bold text-gray-700 mt-0.5">{t(`admin.status_${adminInfo.status}`)}</p>
                    </div>
                    {adminInfo.source && (
                      <div className="no-print">
                        <span className="text-gray-400 font-medium">{t('admin.sourceLabel')}</span>
                        <p className="font-bold text-gray-700 mt-0.5">{t(`admin.source_${adminInfo.source}`)}</p>
                      </div>
                    )}
                    {adminInfo.receivedBy && (
                      <div className="no-print">
                        <span className="text-gray-400 font-medium">{t('admin.receivedLabel')}</span>
                        <p className="font-bold text-gray-700 mt-0.5">{t(`admin.received_${adminInfo.receivedBy}`)}</p>
                      </div>
                    )}
                    {adminInfo.internalNotes.trim() && (
                      <div className="col-span-2 no-print">
                        <span className="text-gray-400 font-medium">{t('admin.notesLabel')}</span>
                        <p className="font-bold text-gray-700 mt-0.5 whitespace-pre-wrap">{adminInfo.internalNotes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* פירוט כספי (משקף עריכות מנהל אם בוצעו) */}
              <div className="space-y-3 text-xs">
                {selectedPackages.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-gray-600">
                    <span>{lineLabel(pkgKey(p.id), defaultPkgLabel(p))}</span>
                    <span className="font-bold text-gray-800">₪{effPackageAmount(p).toLocaleString()}</span>
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
                    <span>{lineLabel(addonKey(a.id), addonLineDescription(a))}</span>
                    <span className="font-bold text-gray-800">₪{effAddonAmount(a).toLocaleString()}</span>
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
              <div className="bg-stone-50 rounded-xl p-4 border border-gray-200 text-right space-y-3 print-avoid-break">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-avoid-break">

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
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl no-print" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {t('errors.signatureRequired')}
                </div>
              )}

              {/* חתימת תודה ממותגת — בהדפסה בלבד */}
              <div className="print-only pt-4 mt-2 border-t border-[#EAE3D2] text-center">
                <p className="text-[11px] text-[#8C6D3F] font-bold">{t('print.thanks')}</p>
                <p className="text-[10px] text-gray-400 mt-0.5" dir="ltr">LD Event Design · {t('brand.phone')}</p>
              </div>
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

            {/* מסך הצלחה (לאחר שליחה) — guest checkout + הצעה אופציונלית ליצור חשבון */}
            {orderSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center no-print">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2">
                  <Check className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-emerald-800">{t('step3.submittedTitle')}</h3>
                <p className="text-xs text-emerald-700 mt-1">{t('step3.submittedSub')}</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Printer className="w-4 h-4" aria-hidden="true" />
                    {t('step3.printAgain')}
                  </button>
                  {isSupabaseConfigured && !user && (
                    <button
                      type="button"
                      onClick={() => setAuthModalOpen(true)}
                      className="sheen bg-[#B29259] hover:bg-[#8C6D3F] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors"
                    >
                      {t('step3.createAccountCta')}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* בקרי ניווט שלב 3 */
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
                  className="sheen bg-[#B29259] hover:bg-[#8C6D3F] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4" aria-hidden="true" />
                  {isSubmitting ? t('step3.submitting') : t('step3.submitIdle')}
                </button>
              </div>
            )}

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
          <p className="mt-1"><bdi dir="ltr">© {new Date().getFullYear()} LD EVENT DESIGN.</bdi> {t('footer.rights')}</p>
          <p className="mt-1">
            <a
              href={`https://wa.me/972587170978?text=${encodeURIComponent('היי ניסן, ראיתי אתר שעיצבת ואשמח לפרטים על בניית אתר 🙂')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#B29259] underline-offset-2 hover:underline transition-colors"
            >
              {t('footer.credit')}
            </a>
          </p>
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

      {/* הצעה אופציונלית ליצור חשבון לאחר שליחת ההזמנה (guest checkout) */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />

      {/* כפתור/וידג'ט נגישות צף */}
      <AccessibilityWidget onOpenStatement={() => setLegalModal('accessibility')} />

      {/* כפתור וואטסאפ צף */}
      <WhatsAppButton />
    </div>
  );
}
