// アトレティコの試合日程（ラ・リーガ＋CL）を取ってきて data/matches.json に保存する
// GitHub Actions で1日1回動く。キーは環境変数 FOOTBALL_DATA_KEY から読む
import { writeFile } from "node:fs/promises";

const TEAM_ID = 78;
const DAY_MS = 24 * 60 * 60 * 1000;
const ymd = (d) => d.toISOString().slice(0, 10);

const key = process.env.FOOTBALL_DATA_KEY;
if (!key) {
  console.error("FOOTBALL_DATA_KEY がありません");
  process.exit(1);
}

const now = Date.now();
const url = new URL(`https://api.football-data.org/v4/teams/${TEAM_ID}/matches`);
url.searchParams.set("competitions", "PD,CL");
url.searchParams.set("dateFrom", ymd(new Date(now - 30 * DAY_MS)));
url.searchParams.set("dateTo", ymd(new Date(now + 180 * DAY_MS)));

const res = await fetch(url, { headers: { "X-Auth-Token": key } });
if (!res.ok) {
  // 失敗したら前のファイルはそのまま残す
  console.error(`取得に失敗：${res.status} ${await res.text()}`);
  process.exit(1);
}

const { matches } = await res.json();
await writeFile(
  new URL("../data/matches.json", import.meta.url),
  JSON.stringify({ updatedAt: new Date(now).toISOString(), matches }, null, 2) + "\n"
);
console.log(`${matches.length} 試合を保存しました`);
