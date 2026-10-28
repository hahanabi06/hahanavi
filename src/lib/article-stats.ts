import { getSupabaseServerClient } from "@/lib/supabase";

export async function incrementArticleView(articleId: string) {
  const supabase = getSupabaseServerClient();
  await supabase.rpc("increment_article_view", { p_article_id: articleId });
}

export async function getArticleViewCounts(
  articleIds: string[],
): Promise<Record<string, number>> {
  if (articleIds.length === 0) return {};
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("article_stats")
    .select("article_id, views")
    .in("article_id", articleIds);

  if (error || !data) return {};
  return Object.fromEntries(data.map((row) => [row.article_id, row.views]));
}
