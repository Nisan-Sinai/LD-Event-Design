// חישוב תמחור טהור (ללא תלות ב-UI) — ניתן לבדיקה ביחידה.

export const DELIVERY_FEE = 500;

export interface PricingInput {
  /** סכום מחירי כל החבילות שנבחרו (כולל מדרגות שולחנות) */
  basePrice: number;
  /** סך שדרוגים ידניים */
  upgradesTotal: number;
  /** סך תוספות מהקטלוג */
  addonsTotal: number;
  /** האם נכללת הובלה/הרכבה/פירוק */
  includeDelivery: boolean;
  /** הנחת קופון ₪500 (אם מומשה) */
  couponDiscount: number;
  /** הנחת מנהל ידנית */
  adminDiscount: number;
  /** דריסת מחיר סופי ידנית (null = שימוש בחישוב) */
  manualTotal: number | null;
}

export interface PricingResult {
  basePrice: number;
  upgradesTotal: number;
  addonsTotal: number;
  deliveryPrice: number;
  couponDiscount: number;
  adminDiscount: number;
  manualOverride: number | null;
  totalPrice: number;
}

/** מחזיר את פירוט התמחור המלא. הסכום הסופי לעולם אינו שלילי. */
export function calcPricing(input: PricingInput): PricingResult {
  const basePrice = Math.max(0, input.basePrice || 0);
  const upgradesTotal = Math.max(0, input.upgradesTotal || 0);
  const addonsTotal = Math.max(0, input.addonsTotal || 0);
  const couponDiscount = Math.max(0, input.couponDiscount || 0);
  const adminDiscount = Math.max(0, input.adminDiscount || 0);
  const deliveryPrice = input.includeDelivery ? DELIVERY_FEE : 0;

  const computedTotal = Math.max(
    0,
    basePrice + upgradesTotal + addonsTotal + deliveryPrice - couponDiscount - adminDiscount
  );

  const manualOverride =
    input.manualTotal !== null && !Number.isNaN(input.manualTotal)
      ? Math.max(0, input.manualTotal)
      : null;

  const totalPrice = manualOverride !== null ? manualOverride : computedTotal;

  return {
    basePrice,
    upgradesTotal,
    addonsTotal,
    deliveryPrice,
    couponDiscount,
    adminDiscount,
    manualOverride,
    totalPrice
  };
}
