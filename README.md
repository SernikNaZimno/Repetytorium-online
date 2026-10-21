# Repetytorium online

Modułowa aplikacja do nauki i powtórek. Każdy **moduł** to zestaw materiału (słówka, pojęcia, zdania, zadania),
a wspólne **typy ćwiczeń** działają dla każdego modułu. Postęp jest zapamiętywany w przeglądarce, a system powtórek
w odstępach (pudełka Leitnera) podsuwa słowa, które właśnie trzeba powtórzyć.

## Moduły w zestawie

| Moduł | Zawartość |
|---|---|
| **Chiński HSK 2** | ok. 150 słów HSK 2 (wersja 2.0) z pinyinem i tłumaczeniem, zdanie przykładowe do każdego słowa, zadania egzaminacyjne: dialogi do słuchania (听力), uzupełnianie zdań (选词填空), prawda/fałsz (判断对错), dopasowywanie odpowiedzi, egzamin próbny |
| **Chiński HSK 1** | ok. 150 podstawowych słów (na egzaminie HSK 2 obowiązuje też słownictwo HSK 1) |
| **Stolice Europy** | przykład modułu spoza nauki języków |
| **Własne moduły** | tworzone w aplikacji – wystarczy wkleić listę „słowo ; wymowa ; znaczenie” |

## Rodzaje ćwiczeń

- **Fiszki** (i fiszki odwrotne) z samooceną: nie pamiętam / pamiętam / łatwe
- **Quiz wyboru**: znak → znaczenie, znaczenie → znak, znak → pinyin
- **Wpisywanie**: pinyin z tonami (cyframi `ni3hao3` lub znakami `nǐhǎo`) albo dowolne pole
- **Dopasuj pary**: po 5 par na planszy
- **Rozpoznaj ze słuchu**: synteza mowy czyta słowo, wybierasz właściwy znak (homofony są pomijane)
- **Uzupełnij zdanie**: luka w zdaniu i 4 słowa do wyboru
- **Ułóż zdanie**: rozsypane słowa i tłumaczenie jako podpowiedź
- **Słuchanie dialogów**: krótkie rozmowy z pytaniem, głosy rozmówców różnią się wysokością
- **Prawda czy fałsz** i **Dopasuj odpowiedź**: zadania z części „czytanie”
- **Egzamin próbny**: 40 pytań w 4 sekcjach, wynik dla każdej sekcji i próg 60%

Po każdej sesji widać wynik, listę błędów i przycisk „Powtórz błędne”. Zakres materiału da się zawęzić do
zestawów po 15 słów, słów do powtórki, nowych albo trudnych. Ćwiczenia można robić z klawiatury:
`1–4` wybiera odpowiedź, `Enter` przechodzi dalej, a `spacja` odwraca fiszkę lub odtwarza nagranie.

## Uruchomienie

Aplikacja jest w pełni statyczna (HTML + JavaScript, bez instalowania zależności i bez budowania).
Moduły ES nie działają z `file://`, więc stronę trzeba otworzyć przez dowolny serwer HTTP:

```bash
python3 -m http.server 8000
# potem otwórz http://localhost:8000
```

**Publikacja w internecie (GitHub Pages):** *Settings → Pages → Deploy from a branch*, wybierz gałąź i katalog `/ (root)`.

Wymowa korzysta z syntezy mowy przeglądarki. Chiński głos jest zwykle dostępny w Chrome, Edge, Safari i na Androidzie.
W Windows/Linuksie może być trzeba doinstalować głos chiński w ustawieniach systemu. Bez niego ćwiczenia ze słuchu
pozwalają podejrzeć tekst nagrania.

Postęp jest zapisywany w `localStorage`. W *Ustawieniach* można go wyeksportować do pliku i wczytać na innym urządzeniu.

## Jak dodać moduł

1. Utwórz folder `modules/<nazwa>/` z plikiem `index.js`:

```js
export default {
  id: 'angielski-b1',                 // unikalny identyfikator (używany w adresie i do zapisu postępów)
  title: 'Angielski B1',
  subtitle: 'Krótki opis na karcie',
  description: 'Dłuższy opis na stronie modułu',
  icon: '🇬🇧',
  color: '#3366cc',
  lang: 'en-GB',                       // język syntezy mowy (opcjonalnie)
  script: '',                          // 'zh' włącza chińską czcionkę i zapis zdań bez spacji
  readingType: '',                     // 'pinyin' włącza sprawdzanie pinyinu z tonami
  labels: { term: 'Słowo', reading: 'Wymowa', meaning: 'Znaczenie' },
  groupSize: 15,                       // wielkość zestawów

  // [termin, znaczenie] albo [termin, wymowa, znaczenie]
  items: [
    ['weather', 'ˈweðə', 'pogoda'],
    ['to borrow', 'ˈbɒrəʊ', 'pożyczać (od kogoś)'],
  ],

  // Opcjonalnie: zdania (włączają „Uzupełnij zdanie” i „Ułóż zdanie”).
  // Słowa oddzielone spacjami, {…} oznacza ćwiczone słowo.
  // Czwarty element to id słowa, jeśli luka nie jest równa terminowi.
  sentences: [
    ['What is the {weather} like today ?', '', 'Jaka jest dziś pogoda?'],
  ],

  // Opcjonalnie: zadania egzaminacyjne (format: zobacz modules/hsk2/exam.js)
  exam: { judge: [], replies: [], dialogs: [] },

  // Opcjonalnie: lista ćwiczeń. Bez niej aplikacja dobierze ćwiczenia do dostępnych danych.
  exercises: [
    { type: 'flashcards' },
    { type: 'choice', from: 'term', to: 'meaning' },
    { type: 'typing', from: 'meaning', to: 'term', title: 'Wpisz słowo' },
    { type: 'matching' },
  ],
};
```

2. Dopisz moduł w `modules/index.js`.
3. Uruchom `npm test`. Testy sprawdzają między innymi, czy każde zdanie wskazuje istniejące słowo,
   czy pinyin jest kompletny i czy zadania egzaminacyjne mają poprawny format.

Moduł utworzony w aplikacji (*＋ Moduł*) można wyeksportować do JSON-a i zaimportować na innym urządzeniu.

## Jak dodać typ ćwiczenia

Każdy typ to plik w `js/exercises/` eksportujący obiekt z polami:

- `type`, `category` (`'vocab'` lub `'exam'`), `icon`, `title(cfg, m)`, `description(cfg, m)`
- `available(m, cfg)`: czy moduł ma dane potrzebne do tego ćwiczenia
- `build(m, ctx)`: zwraca listę pytań. `ctx.pick(n)` wybiera słowa według systemu powtórek
- `render(question, ui, body)`: rysuje pytanie i woła `ui.answer(correct, { reveal })` albo `ui.grade(id, 0–2)`

Nowy typ trzeba dopisać w `js/exercises/index.js`.

## Struktura

```
index.html, css/style.css
js/main.js            – router (#/…)
js/core/              – zapis postępów, system powtórek, pinyin, synteza mowy, normalizacja modułów
js/ui/                – widoki: strona główna, moduł, lista słów, sesja, tworzenie modułu, ustawienia
js/exercises/         – typy ćwiczeń
modules/              – dane modułów
tests/                – testy (node --test)
```

## Testy

```bash
npm test
```
