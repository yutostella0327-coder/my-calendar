import { test, assertEqual } from "./runner.js";
import { expandEvents, eventsOn, TYPE_INFO } from "../js/events.js";

const jugyo = {
  id: "j1", type: "jugyo", title: "映像論", date: "2026-10-05",
  start: "10:40", end: "12:10", memo: "",
  repeat: { weekly: true, until: "2026-10-26" },
};

const once = (id, date, start) => ({
  id, type: "baito", title: "ABCマート", date, start, end: null, memo: "", repeat: null,
});

test("毎週くり返し：10月中に月曜4回", () => {
  const dates = expandEvents([jugyo], "2026-10-01", "2026-10-31").map((e) => e.date);
  assertEqual(dates, ["2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26"]);
});

test("毎週くり返し：範囲の途中だけ取り出せる", () => {
  const dates = expandEvents([jugyo], "2026-10-15", "2026-10-20").map((e) => e.date);
  assertEqual(dates, ["2026-10-19"]);
});

test("毎週くり返し：idは 元のid@日付", () => {
  assertEqual(expandEvents([jugyo], "2026-10-12", "2026-10-12")[0].id, "j1@2026-10-12");
});

test("毎週くり返し：終わりの日が始まりより前なら何も出ない", () => {
  const bad = { ...jugyo, repeat: { weekly: true, until: "2026-10-01" } };
  assertEqual(expandEvents([bad], "2026-10-01", "2026-10-31").length, 0);
});

test("くり返しなし：範囲内なら1つ、範囲外なら0", () => {
  assertEqual(expandEvents([once("b1", "2026-10-10", "17:00")], "2026-10-01", "2026-10-31").length, 1);
  assertEqual(expandEvents([once("b1", "2026-11-10", "17:00")], "2026-10-01", "2026-10-31").length, 0);
});

test("eventsOn：時間の早い順、時間未定は最後", () => {
  const list = [once("a", "2026-10-10", null), once("b", "2026-10-10", "17:00"), once("c", "2026-10-10", "9:00"), once("d", "2026-10-11", "8:00")];
  assertEqual(eventsOn(list, "2026-10-10").map((e) => e.id), ["c", "b", "a"]);
});

test("TYPE_INFO：4種類の名前と色", () => {
  assertEqual(TYPE_INFO.baito, { label: "バイト", color: "#4d7cff" });
  assertEqual(TYPE_INFO.jugyo, { label: "授業", color: "#2fd0a6" });
  assertEqual(TYPE_INFO.shukatsu, { label: "就活", color: "#ffc93c" });
  assertEqual(TYPE_INFO.soccer, { label: "サッカー", color: "#e3402e" });
});
