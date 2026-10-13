import { FamilyDetail } from "@/components/pages/Families";
import { nameBySlug, serverData, slugParams } from "@/lib/server";

export const dynamicParams = false;
export const generateStaticParams = () => slugParams(serverData().families);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: nameBySlug(serverData().families, slug) };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <FamilyDetail slug={slug} />;
}
