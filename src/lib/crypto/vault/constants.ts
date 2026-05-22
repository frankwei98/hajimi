export const KDF_ITERATIONS = 600_000;
export const EXPORT_VERSION = 1;
export const PIN_LENGTH = 6;
export const PIN_REGEX = /^\d{6}$/;

export { toHex, bytesToBase64, base64ToBytes } from "./encoding";
