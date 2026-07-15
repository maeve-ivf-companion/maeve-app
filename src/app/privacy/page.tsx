import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Maeve",
};

export default function PrivacyPage() {
  return <LegalPage doc="privacy" />;
}
