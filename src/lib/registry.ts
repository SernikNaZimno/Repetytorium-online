"use client";

import { useMemo } from "react";
import builtInModules from "@/modules";
import { normalizeModule } from "./module";
import { useStore } from "./store";
import type { StudyModule } from "./types";

const builtIn = builtInModules.map(normalizeModule);

export function useModules(): StudyModule[] {
  const custom = useStore(s => s.custom);
  return useMemo(() => [...builtIn, ...custom.map(def => normalizeModule({ ...def, custom: true }))], [custom]);
}

export function useModule(id: string | null | undefined): StudyModule | null {
  const modules = useModules();
  return modules.find(m => m.id === id) ?? null;
}
