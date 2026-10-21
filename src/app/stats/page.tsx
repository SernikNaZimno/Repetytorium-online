import type { Metadata } from "next";
import { StatsView } from "@/components/views/stats-view";

export const metadata: Metadata = { title: "Statystyki" };

export default function StatsPage() {
  return <StatsView />;
}
