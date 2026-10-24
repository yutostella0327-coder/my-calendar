// ミニテスト：test() で登録して、run() でまとめて動かす
const tests = [];

export function test(name, fn) {
  tests.push({ name, fn });
}

export function assertEqual(actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`期待 ${e} / 実際 ${a}`);
}

export function assertThrows(fn, message) {
  try {
    fn();
  } catch (err) {
    if (message !== undefined && err.message !== message) {
      throw new Error(`エラーの文が違う：期待 "${message}" / 実際 "${err.message}"`);
    }
    return;
  }
  throw new Error("エラーにならなかった");
}

// files: 読み込むテストファイルの一覧。読み込めない時も ❌ として出す
export async function run(files, out) {
  const lines = [];
  let passed = 0;
  let total = 0;
  for (const file of files) {
    try {
      await import(file);
    } catch (err) {
      total++;
      lines.push(`❌ ${file} を読み込めない: ${err.message}`);
    }
  }
  for (const t of tests) {
    total++;
    try {
      t.fn();
      passed++;
      lines.push(`✅ ${t.name}`);
    } catch (err) {
      lines.push(`❌ ${t.name}: ${err.message}`);
    }
  }
  lines.push(`合格 ${passed} / 全 ${total}`);
  out.textContent = lines.join("\n");
}
