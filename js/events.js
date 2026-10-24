// 予定のくり返し展開と、日ごとの予定集め
import { addDays } from "./dates.js";

export const TYPE_INFO = {
  baito: { label: "バイト", color: "#2b5fd9" },
  jugyo: { label: "授業", color: "#17936a" },
  shukatsu: { label: "就活", color: "#e08214" },
  soccer: { label: "サッカー", color: "#cb3524" },
};

// from〜to（両端ふくむ）に入る予定。毎週くり返しは1回ずつに分ける
export function expandEvents(events, from, to) {
  const out = [];
  for (const ev of events) {
    if (!ev.repeat?.weekly) {
      if (ev.date >= from && ev.date <= to) out.push(ev);
      continue;
    }
    const last = ev.repeat.until < to ? ev.repeat.until : to;
    for (let d = ev.date; d <= last; d = addDays(d, 7)) {
      if (d >= from) out.push({ ...ev, id: `${ev.id}@${d}`, date: d });
    }
  }
  return out;
}

// "9:00" → 540。時間未定は一番うしろ
export const minutes = (t) => {
  if (!t) return Infinity;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function eventsOn(expanded, date) {
  return expanded
    .filter((e) => e.date === date)
    .sort((a, b) => minutes(a.start) - minutes(b.start));
}
