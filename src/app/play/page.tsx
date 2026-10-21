import { Suspense } from "react";
import type { Metadata } from "next";
import { PlayView } from "@/components/views/play-view";
import { PageLoading } from "@/components/layout/page-loading";

export const metadata: Metadata = { title: "Sesja" };

export default function PlayPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PlayView />
    </Suspense>
  );
}
