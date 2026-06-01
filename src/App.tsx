import React, { useState, useRef, useEffect } from 'react';
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
  Users
} from 'lucide-react';

// --- קטגוריות החבילות ---
const CATEGORIES = {
  WEDDING: 'חתונה',
  HENNA: 'חינה',
  EVENTS: 'אירועים (בר/בת מצווה, ברית/ה, יומולדת)'
} as const;

// --- טיפוסים ---
type Category = (typeof CATEGORIES)[keyof typeof CATEGORIES];

interface PackageDetails {
  chuppah?: string[];
  tables?: string[];
  bar?: string[];
  options?: string[];
  entrance?: string[];
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

// --- מאגר החבילות המלא ---
const PACKAGES: Package[] = [
  {
    id: 'classic-s',
    category: CATEGORIES.WEDDING,
    title: 'חבילת עיצוב חתונה - Classic S',
    subtitle: 'עיצוב חופה + 10 שולחנות מעוצבים',
    price: 2900,
    description: 'עיצוב קלאסי, אלגנטי ועל-זמני שמדבר את שפת הלב. שילוב מושלם של פרחים עשירים, נרות רכים ובדים זורמים ליצירת אווירה רומנטית ויוקרתית.',
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
    description: 'חבילה מושלמת לחתונה בגודל בינוני ומרשימה. עיצוב עשיר והרמוני שממלא את החלל באווירה חגיגית, טבעית ומרהיבה.',
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
    description: 'עיצוב בלתי נשכח, שיוצר רגעים של וואו מהכניסה ועד רחבת הריקודים. שפע של פרחים, תאורה רכה ונרות מהפנטים.',
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
    description: 'עיצוב אלגנטי ועדין בגבסוניות רכות בגוונים שונים, בשילוב נרות רומנטיים ליצירת אווירה קסומה ומלאת רגש.',
    benefits: 'הטבה בלעדית: ₪500 מתנה לשדרוג העיצוב!',
    details: {
      chuppah: [
        '2 חבקי פרחים צורת י׳ לעמודי החופה מגיבסניות',
        'בעיצוב של פחות מ-40 שולחנות, את הפרחים הנותרים נעצב בזר קשירה לכסאות בשביל החופה'
      ],
      tables: [
        'קומפוזיציה שילוב עשיר של פרחי גיבסניות ונרות בכל שולחן / סידור פרחים בספוג עגול'
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
    description: 'חופה מרהיבה עם בדים נשפכים, שדרת חופה רומנטית ומוארת, לעיצוב שיגרום לכל רגע להרגיש כמו חלום שמתגשם.',
    benefits: 'הטבה בלעדית: ₪500 מתנה לשדרוג העיצוב!',
    details: {
      chuppah: [
        '4 בדים קדמיים נשפכים ברמה גבוהה',
        '2 חבקי פרחים עשירים (צורת י׳) לעמודי החופה'
      ],
      options: [
        'בחירה בין: 6 חבקי פרחים קשורים לכסאות או שטיח לשידרת החופה עם נרות בצילינדרים'
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
    benefits: 'הטבה בלעדית: 2 דלי משי מרהיבים לעיצוב - מתנה ממני!',
    details: {
      bar: [
        'מבחר עשיר ומפואר של עוגיות מרוקאיות בעבודת יד מחומרי גלם מובחרים ביותר',
        'כלי הגשה ונחושת מלכותיים בעיצוב אותנטי ומפות מעוצבות בהתאמה אישית',
        'נרות רומנטיים ליצירת אווירה קסומה'
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
    benefits: 'הטבה בלעדית: 2 דלי משי מרהיבים לעיצוב - מתנה ממני!',
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
    description: 'עיצוב אירוע נקי ויוקרתי שיביא לאולם אווירה קלאסית ומהממת. מתאים לבריתות, ימי הולדת ובר/בת מצווה.',
    benefits: 'כולל שלט כניסה מעוצב ומותאם אישית בשילוב בלונים או פרחים!',
    details: {
      tables: ['עיצוב שולחנות אורחים: קומפוזיציות של בקבוקוני פרחים ונרות או סידורי ספוג נמוכים'],
      entrance: ['שלט כניסה מעוצב ומותאם אישית עם שובל בלונים עדין או תוספת פרחים חיים']
    },
    svgType: 'event',
    pricingTiers: { 10: 2900, 20: 4600, 30: 6300 }
  },
  {
    id: 'event-balloon',
    category: CATEGORIES.EVENTS,
    title: 'חבילת "בלון ארט" לאירועים',
    subtitle: 'המראה המודרני, החגיגי והצבעוני',
    price: 3200,
    description: 'לחגוג בענק ובצבע! אם אתם מחפשים אירוע תוסס, שמח ומלא באנרגיה, חבילת הבלונים שלנו תרים את האולם לגובה עם עיצוב מודרני ויצירתי.',
    benefits: 'כולל שער בלונים עשיר וחגיגי בכניסה לאולם!',
    details: {
      tables: ['עיצוב שולחנות אורחים: סידורי בלונים גבוהים ואמנותיים המעניקים אפקט וואו'],
      entrance: ['שלט כניסה מעוצב ומותאם אישית לבעל השמחה', 'שער בלונים עשיר ומעוצב בכניסה המוביל את האורחים פנימה']
    },
    svgType: 'event',
    pricingTiers: { 10: 3200, 20: 5200, 30: 7200 }
  },
  {
    id: 'event-vip',
    category: CATEGORIES.EVENTS,
    title: 'חבילת "הצגה" (VIP) - עמדת צילום יוקרה',
    subtitle: 'עיצוב שולחנות עשיר ועמדת צילום מטורפת',
    price: 4000,
    description: 'החבילה המושלמת למי שלא מתפשר על פחות ממושלם. משלבת שולחנות מעוצבים ועמדת צילום ענקית שתשאיר את האורחים עם מזכרת בלתי נשכחת.',
    benefits: 'עמדת צילום VIP מלאה עם קשת בלונים אמנותית, קיר רקע ואקססוריז!',
    details: {
      tables: ['עיצוב שולחנות אורחים: קומפוזיציות פרחים חיים או סידורי בלונים גבוהים ומעוצבים'],
      entrance: ['שלט כניסה מעוצב, נקי ואלגנטי בקבלה'],
      photoOp: ['עמדת צילום VIP מטורפת: קשת בלונים ענקית, קיר רקע מותאם, אקססוריז ונגיעות פרחים']
    },
    svgType: 'event',
    pricingTiers: { 10: 4000, 20: 6000, 30: 8000 }
  }
];

// --- איורים וקטוריים לכל סוג חבילה ---
// (שוחזר עקב קטיעת הקוד שהודבק — ניתן להחליף באיורים המקוריים)
function renderPackageSVG(type: string) {
  const gold = '#B29259';
  const soft = '#D8C29A';
  const cream = '#FAF7F2';

  // איור חופה בגדלים משתנים (S / M / L / בדים נשפכים)
  const chuppah = (flowers: number) => (
    <svg width="100%" height="92" viewBox="0 0 200 92" role="img" aria-label="עיצוב חופה">
      <rect x="38" y="20" width="7" height="62" rx="3" fill={gold} />
      <rect x="155" y="20" width="7" height="62" rx="3" fill={gold} />
      <path d="M41 22 Q100 4 158 22" stroke={gold} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M55 22 Q100 36 145 22 L145 30 Q100 46 55 30 Z" fill={soft} opacity="0.7" />
      {Array.from({ length: flowers }).map((_, i) => {
        const x = 50 + (i * (100 / Math.max(flowers - 1, 1)));
        return <circle key={i} cx={x} cy={24} r="5" fill={gold} opacity="0.9" />;
      })}
      <line x1="20" y1="82" x2="180" y2="82" stroke={gold} strokeWidth="2" opacity="0.4" />
    </svg>
  );

  // איור בר חינה / שוק
  const henna = () => (
    <svg width="100%" height="92" viewBox="0 0 200 92" role="img" aria-label="בר חינה">
      <rect x="30" y="55" width="140" height="14" rx="4" fill={gold} />
      <rect x="40" y="40" width="22" height="16" rx="3" fill={soft} />
      <rect x="72" y="34" width="22" height="22" rx="3" fill={gold} opacity="0.85" />
      <rect x="104" y="40" width="22" height="16" rx="3" fill={soft} />
      <circle cx="150" cy="46" r="11" fill={gold} opacity="0.85" />
      <rect x="36" y="69" width="128" height="8" rx="3" fill={cream} stroke={soft} />
    </svg>
  );

  // איור אירוע / בלונים
  const event = () => (
    <svg width="100%" height="92" viewBox="0 0 200 92" role="img" aria-label="עיצוב אירוע">
      <circle cx="70" cy="28" r="14" fill={gold} opacity="0.85" />
      <circle cx="96" cy="20" r="11" fill={soft} />
      <circle cx="120" cy="30" r="13" fill={gold} opacity="0.7" />
      <path d="M70 42 L96 31 M96 31 L120 43" stroke={gold} strokeWidth="1.5" opacity="0.6" />
      <rect x="60" y="60" width="80" height="10" rx="4" fill={gold} />
      <line x1="78" y1="50" x2="78" y2="60" stroke={soft} strokeWidth="2" />
      <line x1="118" y1="50" x2="118" y2="60" stroke={soft} strokeWidth="2" />
    </svg>
  );

  // איור גיבסניות (ענן פרחים רך)
  const gypsophila = () => (
    <svg width="100%" height="92" viewBox="0 0 200 92" role="img" aria-label="עיצוב גיבסניות">
      <rect x="40" y="22" width="6" height="58" rx="3" fill={gold} />
      <rect x="154" y="22" width="6" height="58" rx="3" fill={gold} />
      <path d="M43 24 Q100 6 157 24" stroke={gold} strokeWidth="5" fill="none" strokeLinecap="round" />
      {Array.from({ length: 26 }).map((_, i) => (
        <circle
          key={i}
          cx={48 + (i % 13) * 8.5}
          cy={i < 13 ? 22 : 30}
          r="3"
          fill={soft}
          opacity="0.85"
        />
      ))}
    </svg>
  );

  switch (type) {
    case 'chuppah-s':
      return chuppah(4);
    case 'chuppah-m':
      return chuppah(6);
    case 'chuppah-l':
      return chuppah(9);
    case 'chuppah-drapes':
      return chuppah(7);
    case 'gypsophila':
      return gypsophila();
    case 'henna':
      return henna();
    case 'event':
      return event();
    default:
      return (
        <div className="flex items-center justify-center h-[92px]">
          <Sparkles className="w-8 h-8 text-[#B29259]" />
        </div>
      );
  }
}

export default function App() {
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

  // חבילה נבחרת
  const [selectedPackageId, setSelectedPackageId] = useState('classic-s');
  const [selectedTableTier, setSelectedTableTier] = useState(10);

  // תוספות והובלה
  const [includeDelivery] = useState(true);
  const [customUpgrades, setCustomUpgrades] = useState<Upgrade[]>([]); // [{ id, description, price }]
  const [newUpgradeDesc, setNewUpgradeDesc] = useState('');
  const [newUpgradePrice, setNewUpgradePrice] = useState('');

  // שגיאות תקינות
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSignatureError, setShowSignatureError] = useState(false);

  // חתימות דיגיטליות (חתן וכלה בנפרד + תאריכים)
  const [isGroomSigned, setIsGroomSigned] = useState(false);
  const [isBrideSigned, setIsBrideSigned] = useState(false);
  const [groomSignDate, setGroomSignDate] = useState(new Date().toISOString().split('T')[0]);
  const [brideSignDate, setBrideSignDate] = useState(new Date().toISOString().split('T')[0]);

  const groomCanvasRef = useRef<HTMLCanvasElement>(null);
  const brideCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isGroomDrawing, setIsGroomDrawing] = useState(false);
  const [isBrideDrawing, setIsBrideDrawing] = useState(false);

  // שינוי חבילה אוטומטי בעת מעבר קטגוריה
  useEffect(() => {
    const available = PACKAGES.filter(p => p.category === activeCategory);
    if (available.length > 0) {
      setSelectedPackageId(available[0].id);
    }
  }, [activeCategory]);

  const selectedPackage = PACKAGES.find(p => p.id === selectedPackageId) || PACKAGES[0];

  // חישוב מחירים
  const getPricing = () => {
    let basePrice = selectedPackage.price;
    if (selectedPackage.pricingTiers && selectedPackage.pricingTiers[selectedTableTier]) {
      basePrice = selectedPackage.pricingTiers[selectedTableTier];
    }

    const upgradesTotal = customUpgrades.reduce((sum, item) => sum + (item.price || 0), 0);
    const deliveryPrice = includeDelivery ? 500 : 0;
    const totalPrice = basePrice + upgradesTotal + deliveryPrice;

    return {
      basePrice,
      upgradesTotal,
      deliveryPrice,
      totalPrice
    };
  };

  const pricing = getPricing();

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

  // בדיקת תקינות טופס שלב 1 (עם 2 מספרי טלפון חובה)
  const validateStep = (step: number) => {
    const tempErrors: Record<string, string> = {};
    if (step === 1) {
      if (!clientInfo.groomName.trim()) tempErrors.groomName = 'חובה להזין שם חתן';
      if (!clientInfo.brideName.trim()) tempErrors.brideName = 'חובה להזין שם כלה';
      if (!clientInfo.groomPhone.trim()) tempErrors.groomPhone = 'חובה להזין מספר טלפון חתן';
      if (!clientInfo.bridePhone.trim()) tempErrors.bridePhone = 'חובה להזין מספר טלפון כלה';
      if (!clientInfo.eventDate) tempErrors.eventDate = 'חובה להזין תאריך אירוע';
      if (!clientInfo.eventLocation.trim()) tempErrors.eventLocation = 'חובה להזין מיקום אולם/אירוע';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // אישור והדפסה — דורש חתימת חתן וכלה
  const handlePrint = () => {
    if (!isGroomSigned || !isBrideSigned) {
      setShowSignatureError(true);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }
    setShowSignatureError(false);
    window.print();
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
    <div className="min-h-screen bg-[#FAF7F2] text-gray-800 font-sans antialiased pb-12 selection:bg-[#B29259] selection:text-white animate-fadeIn" dir="rtl">

      {/* --- לוגו וכותרת ראשית --- */}
      <header className="bg-white border-b border-[#EAE3D2] shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#B29259] text-white p-2 rounded-full shadow-md">
              <Sparkles className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <div className="text-right">
              <h1 className="text-xl sm:text-2xl font-bold text-[#8C6D3F] font-serif tracking-wide">LD Event Design</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Making all dreams come true</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 bg-[#FAF7F2] py-1.5 px-3 rounded-full border border-[#EAE3D2]">
            <Phone className="w-4 h-4 text-[#B29259]" />
            <span className="font-bold">054-5740423</span>
          </div>
        </div>
      </header>

      {/* --- מד התקדמות השלבים --- */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EAE3D2] mb-6">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-100 z-0"></div>
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#B29259] transition-all duration-300 z-0"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            ></div>

            {[
              { step: 1, label: 'פרטי קשר ואירוע' },
              { step: 2, label: 'בחירת חבילת עיצוב' },
              { step: 3, label: 'חוזה, תוספות וחתימה' }
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center z-10 relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  currentStep >= item.step
                    ? 'bg-[#B29259] text-white ring-4 ring-[#FAF7F2] shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-400'
                }`}>
                  {currentStep > item.step ? <Check className="w-4 h-4" /> : item.step}
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
      <main className="max-w-4xl mx-auto px-4">

        {/* ================= שלב 1: פרטי החתן, הכלה והאירוע (עם 2 טלפונים חובה) ================= */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#EAE3D2] space-y-6 animate-fadeIn">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-[#8C6D3F] flex items-center gap-2">
                <Users className="w-5.5 h-5.5 text-[#B29259]" />
                הסכם והזמנה לחתונה - פרטי האירוע
              </h2>
              <p className="text-xs text-gray-500 mt-1">מלאו את פרטי החתן והכלה (שני מספרי הטלפון הינם חובה להשלמת ההסכם)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* שם החתן */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">שם החתן *</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={clientInfo.groomName}
                    onChange={(e) => setClientInfo({ ...clientInfo, groomName: e.target.value })}
                    placeholder="שם מלא של החתן"
                    className={`w-full pr-9 pl-3 py-2.5 bg-[#FAF7F2] border ${errors.groomName ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all`}
                  />
                </div>
                {errors.groomName && <p className="text-[10px] text-red-500 mt-1">{errors.groomName}</p>}
              </div>

              {/* שם הכלה */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">שם הכלה *</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={clientInfo.brideName}
                    onChange={(e) => setClientInfo({ ...clientInfo, brideName: e.target.value })}
                    placeholder="שם מלא של הכלה"
                    className={`w-full pr-9 pl-3 py-2.5 bg-[#FAF7F2] border ${errors.brideName ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all`}
                  />
                </div>
                {errors.brideName && <p className="text-[10px] text-red-500 mt-1">{errors.brideName}</p>}
              </div>

              {/* טלפון חתן - חובה */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">טלפון החתן *</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={clientInfo.groomPhone}
                    onChange={(e) => setClientInfo({ ...clientInfo, groomPhone: e.target.value })}
                    placeholder="טלפון נייד חתן"
                    className={`w-full pr-9 pl-3 py-2.5 bg-[#FAF7F2] border ${errors.groomPhone ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all`}
                  />
                </div>
                {errors.groomPhone && <p className="text-[10px] text-red-500 mt-1">{errors.groomPhone}</p>}
              </div>

              {/* טלפון כלה - חובה */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">טלפון הכלה *</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={clientInfo.bridePhone}
                    onChange={(e) => setClientInfo({ ...clientInfo, bridePhone: e.target.value })}
                    placeholder="טלפון נייד כלה"
                    className={`w-full pr-9 pl-3 py-2.5 bg-[#FAF7F2] border ${errors.bridePhone ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all`}
                  />
                </div>
                {errors.bridePhone && <p className="text-[10px] text-red-500 mt-1">{errors.bridePhone}</p>}
              </div>

              {/* תאריך אירוע */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">תאריך האירוע *</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="date"
                    value={clientInfo.eventDate}
                    onChange={(e) => setClientInfo({ ...clientInfo, eventDate: e.target.value })}
                    className={`w-full pr-9 pl-3 py-2.5 bg-[#FAF7F2] border ${errors.eventDate ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all`}
                  />
                </div>
                {errors.eventDate && <p className="text-[10px] text-red-500 mt-1">{errors.eventDate}</p>}
              </div>

              {/* מיקום האירוע */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">מיקום האירוע (אולם ועיר) *</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={clientInfo.eventLocation}
                    onChange={(e) => setClientInfo({ ...clientInfo, eventLocation: e.target.value })}
                    placeholder="לדוגמה: אולמי היער, חדרה"
                    className={`w-full pr-9 pl-3 py-2.5 bg-[#FAF7F2] border ${errors.eventLocation ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all`}
                  />
                </div>
                {errors.eventLocation && <p className="text-[10px] text-red-500 mt-1">{errors.eventLocation}</p>}
              </div>

              {/* אימייל */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">כתובת אימייל (רשות)</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full pr-9 pl-3 py-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B29259] text-sm text-gray-800 transition-all"
                  />
                </div>
              </div>

            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNext}
                className="bg-[#B29259] hover:bg-[#8C6D3F] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
              >
                המשך לבחירת חבילת עיצוב
                <ArrowLeft className="w-4 h-4" />
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
                  {cat}
                </button>
              ))}
            </div>

            {/* גריד חבילות דינמי */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {PACKAGES.filter(p => p.category === activeCategory).map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;

                const currentPrice = (pkg.pricingTiers && pkg.pricingTiers[selectedTableTier])
                  ? pkg.pricingTiers[selectedTableTier]
                  : pkg.price;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPackageId(pkg.id);
                      if (pkg.pricingTiers && !pkg.pricingTiers[selectedTableTier]) {
                        setSelectedTableTier(10);
                      }
                    }}
                    className={`bg-white rounded-2xl border-2 p-5 flex flex-col justify-between cursor-pointer transition-all relative ${
                      isSelected
                        ? 'border-[#B29259] shadow-md ring-1 ring-[#B29259]/20'
                        : 'border-[#EAE3D2] hover:border-gray-300'
                    }`}
                  >
                    {/* תג חבילה נבחרת */}
                    {isSelected && (
                      <span className="absolute -top-2.5 left-4 bg-[#B29259] text-white text-[10px] font-bold py-0.5 px-2.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        נבחרה
                      </span>
                    )}

                    <div>
                      {/* איור וקטורי */}
                      <div className="bg-[#FAF7F2] rounded-xl p-3 mb-3 flex items-center justify-center border border-[#FAF7F2]">
                        {renderPackageSVG(pkg.svgType)}
                      </div>

                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-800 leading-tight">{pkg.title}</h3>
                        <span className="text-[#B29259] font-black text-base whitespace-nowrap">₪{currentPrice.toLocaleString()}</span>
                      </div>

                      <p className="text-[11px] font-bold text-[#8C6D3F] mb-2">{pkg.subtitle}</p>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4">{pkg.description}</p>

                      {/* בורר שולחנות לחבילות אירועים */}
                      {pkg.pricingTiers && isSelected && (
                        <div className="mb-4 p-3 bg-stone-50 rounded-xl border border-[#EAE3D2]" onClick={(e) => e.stopPropagation()}>
                          <p className="text-[10px] font-bold text-[#8C6D3F] mb-1.5">בחרו את היקף האירוע (כמות שולחנות):</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[10, 20, 30].map((tier) => (
                              <button
                                key={tier}
                                onClick={() => setSelectedTableTier(tier)}
                                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                  selectedTableTier === tier
                                    ? 'bg-[#8C6D3F] text-white shadow-sm'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {tier} שולחנות
                                <span className="block text-[9px] font-normal opacity-90">₪{pkg.pricingTiers?.[tier]?.toLocaleString()}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* מפרט חבילה */}
                      <div className="bg-[#FAF7F2] rounded-xl p-3 space-y-2 border border-[#EAE3D2] text-[11px]">
                        <p className="font-bold text-gray-700 border-b border-gray-200 pb-1">מה כלול בחבילה?</p>

                        {pkg.details.chuppah && (
                          <div>
                            <span className="font-bold text-[#8C6D3F]">עיצוב חופה:</span>
                            <ul className="list-disc list-inside text-gray-600 mr-1.5 space-y-0.5">
                              {pkg.details.chuppah.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                          </div>
                        )}

                        {pkg.details.tables && (
                          <div>
                            <span className="font-bold text-[#8C6D3F]">עיצוב שולחן אורחים:</span>
                            <ul className="list-disc list-inside text-gray-600 mr-1.5 space-y-0.5">
                              {pkg.details.tables.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                          </div>
                        )}

                        {pkg.details.bar && (
                          <div>
                            <span className="font-bold text-[#8C6D3F]">עמדות אירוח ובר:</span>
                            <ul className="list-disc list-inside text-gray-600 mr-1.5 space-y-0.5">
                              {pkg.details.bar.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 mt-4 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        {pkg.benefits}
                      </span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-[#B29259] bg-[#B29259]' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* פרטים לבחירה אישית מתוך החוזה */}
            {activeCategory === CATEGORIES.WEDDING && (
              <div className="bg-white p-6 rounded-2xl border border-[#EAE3D2] shadow-sm space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-bold text-[#8C6D3F]">פרטים לבחירה אישית (מתוך החוזה)</h3>
                  <p className="text-[10px] text-gray-400">הגדירו את חלוקת סגנון השולחנות המבוקשת באירוע שלכם</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">קומפוזיציות פרחים ונרות</label>
                    <input
                      type="number"
                      value={clientInfo.compositesCount}
                      onChange={(e) => setClientInfo({ ...clientInfo, compositesCount: e.target.value })}
                      placeholder="הזינו מספר שולחנות"
                      className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">סידור ספוג לשולחן</label>
                    <input
                      type="number"
                      value={clientInfo.spongeCount}
                      onChange={(e) => setClientInfo({ ...clientInfo, spongeCount: e.target.value })}
                      placeholder="הזינו מספר שולחנות"
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
                <ArrowRight className="w-4 h-4" />
                חזור לפרטים
              </button>

              <button
                onClick={handleNext}
                className="bg-[#B29259] hover:bg-[#8C6D3F] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                המשך לתוספות וחתימה
                <ArrowLeft className="w-4 h-4" />
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
                  <Truck className="w-5 h-5 text-[#B29259]" />
                  שירות הובלה, הקמה ופירוק
                </h3>
                <p className="text-xs text-gray-500 mt-1">אחריות על הובלה, העמדה מקצועית ופירוק בסיום הערב</p>
              </div>

              <div
                className="flex items-center justify-between p-4 rounded-xl border bg-[#FAF7F2] border-[#B29259]"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Truck className="w-5 h-5 text-[#B29259]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">הובלה, הרכבה ופירוק מלא בכל חלקי הארץ</h4>
                    <p className="text-[11px] text-gray-500">פירוק ופינוי מלא של כל פריטי העיצוב מהאולם בסיום האירוע</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700">₪500</span>
                  <div className="w-5 h-5 rounded border bg-[#B29259] border-[#B29259] text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* הוספת שדרוגים ותמחור ידני על ידי הלקוח/מעצב */}
              <div className="border-t border-gray-100 pt-5 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                    <Plus className="w-4.5 h-4.5 text-[#B29259]" />
                    הוספת תוספות ושדרוגים (תמחור ידני)
                  </h3>
                  <p className="text-xs text-gray-500">הוסיפו כל תוספת שהיא, ורשמו באופן חופשי את המחיר שקבעתם מול הלקוח</p>
                </div>

                <form onSubmit={handleAddUpgrade} className="flex flex-col sm:flex-row gap-3 bg-[#FAF7F2] p-4 rounded-xl border border-[#EAE3D2]">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">תיאור השדרוג / תוספת</label>
                    <input
                      type="text"
                      value={newUpgradeDesc}
                      onChange={(e) => setNewUpgradeDesc(e.target.value)}
                      placeholder="לדוגמה: תוספת 5 שולחנות / סידורי פרחים נוספים"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    />
                  </div>
                  <div className="sm:w-32">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">מחיר שדרוג (₪)</label>
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
                    הוסף תוספת
                  </button>
                </form>

                {customUpgrades.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-gray-700">שדרוגים ותוספות שנוספו להזמנה:</p>
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
                              title="מחק תוספת"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic">לא הוזנו תוספות מיוחדות למעט חבילת הבסיס.</p>
                )}
              </div>
            </div>

            {/* סיכום חוזה רשמי והזמנה לחתונה */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAE3D2] space-y-6">
              <div className="text-center pb-4 border-b border-gray-100">
                <FileText className="w-6 h-6 text-[#B29259] mx-auto mb-1" />
                <h3 className="text-lg font-bold text-gray-800">הסכם והזמנה לחתונה - תנאי התקשרות</h3>
                <p className="text-xs text-gray-400">אנא ודאו את הפרטים וקראו את מדיניות הביטולים לפני החתימה</p>
              </div>

              {/* כרטיסיית פרטי אירוע (חתן כלה) */}
              <div className="grid grid-cols-2 gap-3 bg-[#FAF7F2] p-4 rounded-xl border border-[#EAE3D2] text-xs">
                <div>
                  <span className="text-gray-400 font-medium">שם החתן:</span>
                  <p className="font-bold text-gray-700 mt-0.5">{clientInfo.groomName}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">שם הכלה:</span>
                  <p className="font-bold text-gray-700 mt-0.5">{clientInfo.brideName}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">טלפון חתן:</span>
                  <p className="font-bold text-gray-700 mt-0.5">{clientInfo.groomPhone}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">טלפון כלה:</span>
                  <p className="font-bold text-gray-700 mt-0.5">{clientInfo.bridePhone}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">תאריך אירוע:</span>
                  <p className="font-bold text-gray-700 mt-0.5">{clientInfo.eventDate}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">מיקום אולם:</span>
                  <p className="font-bold text-gray-700 mt-0.5">{clientInfo.eventLocation}</p>
                </div>
                {clientInfo.compositesCount && (
                  <div>
                    <span className="text-gray-400 font-medium">קומפוזיציות פרחים ונרות:</span>
                    <p className="font-bold text-gray-700 mt-0.5">{clientInfo.compositesCount} שולחנות</p>
                  </div>
                )}
                {clientInfo.spongeCount && (
                  <div>
                    <span className="text-gray-400 font-medium">סידורי ספוג לשולחן:</span>
                    <p className="font-bold text-gray-700 mt-0.5">{clientInfo.spongeCount} שולחנות</p>
                  </div>
                )}
              </div>

              {/* פירוט כספי */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-gray-600">
                  <span>{selectedPackage.title} {selectedPackage.pricingTiers ? `(${selectedTableTier} שולחנות)` : ''}</span>
                  <span className="font-bold text-gray-800">₪{pricing.basePrice.toLocaleString()}</span>
                </div>

                {customUpgrades.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-gray-600">
                    <span>{item.description}</span>
                    <span className="font-bold text-gray-800">₪{item.price.toLocaleString()}</span>
                  </div>
                ))}

                <div className="flex justify-between items-center text-gray-600">
                  <span>הובלה, הרכבה ופירוק בסיום האירוע</span>
                  <span className="font-bold text-gray-800">₪500</span>
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-sm font-black text-gray-800">
                  <span>סך הכל סופי לתשלום:</span>
                  <span className="text-lg text-[#8C6D3F]">₪{pricing.totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* מדיניות ביטולים ושינויים המלאה והמדויקת לפי התמונה */}
              <div className="bg-stone-50 rounded-xl p-4 border border-gray-200 text-right space-y-3">
                <div className="text-[11px] text-gray-600 space-y-2.5 leading-relaxed">

                  <p className="font-bold text-[#8C6D3F] border-b border-gray-200 pb-1">מדיניות ביטולים ושינויים:</p>
                  <ul className="list-disc list-inside space-y-2 pr-1 text-gray-600">
                    <li>
                      <strong>במקרה של ביטול מכוח עליון:</strong> מלחמה או מגפה, הסכום ששולם יועבר כזיכוי לתאריך חלופי על בסיס זמינות, במידה ולא ימצא תאריך מוסכם לא יוחזרו ללקוח/ה 50% מסכום העסקה הכולל.
                    </li>
                    <li>
                      במקרה של כל ביטול אחר לא יוחזר ללקוח כל תשלום והלקוח יחויב במלוא תשלום העסקה.
                    </li>
                    <li>
                      במידה ולא ימצא תאריך חלופי הלקוח/ה יוכל להגיע לקחת את הציוד שהוזמן לאירוע בתשלום מלא העסקה ללא הובלה והרכבה ולהשאיר פיקדון להחזרה של הציוד.
                    </li>
                  </ul>

                  <p className="font-bold text-[#8C6D3F] border-b border-gray-200 pt-1 pb-1">שינויים ועדכונים בהזמנה:</p>
                  <ul className="list-disc list-inside space-y-1 pr-1 text-gray-600">
                    <li>ניתן לעדכן תוספות קלות בכמויות ההזמנה עד 30 ימי עסקים לפני מועד האירוע.</li>
                    <li><strong>אחריות על הציוד:</strong> בזמן האירוע הינה על הלקוח/ה (למעט מקרים של בלאי טבעי).</li>
                  </ul>

                  <p className="font-bold text-[#8C6D3F] border-b border-gray-200 pt-1 pb-1">יתרת התשלום:</p>
                  <p className="pr-1 text-gray-600">בהעברה בנקאית כשבוע לפני מועד האירוע.</p>
                </div>
              </div>

              {/* לוחות חתימה דיגיטליים כפולים (חתן וכלה) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* חתימת חתן */}
                <div className="border border-dashed border-[#B29259]/60 rounded-xl p-4 bg-stone-50">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-800">חתימת החתן:</label>
                    {isGroomSigned && (
                      <button type="button" onClick={clearGroomSignature} className="text-[10px] text-red-500 hover:text-red-700 font-bold">נקה</button>
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
                        חתן חתום כאן
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">תאריך חתימה:</span>
                    <input
                      type="date"
                      value={groomSignDate}
                      onChange={(e) => setGroomSignDate(e.target.value)}
                      className="bg-white border rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#B29259]"
                    />
                  </div>
                </div>

                {/* חתימת כלה */}
                <div className="border border-dashed border-[#B29259]/60 rounded-xl p-4 bg-stone-50">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-800">חתימת הכלה:</label>
                    {isBrideSigned && (
                      <button type="button" onClick={clearBrideSignature} className="text-[10px] text-red-500 hover:text-red-700 font-bold">נקה</button>
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
                        כלה חתום כאן
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">תאריך חתימה:</span>
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
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  נדרשת חתימה של החתן ושל הכלה לאישור ההזמנה.
                </div>
              )}
            </div>

            {/* בקרי ניווט שלב 3 */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-sm no-print">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-[#B29259] text-xs font-bold flex items-center gap-1 px-3 py-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                חזור לחבילות
              </button>

              <button
                onClick={handlePrint}
                className="bg-[#B29259] hover:bg-[#8C6D3F] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                אישור והדפסת ההזמנה
              </button>
            </div>

          </div>
        )}

      </main>

      {/* --- כותרת תחתונה --- */}
      <footer className="max-w-4xl mx-auto px-4 mt-10 text-center no-print">
        <div className="border-t border-[#EAE3D2] pt-6 text-xs text-gray-400 space-y-0.5">
          <p className="font-bold text-[#8C6D3F] font-serif text-sm">LD Event Design</p>
          <p>עיצוב אירועים · 054-5740423</p>
          <p className="mt-1">© {new Date().getFullYear()} כל הזכויות שמורות</p>
        </div>
      </footer>
    </div>
  );
}
