import { PIN_REGEX } from './constants';

export function isValidPin(pin: string): boolean {
  return PIN_REGEX.test(pin);
}
