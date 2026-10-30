import { Client } from "@notionhq/client";
import { cacheLife } from "next/cache";
import programsData from "@/data/programs.json";

const ALL_PROGRAMS = programsData.programs as {
  id: string;
  name: string;
  headline?: string;
  source?: string;
  verifiedAt?: string;
}[];

// Notionの「関連制度」欄(改行区切りの制度名)を、programs.jsonの制度名と突き合わせて
// IDを解決する。一致しない行は黙ってスキップする(タイポ等で存在しない制度を表示しないため)。
// sourceはprograms.json側で裏取り済みの公式ページURL(記事側で出典として表示する)
function resolveRelatedPrograms(rawText: string): RelatedProgram[] {
  return rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name) => ALL_PROGRAMS.find((p) => p.name === name))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      id: p.id,
      name: p.name,
      headline: p.headline,
      source: p.source,
    }));
}

function getNotionClient() {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN is not set");
  return new Client({ auth: token });
}

function getDataSourceId() {
  const id = process.env.NOTION_DATA_SOURCE_ID;
  if (!id) throw new Error("NOTION_DATA_SOURCE_ID is not set");
  return id;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function plainText(richText: any[] | undefined): string {
  if (!richText) return "";
  return richText.map((t) => t.plain_text ?? "").join("");
}

// 段落内にNotionのハイパーリンクが貼ってあれば、そのURLを取り出す
// (記事の参考リンク・出典をまとめず、本文中に直接リンクを書けるようにするため)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function firstLink(richText: any[] | undefined): string | undefined {
  if (!richText) return undefined;
  for (const t of richText) {
    if (t.href) return t.href;
  }
  return undefined;
}

export type ArticleSummary = {
  id: string;
  title: string;
  createdTime: string;
  category?: string;
};

export async function listPublishedArticles(): Promise<ArticleSummary[]> {
  "use cache";
  cacheLife("minutes");
  const notion = getNotionClient();
  const res = await notion.dataSources.query({
    data_source_id: getDataSourceId(),
    filter: {
      property: "Status",
      select: { equals: "公開" },
    },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return res.results.map((page: any) => ({
    id: page.id,
    title: plainText(page.properties?.記事タイトル?.title) || "無題",
    createdTime: page.created_time,
    category: page.properties?.カテゴリ?.select?.name,
  }));
}

export type BearSpeaker = "mama" | "kid" | "consultant";

export type ArticleBlock =
  | { type: "paragraph"; text: string; url?: string }
  | { type: "bear"; text: string; speaker: BearSpeaker }
  | { type: "heading"; text: string }
  | { type: "bullet"; text: string };

export type RelatedProgram = {
  id: string;
  name: string;
  headline?: string;
  source?: string;
};

export type Article = {
  id: string;
  title: string;
  published: boolean;
  blocks: ArticleBlock[];
  relatedPrograms: RelatedProgram[];
  createdTime: string;
  lastEditedTime: string;
};

// 「記事アイデア」から下書きを作るときに使う。公開は必ず自分の手動操作(Notion側で
// Statusを「公開」に変える)にしたいので、ここでは常に「下書き」で作成する
export async function createDraftArticle({
  title,
  category,
  blocks,
}: {
  title: string;
  category: string;
  blocks: ArticleBlock[];
}): Promise<{ id: string; url: string }> {
  const notion = getNotionClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = blocks.map((block) => {
    if (block.type === "paragraph") {
      return {
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: block.text } }] },
      };
    }
    if (block.type === "bear") {
      // 読み取り側は🧸=kid、👤=consultant(相談者「にゃんみ」)、それ以外=mama扱い。
      // アイコンを省略するとNotionが勝手に💡をあてるので、mama側も明示的に🐻を指定する
      const icon =
        block.speaker === "kid"
          ? "🧸"
          : block.speaker === "consultant"
            ? "👤"
            : "🐻";
      const callout: Record<string, unknown> = {
        rich_text: [{ type: "text", text: { content: block.text } }],
        icon: { type: "emoji", emoji: icon },
      };
      return { object: "block", type: "callout", callout };
    }
    if (block.type === "heading") {
      return {
        object: "block",
        type: "heading_2",
        heading_2: { rich_text: [{ type: "text", text: { content: block.text } }] },
      };
    }
    // bullet
    return {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: { rich_text: [{ type: "text", text: { content: block.text } }] },
    };
  });

  const page = await notion.pages.create({
    parent: { data_source_id: getDataSourceId() },
    properties: {
      記事タイトル: { title: [{ type: "text", text: { content: title } }] },
      Status: { select: { name: "下書き" } },
      カテゴリ: { select: { name: category } },
    },
    children,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = page as any;

  // Notion上の「プレビュー」列(url型)に、下書きのまま見られるプレビューURLを入れる。
  // idはページ作成後でないと分からないので、作成直後にもう一度updateする
  const previewSecret = process.env.PREVIEW_SECRET;
  if (previewSecret) {
    await notion.pages.update({
      page_id: p.id,
      properties: {
        プレビュー: {
          url: `https://hahanavi.vercel.app/api/preview?id=${p.id.replace(/-/g, "")}&secret=${previewSecret}`,
        },
      },
    });
  }

  return { id: p.id, url: p.url ?? `https://www.notion.so/${p.id.replace(/-/g, "")}` };
}

export async function getArticle(id: string): Promise<Article | null> {
  "use cache";
  cacheLife("minutes");
  const notion = getNotionClient();
  let page;
  try {
    page = await notion.pages.retrieve({ page_id: id });
  } catch {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = page as any;
  const title = plainText(p.properties?.記事タイトル?.title) || "無題";
  const status = p.properties?.Status?.select?.name ?? "";
  const relatedRaw = plainText(p.properties?.関連制度?.rich_text);
  const relatedPrograms = resolveRelatedPrograms(relatedRaw);

  const children = await notion.blocks.children.list({
    block_id: id,
    page_size: 100,
  });

  const blocks: ArticleBlock[] = [];
  for (const block of children.results) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = block as any;
    if (b.type === "paragraph") {
      const text = plainText(b.paragraph?.rich_text);
      const url = firstLink(b.paragraph?.rich_text);
      if (text) blocks.push({ type: "paragraph", text, url });
    } else if (b.type === "callout") {
      const text = plainText(b.callout?.rich_text);
      // Notionでコールアウトのアイコンを🧸にすると熊太郎、👤にすると相談者(にゃんみ)が
      // 喋ってる扱いになる(それ以外は全部シングマちゃん)
      const speaker: BearSpeaker =
        b.callout?.icon?.emoji === "🧸"
          ? "kid"
          : b.callout?.icon?.emoji === "👤"
            ? "consultant"
            : "mama";
      if (text) blocks.push({ type: "bear", text, speaker });
    } else if (b.type === "heading_1" || b.type === "heading_2" || b.type === "heading_3") {
      const text = plainText(b[b.type]?.rich_text);
      if (text) blocks.push({ type: "heading", text });
    } else if (b.type === "bulleted_list_item" || b.type === "numbered_list_item") {
      const text = plainText(b[b.type]?.rich_text);
      if (text) blocks.push({ type: "bullet", text });
    }
  }

  return {
    id,
    title,
    published: status === "公開",
    blocks,
    relatedPrograms,
    createdTime: p.created_time,
    lastEditedTime: p.last_edited_time,
  };
}
