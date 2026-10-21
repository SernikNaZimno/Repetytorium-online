import { Suspense } from "react";
import type { Metadata } from "next";
import { WordsView } from "@/components/views/words-view";
import { PageLoading } from "@/components/layout/page-loading";

export const metadata: Metadata = { title: "Lista słów" };

export default function WordsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <WordsView />
    </Suspense>
  );
}
