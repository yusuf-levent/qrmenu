import { CustomerMenu } from "@/features/customer-menu";

export default async function MenuByTablePage({ params }: { params: Promise<{ qrToken: string }> }) {
  const { qrToken } = await params;
  return <CustomerMenu mode="table" value={qrToken} />;
}

