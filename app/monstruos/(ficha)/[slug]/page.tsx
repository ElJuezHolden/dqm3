import { MonsterDetail } from "@/components/pages/MonsterDetail";
import { nameBySlug, serverData, slugParams } from "@/lib/server";

export const dynamicParams = false;
export const generateStaticParams = () => slugParams(serverData().monsters);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: nameBySlug(serverData().monsters, slug) };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MonsterDetail slug={slug} />;
}
