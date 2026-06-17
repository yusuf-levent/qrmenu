import { TrackingView } from "@/features/tracking-view";

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TrackingView id={id} />;
}
