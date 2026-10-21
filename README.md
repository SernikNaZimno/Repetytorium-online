# Repetytorium online

Modułowa aplikacja do nauki i powtórek (Next.js + React). Każdy **moduł** to zestaw materiału (słówka, pojęcia,
zdania, zadania egzaminacyjne), a wspólne **ćwiczenia** i **system powtórek FSRS** działają dla każdego modułu.

## Jak działa nauka

System nauki opiera się na wynikach badań nad pamięcią:

| Mechanizm | Co robi aplikacja | Dlaczego |
|---|---|---|
| **FSRS** zamiast pudełek Leitnera | Dla każdej karty liczy stabilność i trudność pamięci i planuje powtórkę, gdy szansa przypomnienia spada do docelowej retencji (domyślnie 90%, do zmiany w ustawieniach). | W otwartym benchmarku na tysiącach kolekcji Anki FSRS przewiduje zapominanie lepiej niż SM-2 i do osiągnięcia tej samej retencji potrzebuje mniej powtórek. |
| **Osobne karty dla umiejętności** | Słowo ma osobne karty: rozpoznawanie, przypominanie, wymowa/pinyin, słuch i użycie w zdaniu. | Pamięć jest specyficzna dla umiejętności: kto ćwiczy tylko rozpoznawanie, słabo radzi sobie z przypominaniem i odwrotnie (dotyczy to też percepcji i produkcji tonów). |
| **Progresja trudności** | Umiejętności odblokowują się po kolei: rozpoznawanie → przypominanie → wymowa i słuch → zdania. Słabą kartę sprawdza quiz wyboru, a mocną fiszka albo wpisywanie z pamięci. | „Pożądane trudności”: przypominanie wzmacnia pamięć bardziej niż rozpoznawanie, ale tylko wtedy, gdy jest wykonalne. |
| **Ocena bez klikania** | Odpowiedź zła → *Again*, poprawna z podpowiedzią lub po długim namyśle → *Hard*, poprawna i płynna → *Good*. W fiszkach oceniasz się sam w skali 1–4, a przyciski pokazują termin następnej powtórki. | FSRS potrzebuje informacji, jak trudne było przypomnienie, a nie tylko czy się udało. |
| **Przeplatanie** | „Ucz się” miesza powtórki, nowe słowa i różne formy ćwiczeń. Kroki jednego słowa są rozsunięte. | Przeplatanie i odstępy działają lepiej niż blokowanie jednego typu zadań. |
| **Nowe słowa: prezentacja → test** | Nowe słowo najpierw widzisz (znak, pinyin, znaczenie, wymowa, zdanie), po 2–3 zadaniach rozpoznajesz je, a potem przypominasz. Dzienny limit nowych słów zapobiega lawinie powtórek. | Szybka próba przypomnienia zaraz po zapoznaniu się ze słowem utrwala je lepiej niż samo czytanie. |
| **Błędy wracają w sesji** | Pomylone słowo wraca po 4 pytaniach (najwyżej dwa razy), aż odpowiesz poprawnie. | „Ponowna nauka do skutku” (successive relearning). |
| **Trening tonów** | Ćwiczenie „rozpoznaj tony”: słyszysz słowo i wybierasz wzór tonów pokazany jako kontur wysokości głosu. Pinyin jest wszędzie kolorowany według tonu, a przy wpisywaniu widać, która sylaba miała zły ton. | Badania nad nauką tonów mandaryńskich pokazują korzyść z treningu percepcji i wizualnych wskazówek, np. konturów wysokości. |
| **Trudne słowa (pijawki)** | Słowa zapomniane co najmniej 4 razy są oznaczane i można je ćwiczyć osobno. | Takie słowa wymagają innej strategii, np. skojarzenia albo rozbicia znaku na części, a nie kolejnych powtórek. |

## Moduły w zestawie

| Moduł | Zawartość |
|---|---|
| **Chiński HSK 2** | ok. 150 słów HSK 2 (wersja 2.0) z pinyinem i tłumaczeniem, zdanie przykładowe do każdego słowa i zadania egzaminacyjne: dialogi do słuchania (听力), uzupełnianie zdań (选词填空), prawda/fałsz (判断对错), dopasowywanie odpowiedzi i egzamin próbny (40 pytań, próg 60%) |
| **Chiński HSK 1** | ok. 150 podstawowych słów (na egzaminie HSK 2 obowiązuje też słownictwo HSK 1) |
| **Stolice Europy** | przykład modułu spoza nauki języków |
| **Własne moduły** | tworzone w aplikacji: wklejasz listę „słowo ; wymowa ; znaczenie” lub importujesz JSON |

