import { normalizeText } from "./value_normalizers.js";

export function extractComparableValues(records) {
  return records
    .map((record) => normalizeText(record.value))
    .filter((value) => value.length > 0);
}
