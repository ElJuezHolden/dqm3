import { PlaceDetail } from "@/components/pages/Places";
import { nameBySlug, serverData, slugParams } from "@/lib/server";

export const dynamicParams = false;
export const generateStaticParams = () => slugParams(serverData().locations);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: nameBySlug(serverData().locations, slug) };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PlaceDetail slug={slug} />;
}
