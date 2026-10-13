import { TalentDetail } from "@/components/pages/Talents";
import { nameBySlug, serverData, slugParams } from "@/lib/server";

export const dynamicParams = false;
export const generateStaticParams = () => slugParams(serverData().talents);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: nameBySlug(serverData().talents, slug) };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TalentDetail slug={slug} />;
}
