import { CustomerMenu } from "@/features/customer-menu";

export default async function MenuBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CustomerMenu mode="slug" value={slug} />;
}

