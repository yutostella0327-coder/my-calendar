// 自分の予定の保存・書き出し・読み込み
export const STORAGE_KEY = "my-calendar-events-v1";

export function loadEvents(storage = localStorage) {
  try {
    const list = JSON.parse(storage.getItem(STORAGE_KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveEvents(events, storage = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function exportJson(events) {
  return JSON.stringify({ version: 1, events }, null, 2);
}

export function importJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  if (!data || !Array.isArray(data.events)) throw new Error("読み込めないファイルです");
  return data.events.filter((e) => e.type !== "soccer");
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