Oprócz „Ucz się” każde ćwiczenie można uruchomić osobno: fiszki (zwykłe i odwrotne), quizy wyboru, wpisywanie,
dopasowywanie par, rozpoznawanie ze słuchu, rozpoznawanie tonów, uzupełnianie i układanie zdań, dialogi, prawda/fałsz,
dopasowywanie odpowiedzi i egzamin próbny. Zakres można zawęzić do zestawów po 15 słów, słów do powtórki, nowych albo trudnych.
Strona statystyk pokazuje aktywność, prognozę powtórek z FSRS i rzeczywistą retencję.

## Technologie

Next.js 16 (App Router, eksport statyczny), React 19, TypeScript, Tailwind CSS 4, komponenty w stylu shadcn/ui na Radix UI,
Motion (animacje), Lucide (ikony), Zustand (stan zapisywany w `localStorage`), ts-fsrs (algorytm powtórek),
Recharts (wykresy), Sonner (powiadomienia) i Vitest (testy).

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # testy logiki i danych modułów
npm run build    # eksport statyczny do katalogu out/
```

### Publikacja na GitHub Pages

Workflow `.github/workflows/deploy.yml` przy każdym pushu uruchamia lint, testy i build. Z gałęzi domyślnej publikuje
stronę na GitHub Pages. Wystarczy raz ustawić w repozytorium *Settings → Pages → Source: **GitHub Actions***.
Strona będzie pod adresem `https://<użytkownik>.github.io/<repozytorium>/`.

Wymowa korzysta z syntezy mowy przeglądarki. Chiński głos jest zwykle dostępny w Chrome, Edge, Safari i na Androidzie.

## Jak dodać moduł

1. Utwórz `src/modules/<nazwa>/index.ts`:

```ts
import type { ModuleDef } from "@/lib/types";

const angielski: ModuleDef = {
  id: "angielski-b1",
  title: "Angielski B1",
  subtitle: "Krótki opis na karcie",
  icon: "🇬🇧",
  color: "#3366cc",
  lang: "en-GB",                 // język syntezy mowy (opcjonalnie)
  labels: { term: "Słowo", reading: "Wymowa", meaning: "Znaczenie" },
  // [termin, znaczenie] albo [termin, wymowa, znaczenie]
  items: [
    ["weather", "ˈweðə", "pogoda"],
    ["to borrow", "ˈbɒrəʊ", "pożyczać (od kogoś)"],
  ],
  // opcjonalnie: zdania (słowa oddzielone spacjami, {…} = ćwiczone słowo)
  sentences: [["What is the {weather} like today ?", "", "Jaka jest dziś pogoda?"]],
};

export default angielski;
```

2. Dopisz moduł w `src/modules/index.ts`.
3. Uruchom `npm test`. Testy sprawdzają między innymi, czy zdania wskazują istniejące słowa, czy liczba sylab pinyinu zgadza się
   z liczbą znaków i czy zadania egzaminacyjne mają poprawny format.

Chińskie moduły dostają `script: "zh"` i `readingType: "pinyin"` (zobacz `src/modules/hsk2`). Bez listy `exercises`
aplikacja sama dobiera ćwiczenia do dostępnych danych.

## Struktura

```
src/app/                  strony (/, /module, /module/words, /play, /stats, /create, /settings)
src/components/ui/        komponenty bazowe (shadcn/ui)
src/components/exercises/ ćwiczenia
src/components/session/   przebieg sesji, ponowne pytania po błędach, podsumowanie
src/lib/srs.ts            FSRS: karty, oceny, retencja
src/lib/planner.ts        planer sesji „Ucz się”
src/lib/exercises.ts      katalog ćwiczeń i budowanie pytań
src/lib/pinyin.ts         porównywanie pinyinu, podział na sylaby, wzory tonów
src/modules/              dane modułów
tests/                    testy (Vitest)
```
