import { notFound } from "next/navigation";
import { PortalRoom } from "@/components/app/PortalRoom";
import { isPortal } from "@/lib/portals";

export default async function PortalDetailPage({
  params,
}: {
  params: Promise<{ portal: string }>;
}) {
  const { portal } = await params;
  if (!isPortal(portal)) notFound();
  return <PortalRoom portal={portal} />;
}
