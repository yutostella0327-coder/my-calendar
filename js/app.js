// 画面の動き
import { monthGrid, toDateStr, parseDateStr } from "./dates.js";
import { expandEvents, eventsOn, TYPE_INFO } from "./events.js";
import { loadEvents, saveEvents, exportJson, importJson, newId } from "./store.js";
import { matchesToEvents } from "./soccer.js";

const $ = (id) => document.getElementById(id);
const MAX_BARS = 3;
const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

const today = toDateStr(new Date());
const state = {
  year: Number(today.slice(0, 4)),
  month: Number(today.slice(5, 7)),
  selected: today,
  mine: loadEvents(),
  soccer: [],
  editingId: null,
};

// ---------- 表示 ----------

const timeText = (ev) => {
  if (!ev.start) return ev.type === "soccer" ? "時間未定" : "終日";
  return ev.end ? `${ev.start}〜${ev.end}` : ev.start;
};

// 例：「vs バルセロナ 4:00（CL）」
const soccerText = (ev) => {
  const m = ev.title.match(/^(.*)（(.*)）$/);
  const time = ev.start ?? "時間未定";
  return m ? `${m[1]} ${time}（${m[2]}）` : `${ev.title} ${time}`;
};

function render() {
  const weeks = monthGrid(state.year, state.month);
  const from = weeks[0][0];
  const to = weeks[weeks.length - 1][6];
  const all = expandEvents([...state.mine, ...state.soccer], from, to);
  const thisMonth = `${state.year}-${String(state.month).padStart(2, "0")}`;

  $("month-label").textContent = `${state.year}年${state.month}月`;

  const grid = $("grid");
  grid.replaceChildren();
  for (const week of weeks) {
    week.forEach((date, i) => {
      const cell = document.createElement("button");
      cell.className = "cell";
      if (i === 0) cell.classList.add("sun");
      if (i === 6) cell.classList.add("sat");
      if (!date.startsWith(thisMonth)) cell.classList.add("other");
      if (date === today) cell.classList.add("today");
      if (date === state.selected) cell.classList.add("selected");
      cell.setAttribute("aria-label", date);

      const num = document.createElement("span");
      num.className = "num";
      num.textContent = Number(date.slice(8));
      cell.append(num);

      const list = eventsOn(all, date);
      for (const ev of list.slice(0, MAX_BARS)) {
        const bar = document.createElement("span");
        bar.className = "bar";
        bar.style.background = TYPE_INFO[ev.type].color;
        bar.textContent = ev.title;
        cell.append(bar);
      }
      if (list.length > MAX_BARS) {
        const more = document.createElement("span");
        more.className = "more";
        more.textContent = `+${list.length - MAX_BARS}`;
        cell.append(more);
      }

      cell.addEventListener("click", () => {
        state.selected = date;
        render();
      });
      grid.append(cell);
    });
  }

  renderDay(all);
}

function renderDay(all) {
  const d = parseDateStr(state.selected);
  $("day-label").textContent = `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAY[d.getDay()]}）`;

  const ul = $("day-list");
  ul.replaceChildren();
  const list = eventsOn(all, state.selected);
  if (list.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "予定なし";
    ul.append(li);
    return;
  }
  for (const ev of list) {
    const li = document.createElement("li");
    const row = document.createElement(ev.type === "soccer" ? "div" : "button");
    row.className = ev.type === "soccer" ? "static" : "";

    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = TYPE_INFO[ev.type].color;
    const title = document.createElement("span");
    title.className = "title";
    row.append(dot);

    if (ev.type === "soccer") {
      title.textContent = soccerText(ev);
      row.append(title);
    } else {
      const time = document.createElement("span");
      time.className = "time";
      time.textContent = timeText(ev);
      title.textContent = ev.memo ? `${ev.title}（${ev.memo}）` : ev.title;
      row.append(time, title);
      row.addEventListener("click", () => openForm(ev.id.split("@")[0]));
    }
    li.append(row);
    ul.append(li);
  }
}

function moveMonth(diff) {
  const d = new Date(state.year, state.month - 1 + diff, 1);
  state.year = d.getFullYear();
  state.month = d.getMonth() + 1;
  state.selected = toDateStr(d);
  render();
}

