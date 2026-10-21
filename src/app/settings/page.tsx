import type { Metadata } from "next";
import { SettingsView } from "@/components/views/settings-view";

export const metadata: Metadata = { title: "Ustawienia" };

export default function SettingsPage() {
  return <SettingsView />;
}
