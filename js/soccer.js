// football-data.org の試合データ → カレンダーの予定（日本時間）
import { minutes } from "./events.js";

const ATLETI_ID = 78;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

const COMPETITION_JA = { PD: "ラ・リーガ", CL: "CL" };

// football-data の shortName → 日本語名。無いチームは英語のまま出す
export const TEAM_JA = {
  // ラ・リーガ
  "Barça": "バルセロナ",
  "Real Madrid": "レアル・マドリード",
  "Athletic": "アスレティック・ビルバオ",
  "Real Sociedad": "レアル・ソシエダ",
  "Villarreal": "ビジャレアル",
  "Real Betis": "ベティス",
  "Sevilla FC": "セビージャ",
  "Valencia": "バレンシア",
  "Celta": "セルタ",
  "Osasuna": "オサスナ",
  "Getafe": "ヘタフェ",
  "Mallorca": "マジョルカ",
  "Rayo Vallecano": "ラージョ",
  "Girona": "ジローナ",
  "Espanyol": "エスパニョール",
  "Alavés": "アラベス",
  "Levante": "レバンテ",
  "Elche": "エルチェ",
  "Real Oviedo": "オビエド",
  "Deportivo": "デポルティーボ",
  "Málaga": "マラガ",
  "Santander": "ラシン・サンタンデール",
  // CL でよく当たるクラブ
  "Bayern": "バイエルン",
  "Dortmund": "ドルトムント",
  "Leverkusen": "レバークーゼン",
  "Man City": "マンチェスター・シティ",
  "Liverpool": "リバプール",
  "Arsenal": "アーセナル",
  "Chelsea": "チェルシー",
  "Tottenham": "トッテナム",
  "PSG": "パリ・サンジェルマン",
  "Inter": "インテル",
  "Milan": "ミラン",
  "Juventus": "ユベントス",
  "Napoli": "ナポリ",
  "Benfica": "ベンフィカ",
  "Porto": "ポルト",
  "Man United": "マンチェスター・ユナイテッド",
  "Stuttgart": "シュトゥットガルト",
  "PSV": "PSVアイントホーフェン",
  "Fenerbahçe": "フェネルバフチェ",
  "Bodø/Glimt": "ボデ／グリムト",
  "Viking": "ヴァイキング",
};

const pad = (n) => String(n).padStart(2, "0");

export function matchToEvent(match, teamId = ATLETI_ID) {
  // 9時間足して、UTCとして読むと日本時間になる
  const jst = new Date(new Date(match.utcDate).getTime() + JST_OFFSET_MS);
  const date = `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}`;
  const start = match.status === "SCHEDULED" ? null : `${jst.getUTCHours()}:${pad(jst.getUTCMinutes())}`;

  const isHome = match.homeTeam?.id === teamId;
  const opponent = isHome ? match.awayTeam : match.homeTeam;
  const name = opponent?.shortName ? TEAM_JA[opponent.shortName] ?? opponent.shortName : "未定";
  const comp = COMPETITION_JA[match.competition?.code] ?? match.competition?.code;

  return {
    id: `soccer-${match.id}`,
    type: "soccer",
    title: `${isHome ? "vs" : "@"} ${name}（${comp}）`,
    date,
    start,
    end: null,
    memo: "",
    repeat: null,
  };
}

export function matchesToEvents(json) {
  const matches = Array.isArray(json?.matches) ? json.matches : [];
  return matches
    .filter((m) => m.competition?.code in COMPETITION_JA)
    .map((m) => matchToEvent(m));
}

// today 以降でいちばん近い試合。無ければ null
export function nextMatch(soccerEvents, today) {
  const upcoming = soccerEvents
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || minutes(a.start) - minutes(b.start));
  return upcoming[0] ?? null;
}
