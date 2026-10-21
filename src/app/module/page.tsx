import { Suspense } from "react";
import type { Metadata } from "next";
import { ModuleView } from "@/components/views/module-view";
import { PageLoading } from "@/components/layout/page-loading";

export const metadata: Metadata = { title: "Moduł" };

export default function ModulePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ModuleView />
    </Suspense>
  );
}
