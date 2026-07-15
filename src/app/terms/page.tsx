import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | Maeve",
};

export default function TermsPage() {
  return <LegalPage doc="terms" />;
}
