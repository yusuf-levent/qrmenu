import { PaymentView } from "@/features/payment-view";

export default async function OrderPayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PaymentView id={id} />;
}

