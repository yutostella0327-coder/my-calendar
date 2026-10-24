import { test, assertEqual } from "./runner.js";
import { matchToEvent, matchesToEvents, nextMatch } from "../js/soccer.js";

const ATLETI = { id: 78, shortName: "Atleti" };
const BARCA = { id: 81, shortName: "Barça" };

const match = (over) => ({
  id: 1001,
  utcDate: "2026-11-01T12:00:00Z",
  status: "TIMED",
  competition: { code: "PD" },
  homeTeam: ATLETI,
  awayTeam: BARCA,
  ...over,
});

test("サッカー：UTC 20:00 は日本時間で翌日 5:00", () => {
  const ev = matchToEvent(match({ utcDate: "2026-10-28T20:00:00Z" }));
  assertEqual([ev.date, ev.start], ["2026-10-29", "5:00"]);
});

test("サッカー：UTC 12:00 は日本時間で同じ日 21:00", () => {
  const ev = matchToEvent(match());
  assertEqual([ev.date, ev.start], ["2026-11-01", "21:00"]);
});

test("サッカー：時間が決まってない試合は start が null", () => {
  assertEqual(matchToEvent(match({ status: "SCHEDULED" })).start, null);
});

test("サッカー：ホームは vs、相手は日本語名", () => {
  assertEqual(matchToEvent(match()).title, "vs バルセロナ（ラ・リーガ）");
});

test("サッカー：アウェイは @", () => {
  assertEqual(matchToEvent(match({ homeTeam: BARCA, awayTeam: ATLETI })).title, "@ バルセロナ（ラ・リーガ）");
});

test("サッカー：CL の表示", () => {
  assertEqual(matchToEvent(match({ competition: { code: "CL" } })).title, "vs バルセロナ（CL）");
});

test("サッカー：相手がまだ決まってない時は「未定」", () => {
  assertEqual(matchToEvent(match({ awayTeam: { id: null, shortName: null } })).title, "vs 未定（ラ・リーガ）");
});

test("サッカー：予定の形", () => {
  const ev = matchToEvent(match());
  assertEqual([ev.id, ev.type, ev.end, ev.memo, ev.repeat], ["soccer-1001", "soccer", null, "", null]);
});

test("サッカー：ラ・リーガとCL以外は捨てる", () => {
  const json = { matches: [match(), match({ id: 2, competition: { code: "CDR" } }), match({ id: 3, competition: { code: "CL" } })] };
  assertEqual(matchesToEvents(json).map((e) => e.id), ["soccer-1001", "soccer-3"]);
});

test("サッカー：データが空でも止まらない", () => {
  assertEqual(matchesToEvents({}), []);
  assertEqual(matchesToEvents(null), []);
});

const soccerEv = (id, date, start) => ({ id, type: "soccer", title: "vs x（CL）", date, start, end: null, memo: "", repeat: null });

test("次の試合：今日以降でいちばん近い試合", () => {
  const list = [soccerEv("c", "2026-11-08", null), soccerEv("a", "2026-10-20", "4:00"), soccerEv("b", "2026-10-29", "5:00")];
  assertEqual(nextMatch(list, "2026-10-24").id, "b");
});

test("次の試合：今日の試合も入る", () => {
  assertEqual(nextMatch([soccerEv("a", "2026-10-24", "21:00")], "2026-10-24").id, "a");
});

test("次の試合：同じ日なら時間の早い方", () => {
  const list = [soccerEv("late", "2026-10-29", "21:00"), soccerEv("early", "2026-10-29", "5:00")];
  assertEqual(nextMatch(list, "2026-10-24").id, "early");
});

test("次の試合：無ければ null", () => {
  assertEqual(nextMatch([soccerEv("a", "2026-10-01", "4:00")], "2026-10-24"), null);
  assertEqual(nextMatch([], "2026-10-24"), null);
});
