import { Suspense } from "react";
import type { Metadata } from "next";
import { CreateView } from "@/components/views/create-view";
import { PageLoading } from "@/components/layout/page-loading";

export const metadata: Metadata = { title: "Nowy moduł" };

export default function CreatePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <CreateView />
    </Suspense>
  );
}
