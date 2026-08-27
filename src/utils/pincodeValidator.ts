const MUZAFFARPUR_PINCODES = new Set<string>([
  "842001", "842002", "842003", "842004", "842005",
  "844127", "847107",
  ...Array.from({ length: 1000 }, (_, index) => `843${String(index).padStart(3, "0")}`),
]);

export const PINCODE_SERVICE_ERROR =
  "We currently serve Muzaffarpur, Sitamarhi, and Sheohar districts. Service is not available for this PIN code.";

export const PINCODE_ERROR_MESSAGE = PINCODE_SERVICE_ERROR;

export function isMuzaffarpurPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode) && MUZAFFARPUR_PINCODES.has(pincode);
}
