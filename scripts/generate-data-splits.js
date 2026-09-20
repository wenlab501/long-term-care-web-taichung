/**
 * 從 public/data/json/ 的原始記錄檔產生三種衍生檔案：
 *
 *   data/index/providers.json     服務人員清單用的最小索引
 *   data/by-date/<日期>.json       單一服務日期的完整記錄
 *   data/by-provider/<身分證>.json 單一服務人員的完整記錄
 *
 * 衍生檔一律保持 { 來源檔名: [ 原順序的記錄 ] } 的結構，消費端照自己的
 * 檔名陣列順序遍歷即可重建與原本逐檔 fetch 完全相同的陣列順序。
 *
 * 原始記錄本身逐一原樣複製，不新增、不刪除、不改寫任何欄位。
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'public', 'data', 'json');
const OUT_DIR = path.join(__dirname, '..', 'public', 'data');

const DATE_FIELD = '服務日期(請輸入7碼)';
const PROVIDER_FIELD = '服務人員身分證';

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value));
}

function main() {
  const sourceFiles = fs
    .readdirSync(SRC_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  // 來源檔名 -> 該檔的記錄陣列（保持原順序）
  const byDate = new Map();
  const byProvider = new Map();
  const indexByFile = {};
  let totalRows = 0;

  for (const fileName of sourceFiles) {
    const records = JSON.parse(fs.readFileSync(path.join(SRC_DIR, fileName), 'utf8'));
    if (!Array.isArray(records)) {
      throw new Error(`${fileName} 的內容不是陣列`);
    }

    indexByFile[fileName] = [];

    for (const record of records) {
      totalRows++;
      const date = record[DATE_FIELD];
      const provider = record[PROVIDER_FIELD];

      if (date === undefined || provider === undefined) {
        throw new Error(`${fileName} 有記錄缺少日期或身分證欄位`);
      }
      // 身分證會直接當檔名用，必須確認安全
      if (!/^[A-Za-z0-9_-]+$/.test(String(provider))) {
        throw new Error(`身分證 ${provider} 含有不能當檔名的字元`);
      }

      // 清單索引只需要這三項，其餘欄位不收
      indexByFile[fileName].push({ [PROVIDER_FIELD]: provider, [DATE_FIELD]: date });

      for (const [map, key] of [
        [byDate, String(date)],
        [byProvider, String(provider)],
      ]) {
        if (!map.has(key)) map.set(key, {});
        const bucket = map.get(key);
        if (!bucket[fileName]) bucket[fileName] = [];
        bucket[fileName].push(record);
      }
    }
  }

  writeJson(path.join(OUT_DIR, 'index', 'providers.json'), indexByFile);
  for (const [date, bucket] of byDate) {
    writeJson(path.join(OUT_DIR, 'by-date', `${date}.json`), bucket);
  }
  for (const [provider, bucket] of byProvider) {
    writeJson(path.join(OUT_DIR, 'by-provider', `${provider}.json`), bucket);
  }

  const sizeOf = (dir) =>
    fs
      .readdirSync(path.join(OUT_DIR, dir))
      .reduce((s, f) => s + fs.statSync(path.join(OUT_DIR, dir, f)).size, 0);
  const mb = (n) => (n / 1048576).toFixed(1);

  console.log(`來源 ${sourceFiles.length} 檔，共 ${totalRows.toLocaleString()} 筆記錄`);
  console.log(
    `  index/providers.json  ${mb(fs.statSync(path.join(OUT_DIR, 'index', 'providers.json')).size)} MB`
  );
  console.log(`  by-date/              ${byDate.size} 檔，共 ${mb(sizeOf('by-date'))} MB`);
  console.log(`  by-provider/          ${byProvider.size} 檔，共 ${mb(sizeOf('by-provider'))} MB`);
}

main();
