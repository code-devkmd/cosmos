const SAVED_ITEMS_KEY = "cosmic-saved-items";

export function readSavedItems() {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVED_ITEMS_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function writeSavedItems(items) {
  localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(items));
}
