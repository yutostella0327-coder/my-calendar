import { test, assertEqual } from "./runner.js";
import { monthGrid, addDays, toDateStr, parseDateStr } from "../js/dates.js";

test("2026年10月：最初のマスは9/27（日）", () => {
  assertEqual(monthGrid(2026, 10)[0][0], "2026-09-27");
});

test("2026年10月：10/1は木曜のマス", () => {
  assertEqual(monthGrid(2026, 10)[0][4], "2026-10-01");
});

test("2026年10月：最後のマスは10/31（土）で5週", () => {
  const grid = monthGrid(2026, 10);
  assertEqual(grid.length, 5);
  assertEqual(grid[4][6], "2026-10-31");
});

test("どの週も7日", () => {
  assertEqual(monthGrid(2026, 10).every((w) => w.length === 7), true);
});

test("うるう年：2028年2月に29日はあって30日は無い", () => {
  const days = monthGrid(2028, 2).flat();
  assertEqual(days.includes("2028-02-29"), true);
  assertEqual(days.includes("2028-02-30"), false);
});

test("1日が日曜の月：2026年2月は2/1から始まる", () => {
  assertEqual(monthGrid(2026, 2)[0][0], "2026-02-01");
});

test("1日が土曜の月：2026年8月は6週", () => {
  assertEqual(monthGrid(2026, 8).length, 6);
});

test("addDays：年をまたぐ", () => {
  assertEqual(addDays("2026-12-31", 1), "2027-01-01");
});

test("toDateStr と parseDateStr で元に戻る", () => {
  assertEqual(toDateStr(parseDateStr("2026-03-09")), "2026-03-09");
});
