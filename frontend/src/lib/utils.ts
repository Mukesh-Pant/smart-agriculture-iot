import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const currencyOption = {
  NPR: 'रु',
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥'
};
export const user_role = {
  farmer : "farmer",
  admin : "admin"
};

export default user_role
export type TCurrencyKey = keyof typeof currencyOption;