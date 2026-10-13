import { SkillDetail } from "@/components/pages/Skills";
import { nameBySlug, serverData, slugParams } from "@/lib/server";

export const dynamicParams = false;
export const generateStaticParams = () => slugParams(serverData().skills);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: nameBySlug(serverData().skills, slug) };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SkillDetail slug={slug} />;
}