// ---------- フォーム ----------

const form = $("form");
const sheet = $("sheet");

function showRepeatBox() {
  $("repeat-box").hidden = form.type.value !== "jugyo";
}

function showError(msg) {
  $("form-error").textContent = msg;
  $("form-error").hidden = !msg;
}

function openForm(id = null) {
  state.editingId = id;
  const ev = state.mine.find((e) => e.id === id);
  form.reset();
  showError("");
  $("form-title").textContent = ev ? "予定を直す" : "予定を追加";
  $("delete").hidden = !ev;

  form.type.value = ev?.type ?? "baito";
  form.title.value = ev?.title ?? "";
  form.date.value = ev?.date ?? state.selected;
  form.start.value = ev?.start ? ev.start.padStart(5, "0") : "";
  form.end.value = ev?.end ? ev.end.padStart(5, "0") : "";
  form.memo.value = ev?.memo ?? "";
  form.weekly.checked = Boolean(ev?.repeat?.weekly);
  form.until.value = ev?.repeat?.until ?? "";
  showRepeatBox();
  sheet.showModal();
}

function readForm() {
  const type = form.type.value;
  const weekly = type === "jugyo" && form.weekly.checked;
  const ev = {
    id: state.editingId ?? newId(),
    type,
    title: form.title.value.trim(),
    date: form.date.value,
    start: form.start.value || null,
    end: form.end.value || null,
    memo: form.memo.value.trim(),
    repeat: weekly ? { weekly: true, until: form.until.value } : null,
  };
  if (!ev.title) return [null, "タイトルを入れてね"];
  if (!ev.date) return [null, "日付を入れてね"];
  if (ev.start && ev.end && ev.end < ev.start) return [null, "終了が開始より前になってるよ"];
  if (weekly && !ev.repeat.until) return [null, "くり返しの終わりの日を入れてね"];
  if (weekly && ev.repeat.until < ev.date) return [null, "終わりの日が日付より前になってるよ"];
  return [ev, null];
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const [ev, err] = readForm();
  if (err) return showError(err);
  const i = state.mine.findIndex((x) => x.id === ev.id);
  if (i >= 0) state.mine[i] = ev;
  else state.mine.push(ev);
  saveEvents(state.mine);
  state.selected = ev.date;
  sheet.close();
  render();
});

form.addEventListener("change", (e) => {
  if (e.target.name === "type") showRepeatBox();
});

$("delete").addEventListener("click", () => {
  const ev = state.mine.find((x) => x.id === state.editingId);
  const msg = ev?.repeat ? "くり返しの予定を全部消していい？" : "この予定を消していい？";
  if (!confirm(msg)) return;
  state.mine = state.mine.filter((x) => x.id !== state.editingId);
  saveEvents(state.mine);
  sheet.close();
  render();
});

$("cancel").addEventListener("click", () => sheet.close());

// ---------- 書き出し・読み込み ----------

$("export").addEventListener("click", () => {
  const blob = new Blob([exportJson(state.mine)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `予定_${today}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$("import").addEventListener("click", () => $("import-file").click());

$("import-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    const events = importJson(await file.text());
    if (!confirm(`${events.length}件の予定を読み込むよ。今の予定は置きかわるけどいい？`)) return;
    state.mine = events;
    saveEvents(state.mine);
    render();
  } catch (err) {
    alert(err.message);
  }
});

// ---------- はじめ ----------

$("prev").addEventListener("click", () => moveMonth(-1));
$("next").addEventListener("click", () => moveMonth(1));
$("today").addEventListener("click", () => {
  state.year = Number(today.slice(0, 4));
  state.month = Number(today.slice(5, 7));
  state.selected = today;
  render();
});
$("add").addEventListener("click", () => openForm());

render();

fetch("data/matches.json", { cache: "no-cache" })
  .then((res) => {
    if (!res.ok) throw new Error(res.status);
    return res.json();
  })
  .then((json) => {
    state.soccer = matchesToEvents(json);
    render();
  })
  .catch(() => {
    $("notice").hidden = false;
  });
