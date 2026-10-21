// Lista wbudowanych modułów. Aby dodać nowy moduł: utwórz folder w src/modules
// z plikiem index.ts (opis formatu w README.md) i dopisz go poniżej.
import type { ModuleDef } from "@/lib/types";
import hsk1 from "./hsk1";
import hsk2 from "./hsk2";
import stoliceEuropy from "./stolice-europy";

const builtInModules: ModuleDef[] = [hsk2, hsk1, stoliceEuropy];

export default builtInModules;
