// リッチメニューの作成・画像アップロード・ユーザーへの紐付けを行う一回限りのセットアップスクリプト。
// ボタンの文言やリンク先を変えたいときは、下のAREAS定義とscripts/assets/richmenu.svgを直して再実行する。
//
// 使い方:
//   node scripts/setup-line-richmenu.mjs                    画像作成+アップロードのみ(誰にも適用しない)
//   node scripts/setup-line-richmenu.mjs --link-user <userId>  特定の1人だけにテスト適用
//   node scripts/setup-line-richmenu.mjs --set-default          全ユーザーのデフォルトに設定

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(projectRoot, ".env.local");
  const text = fs.readFileSync(envPath, "utf-8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (!m) continue;
    let value = m[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
}

loadEnvLocal();

const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error("LINE_CHANNEL_ACCESS_TOKEN is not set in .env.local");
  process.exit(1);
}

const SITE_URL = "https://hahanavi.vercel.app";

// 2500x1686を2x2(1250x843ずつ)に分割。左上から時計回りに ハハナビTOP → ご意見箱 → 支援制度診断 → 申請制度更新リマインダー
const AREAS = [
  {
    bounds: { x: 0, y: 0, width: 1250, height: 843 },
    action: { type: "uri", uri: `${SITE_URL}/` },
  },
  {
    bounds: { x: 1250, y: 0, width: 1250, height: 843 },
    // ご意見箱はこの後すぐ自由入力してもらうフローなので、タップ直後にキーボードを自動で開く
    action: {
      type: "postback",
      data: "action=feedback",
      displayText: "ご意見箱",
      inputOption: "openKeyboard",
    },
  },
  {
    bounds: { x: 1250, y: 843, width: 1250, height: 843 },
    action: { type: "postback", data: "action=diagnose", displayText: "支援制度診断" },
  },
  {
    bounds: { x: 0, y: 843, width: 1250, height: 843 },
    // 開発中(更新時期のリマインド送信は未実装)のため、タップしても何も起きないようにdisplayTextも付けない。
    // 登録フロー自体はaction=register_programとしてroute.tsに実装済みなので、公開するときはdataをそれに戻すだけでよい
    action: { type: "postback", data: "action=register_program_wip" },
  },
];

async function createRichMenu() {
  const res = await fetch("https://api.line.me/v2/bot/richmenu", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      size: { width: 2500, height: 1686 },
      selected: true,
      name: "hahanavi-main-menu",
      chatBarText: "ハハナビメニューを表示",
      areas: AREAS,
    }),
  });
  if (!res.ok) throw new Error(`createRichMenu failed: ${res.status} ${await res.text()}`);
  const { richMenuId } = await res.json();
  return richMenuId;
}

async function uploadImage(richMenuId) {
  const svgPath = path.join(__dirname, "assets", "richmenu.svg");
  const pngPath = path.join(__dirname, "assets", "richmenu.png");
  await sharp(svgPath).resize(2500, 1686).png().toFile(pngPath);

  const imageBuffer = fs.readFileSync(pngPath);
  const res = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: "POST",
    headers: {
      "Content-Type": "image/png",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: imageBuffer,
  });
  if (!res.ok) throw new Error(`uploadImage failed: ${res.status} ${await res.text()}`);
}

async function linkToUser(richMenuId, userId) {
  const res = await fetch(`https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`linkToUser failed: ${res.status} ${await res.text()}`);
}

async function setAsDefault(richMenuId) {
  const res = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`setAsDefault failed: ${res.status} ${await res.text()}`);
}

async function main() {
  const args = process.argv.slice(2);
  const linkUserIdx = args.indexOf("--link-user");
  const linkUserId = linkUserIdx >= 0 ? args[linkUserIdx + 1] : null;
  const setDefault = args.includes("--set-default");
  const existingIdx = args.indexOf("--richmenu-id");
  const existingRichMenuId = existingIdx >= 0 ? args[existingIdx + 1] : null;

  let richMenuId = existingRichMenuId;
  if (!richMenuId) {
    console.log("リッチメニューを作成中...");
    richMenuId = await createRichMenu();
    console.log("作成完了:", richMenuId);

    console.log("画像をアップロード中...");
    await uploadImage(richMenuId);
    console.log("アップロード完了");
  } else {
    console.log("既存のリッチメニューを再利用します:", richMenuId);
  }

  if (linkUserId) {
    console.log(`ユーザー ${linkUserId} にテスト適用中...`);
    await linkToUser(richMenuId, linkUserId);
    console.log("テスト適用完了。このユーザーのLINEだけに新メニューが表示されます");
  } else if (setDefault) {
    console.log("全ユーザーのデフォルトに設定中...");
    await setAsDefault(richMenuId);
    console.log("デフォルト設定完了。全ユーザーに表示されます");
  } else {
    console.log("誰にも適用していません(作成とアップロードのみ)。");
    console.log(`テストするには: node scripts/setup-line-richmenu.mjs --link-user <あなたのLINE userId>`);
  }

  console.log("\nrichMenuId:", richMenuId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
