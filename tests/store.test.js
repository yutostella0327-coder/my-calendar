import { test, assertEqual, assertThrows } from "./runner.js";
import { loadEvents, saveEvents, exportJson, importJson, newId, STORAGE_KEY } from "../js/store.js";

// localStorage の代わり
const fakeStorage = (initial) => {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
  };
};

const sample = [
  { id: "a1", type: "baito", title: "ABCマート", date: "2026-10-24", start: "17:00", end: "22:00", memo: "", repeat: null },
];

test("保存：何も無い時は空", () => {
  assertEqual(loadEvents(fakeStorage({})), []);
});

test("保存：壊れたデータでも止まらず空", () => {
  assertEqual(loadEvents(fakeStorage({ [STORAGE_KEY]: "{壊れた" })), []);
});

test("保存：配列じゃないデータなら空", () => {
  assertEqual(loadEvents(fakeStorage({ [STORAGE_KEY]: '{"a":1}' })), []);
});

test("保存して読み出すと同じ", () => {
  const s = fakeStorage({});
  saveEvents(sample, s);
  assertEqual(loadEvents(s), sample);
});

test("書き出し→読み込みで元に戻る", () => {
  assertEqual(importJson(exportJson(sample)), sample);
});

test("読み込み：変なファイルはエラー", () => {
  assertThrows(() => importJson("hello"), "読み込めないファイルです");
  assertThrows(() => importJson('{"version":1}'), "読み込めないファイルです");
});

test("読み込み：サッカーの予定は捨てる", () => {
  const withSoccer = [...sample, { ...sample[0], id: "soccer-1", type: "soccer" }];
  assertEqual(importJson(exportJson(withSoccer)), sample);
});

test("newId：毎回ちがう", () => {
  assertEqual(newId() === newId(), false);
});
