const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export const normalizePhone = (value: string) =>
  value
    .trim()
    .replace(/[٠-٩]/g, digit => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/\D/g, '');

export const isValidCustomerPhone = (value: string) => {
  const phone = normalizePhone(value);
  return phone.length >= 10 && phone.length <= 15;
};
