import { Client } from "@notionhq/client";
import { cacheLife } from "next/cache";

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
    title: plainText(page.properties?.Name?.title) || "無題",
    createdTime: page.created_time,
    category: page.properties?.カテゴリ?.select?.name,
  }));
}

export type BearSpeaker = "mama" | "kid";

export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "bear"; text: string; speaker: BearSpeaker }
  | { type: "heading"; text: string }
  | { type: "bullet"; text: string };

export type Article = {
  id: string;
  title: string;
  published: boolean;
  blocks: ArticleBlock[];
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
      // mama発言はアイコン無し(読み取り側は🧸以外=mama扱い)。Notion APIはicon: nullを
      // 受け付けないため、無しにしたい場合はキー自体を省略する
      const callout: Record<string, unknown> = {
        rich_text: [{ type: "text", text: { content: block.text } }],
      };
      if (block.speaker === "kid") {
        callout.icon = { type: "emoji", emoji: "🧸" };
      }
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
      Name: { title: [{ type: "text", text: { content: title } }] },
      Status: { select: { name: "下書き" } },
      カテゴリ: { select: { name: category } },
    },
    children,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = page as any;
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
  const title = plainText(p.properties?.Name?.title) || "無題";
  const status = p.properties?.Status?.select?.name ?? "";

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
      if (text) blocks.push({ type: "paragraph", text });
    } else if (b.type === "callout") {
      const text = plainText(b.callout?.rich_text);
      // Notionでコールアウトのアイコンを🧸にすると熊太郎が喋ってる扱いになる(それ以外は全部シングマちゃん)
      const speaker: BearSpeaker =
        b.callout?.icon?.emoji === "🧸" ? "kid" : "mama";
      if (text) blocks.push({ type: "bear", text, speaker });
    } else if (b.type === "heading_1" || b.type === "heading_2" || b.type === "heading_3") {
      const text = plainText(b[b.type]?.rich_text);
      if (text) blocks.push({ type: "heading", text });
    } else if (b.type === "bulleted_list_item" || b.type === "numbered_list_item") {
      const text = plainText(b[b.type]?.rich_text);
      if (text) blocks.push({ type: "bullet", text });
    }
  }

  return { id, title, published: status === "公開", blocks };
}
