export const checkoutPrimaryButtonClassName =
  'bg-[#b56f59] !text-[#fff8f4] shadow-[0_18px_40px_rgba(132,83,60,0.18)] hover:bg-[#9f604b] hover:!text-[#fff8f4] [&_svg]:!text-[#fff8f4] hover:[&_svg]:!text-[#fff8f4] dark:bg-[#c98770] dark:!text-[#2f1913] dark:hover:bg-[#b7745e] dark:hover:!text-[#2f1913] dark:[&_svg]:!text-[#2f1913] dark:hover:[&_svg]:!text-[#2f1913]';

export const FREE_SHIPPING_THRESHOLD = 2000;
export const STANDARD_SHIPPING_FEE = 60;

export function getShippingFee(subtotal: number) {
  if (subtotal <= 0) {
    return 0;
  }

  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
}

export function normalizePhoneInput(value: string) {
  return value.replace(/\D/g, '').slice(0, 10);
}
