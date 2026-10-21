// Zadania w formacie egzaminu HSK 2.

// 判断对错 – przeczytaj tekst i oceń, czy zdanie oznaczone ★ jest prawdziwe.
// Format: [tekst, ★ zdanie, prawda/fałsz, tłumaczenie tekstu, tłumaczenie zdania]
export const judge = [
  ['我今天早上六点就起床了，因为我要去机场送朋友。', '他今天要去机场。', true,
    'Dziś wstałem już o szóstej, bo muszę odprowadzić przyjaciela na lotnisko.', 'On dziś jedzie na lotnisko.'],
  ['我妹妹比我小三岁，她今年十八岁。', '我今年二十岁。', false,
    'Moja młodsza siostra jest ode mnie młodsza o trzy lata, w tym roku kończy osiemnaście lat.', 'W tym roku mam dwadzieścia lat.'],
  ['这家宾馆离火车站很近，走路五分钟就到了。', '宾馆离火车站很远。', false,
    'Ten hotel jest blisko dworca, pieszo dojdziesz w pięć minut.', 'Hotel jest daleko od dworca.'],
  ['虽然这件衣服很漂亮，但是太贵了，我不想买。', '他觉得那件衣服很便宜。', false,
    'Chociaż to ubranie jest ładne, jest za drogie i nie chcę go kupić.', 'Uważa, że to ubranie jest tanie.'],
  ['今天是阴天，下午可能会下雨，我们明天再去打篮球吧。', '他们今天不去打篮球了。', true,
    'Dziś jest pochmurno i po południu może padać, chodźmy zagrać w koszykówkę jutro.', 'Dzisiaj nie idą grać w koszykówkę.'],
  ['我每天晚上都去跑步，跑一个小时。', '他每天跑步两个小时。', false,
    'Codziennie wieczorem chodzę biegać, biegam godzinę.', 'Codziennie biega dwie godziny.'],
  ['我丈夫非常喜欢吃鱼，但是不喜欢吃羊肉。', '她丈夫喜欢吃鱼。', true,
    'Mój mąż bardzo lubi ryby, ale nie lubi baraniny.', 'Jej mąż lubi jeść ryby.'],
  ['我学汉语已经三年了，现在能看懂中文报纸了。', '他学了三年汉语。', true,
    'Uczę się chińskiego już trzy lata, teraz potrafię czytać chińskie gazety.', 'Uczył się chińskiego trzy lata.'],
  ['他生病了，医生让他在家休息两天，所以他今天没去上班。', '他今天在公司工作。', false,
    'Zachorował, lekarz kazał mu odpoczywać w domu dwa dni, więc dziś nie poszedł do pracy.', 'Dziś pracuje w firmie.'],
  ['我们公司早上九点上班，但是我每天八点半就到公司了。', '他每天到公司很早。', true,
    'W naszej firmie pracę zaczyna się o dziewiątej, ale ja codziennie jestem już o wpół do dziewiątej.', 'Codziennie przychodzi do firmy wcześnie.'],
  ['这块手表是我丈夫送给我的，我非常喜欢。', '她不喜欢这块手表。', false,
    'Ten zegarek podarował mi mąż, bardzo mi się podoba.', 'Nie podoba jej się ten zegarek.'],
  ['大家好，我来介绍一下，这是我们的新同学。', '他们有一个新同学。', true,
    'Witajcie, przedstawię wam naszego nowego kolegę z klasy.', 'Mają nowego kolegę w klasie.'],
  ['这个问题我问了哥哥，他也不知道。', '哥哥回答了这个问题。', false,
    'Zapytałem o to starszego brata, ale on też nie wie.', 'Brat odpowiedział na to pytanie.'],
  ['今天的考试题不多，我半个小时就做完了。', '他考试用了两个小时。', false,
    'Na dzisiejszym egzaminie nie było dużo zadań, skończyłem w pół godziny.', 'Egzamin zajął mu dwie godziny.'],
  ['我家旁边有个商店，那儿的西瓜很便宜。', '那个商店的西瓜很贵。', false,
    'Obok mojego domu jest sklep, arbuzy są tam bardzo tanie.', 'Arbuzy w tym sklepie są drogie.'],
  ['弟弟正在房间里准备明天的考试，我们别去找他玩了。', '弟弟明天有考试。', true,
    'Młodszy brat przygotowuje się w pokoju do jutrzejszego egzaminu, nie przeszkadzajmy mu.', 'Młodszy brat ma jutro egzamin.'],
  ['我第一次来中国的时候，一个汉字也不认识。', '他第一次来中国的时候认识很多汉字。', false,
    'Kiedy pierwszy raz przyjechałem do Chin, nie znałem ani jednego znaku.', 'Kiedy pierwszy raz przyjechał do Chin, znał wiele znaków.'],
  ['外面下雪了，非常冷，你多穿件衣服吧。', '今天天气很热。', false,
    'Na dworze pada śnieg i jest bardzo zimno, ubierz się cieplej.', 'Dziś jest bardzo gorąco.'],
  ['你等我一下，我洗完衣服就和你一起去吃饭。', '他现在正在吃饭。', false,
    'Poczekaj chwilę, jak skończę prać, pójdę z tobą coś zjeść.', 'On właśnie je.'],
  ['我最喜欢的运动是游泳，每个星期都去游两次。', '他每个星期游泳两次。', true,
    'Mój ulubiony sport to pływanie, chodzę na basen dwa razy w tygodniu.', 'Pływa dwa razy w tygodniu.'],
];

// Dopasuj odpowiedź do pytania.
// Format: [pytanie, odpowiedź, tłumaczenie pytania, tłumaczenie odpowiedzi]
export const replies = [
  ['你吃饭了吗？', '还没有呢，我们一起去吧。', 'Jadłeś już?', 'Jeszcze nie, chodźmy razem.'],
  ['你怎么了？是不是生病了？', '是的，医生让我多休息。', 'Co ci jest? Zachorowałeś?', 'Tak, lekarz kazał mi dużo odpoczywać.'],
  ['你的新手机多少钱？', '两千多块。', 'Ile kosztował twój nowy telefon?', 'Ponad dwa tysiące juanów.'],
  ['火车站离这儿远吗？', '不远，走十分钟就到了。', 'Czy dworzec jest daleko stąd?', 'Niedaleko, dziesięć minut pieszo.'],
  ['你为什么不喝咖啡？', '我晚上喝咖啡会睡不着。', 'Dlaczego nie pijesz kawy?', 'Jak wypiję kawę wieczorem, nie mogę zasnąć.'],
  ['明天几点考试？', '上午九点开始。', 'O której jutro jest egzamin?', 'Zaczyna się o dziewiątej rano.'],
  ['你会游泳吗？', '会，我从小就喜欢游泳。', 'Umiesz pływać?', 'Umiem, od dziecka lubię pływać.'],
  ['你喜欢什么颜色？', '我最喜欢红色。', 'Jaki kolor lubisz?', 'Najbardziej lubię czerwony.'],
  ['欢迎来我家！', '谢谢，你家真漂亮。', 'Witaj w moim domu!', 'Dziękuję, masz piękny dom.'],
  ['这件衣服怎么样？', '很漂亮，但是有点儿长。', 'Jak ci się podoba to ubranie?', 'Bardzo ładne, ale trochę za długie.'],
  ['请问，您姓什么？', '我姓王。', 'Przepraszam, jak się Pan nazywa?', 'Nazywam się Wang.'],
  ['你哥哥在哪儿工作？', '他在一家电脑公司上班。', 'Gdzie pracuje twój starszy brat?', 'Pracuje w firmie komputerowej.'],
  ['今天天气怎么样？', '是晴天，不冷也不热。', 'Jaka jest dziś pogoda?', 'Słonecznie, ani zimno, ani gorąco.'],
  ['你看过这个电影吗？', '看过，非常好看。', 'Widziałeś ten film?', 'Widziałem, jest świetny.'],
  ['你什么时候去旅游？', '下个月去北京。', 'Kiedy jedziesz na wycieczkę?', 'W przyszłym miesiącu jadę do Pekinu.'],
  ['服务员，有面条吗？', '有，请等一下。', 'Przepraszam (kelner), czy jest makaron?', 'Jest, proszę chwilę poczekać.'],
  ['你等了多长时间了？', '没多长时间，十分钟。', 'Jak długo czekasz?', 'Niedługo, dziesięć minut.'],
  ['你每天怎么去学校？', '坐公共汽车去。', 'Jak codziennie dojeżdżasz do szkoły?', 'Autobusem.'],
  ['你妹妹今年多大了？', '她今年七岁了。', 'Ile lat ma twoja młodsza siostra?', 'W tym roku skończyła siedem lat.'],
  ['这个字是什么意思？', '对不起，我也不懂。', 'Co znaczy ten znak?', 'Przepraszam, też nie rozumiem.'],
  ['生日快乐！', '谢谢你！', 'Wszystkiego najlepszego z okazji urodzin!', 'Dziękuję!'],
  ['你的眼睛怎么红了？', '昨天晚上看书看到十二点。', 'Czemu masz czerwone oczy?', 'Wczoraj czytałem do północy.'],
  ['谁是你们的汉语老师？', '那个穿白衣服的女人。', 'Kto jest waszym nauczycielem chińskiego?', 'Ta kobieta w białym ubraniu.'],
  ['我们一起去踢足球吧！', '好啊，等我一下。', 'Chodźmy razem pograć w piłkę!', 'Dobra, poczekaj chwilę.'],
];

// 听力 – krótkie dialogi do odsłuchania. Pierwsza opcja jest poprawna (kolejność jest losowana).
export const dialogs = [
  {
    lines: [['男', '你明天几点去机场？'], ['女', '上午十点，你能送我去吗？']],
    question: '女的明天要去哪儿？', options: ['机场', '火车站', '宾馆'],
    meaning: 'M: O której jutro jedziesz na lotnisko? K: O dziesiątej rano, możesz mnie zawieźć? — Pytanie: Dokąd jutro jedzie kobieta?',
  },
  {
    lines: [['女', '你的手表真漂亮，是新买的吗？'], ['男', '不是，是我妻子送我的。']],
    question: '手表是谁送的？', options: ['他妻子', '他妹妹', '他朋友'],
    meaning: 'K: Masz piękny zegarek, nowy? M: Nie, dostałem go od żony. — Pytanie: Kto podarował zegarek?',
  },
  {
    lines: [['男', '这个西瓜多少钱？'], ['女', '十块。'], ['男', '太贵了，八块吧。']],
    question: '女的说西瓜多少钱？', options: ['十块', '八块', '两块'],
    meaning: 'M: Ile kosztuje ten arbuz? K: Dziesięć juanów. M: Za drogo, może osiem? — Pytanie: Jaką cenę podała kobieta?',
  },
  {
    lines: [['女', '你怎么还不睡觉？'], ['男', '明天有考试，我在准备。']],
    question: '男的在做什么？', options: ['准备考试', '看电视', '睡觉'],
    meaning: 'K: Czemu jeszcze nie śpisz? M: Jutro mam egzamin, przygotowuję się. — Pytanie: Co robi mężczyzna?',
  },
  {
    lines: [['男', '你喜欢什么运动？'], ['女', '我喜欢游泳，也喜欢跑步。']],
    question: '女的喜欢什么运动？', options: ['游泳', '打篮球', '踢足球'],
    meaning: 'M: Jaki sport lubisz? K: Lubię pływać i biegać. — Pytanie: Jaki sport lubi kobieta?',
  },
  {
    lines: [['女', '我们坐公共汽车去吧。'], ['男', '路不远，我们走路去吧。']],
    question: '男的想怎么去？', options: ['走路', '坐公共汽车', '坐出租车'],
    meaning: 'K: Pojedźmy autobusem. M: To niedaleko, chodźmy pieszo. — Pytanie: Jak chce iść mężczyzna?',
  },
  {
    lines: [['男', '今天天气怎么样？'], ['女', '是阴天，可能会下雨。']],
    question: '今天天气怎么样？', options: ['阴天', '晴天', '下雪'],
    meaning: 'M: Jaka jest dziś pogoda? K: Pochmurno, może padać. — Pytanie: Jaka jest dziś pogoda?',
  },
  {
    lines: [['女', '你哥哥在哪儿工作？'], ['男', '他在医院工作，是医生。']],
    question: '男的哥哥做什么工作？', options: ['医生', '老师', '服务员'],
    meaning: 'K: Gdzie pracuje twój brat? M: W szpitalu, jest lekarzem. — Pytanie: Czym zajmuje się brat mężczyzny?',
  },
  {
    lines: [['男', '服务员，我要一杯咖啡。'], ['女', '好的，您还要别的吗？'], ['男', '再要一个鸡蛋。']],
    question: '男的要了什么？', options: ['咖啡和鸡蛋', '牛奶和鸡蛋', '咖啡和面条'],
    meaning: 'M: Poproszę kawę. K: Dobrze, coś jeszcze? M: Jeszcze jedno jajko. — Pytanie: Co zamówił mężczyzna?',
  },
  {
    lines: [['女', '你家离公司远吗？'], ['男', '很近，走路十分钟就到了。']],
    question: '男的家离公司怎么样？', options: ['很近', '很远', '要坐一个小时车'],
    meaning: 'K: Czy masz daleko z domu do pracy? M: Blisko, dziesięć minut pieszo. — Pytanie: Jak daleko ma mężczyzna do pracy?',
  },
  {
    lines: [['男', '你昨天为什么没来上课？'], ['女', '我生病了，在家休息了一天。']],
    question: '女的昨天为什么没来上课？', options: ['她生病了', '她去旅游了', '她去上班了'],
    meaning: 'M: Dlaczego wczoraj nie przyszłaś na zajęcia? K: Zachorowałam i cały dzień odpoczywałam w domu. — Pytanie: Dlaczego kobiety nie było na zajęciach?',
  },
  {
    lines: [['女', '这是你妹妹吗？她真高！'], ['男', '对，她比我还高。']],
    question: '谁比男的高？', options: ['他妹妹', '他姐姐', '他弟弟'],
    meaning: 'K: To twoja młodsza siostra? Jaka wysoka! M: Tak, jest nawet wyższa ode mnie. — Pytanie: Kto jest wyższy od mężczyzny?',
  },
  {
    lines: [['男', '你什么时候开始学汉语的？'], ['女', '去年九月。']],
    question: '女的什么时候开始学汉语？', options: ['去年九月', '今年九月', '去年十月'],
    meaning: 'M: Kiedy zaczęłaś uczyć się chińskiego? K: We wrześniu zeszłego roku. — Pytanie: Kiedy kobieta zaczęła się uczyć chińskiego?',
  },
  {
    lines: [['女', '喂，你在哪儿呢？'], ['男', '我在火车站旁边的宾馆，房间是三零八。']],
    question: '男的现在在哪儿？', options: ['宾馆', '火车站', '机场'],
    meaning: 'K: Halo, gdzie jesteś? M: W hotelu obok dworca, pokój 308. — Pytanie: Gdzie teraz jest mężczyzna?',
  },
  {
    lines: [['男', '这件衣服你穿着很漂亮，买吧。'], ['女', '颜色不错，但是太长了。']],
    question: '女的觉得衣服怎么样？', options: ['太长了', '太贵了', '颜色不好'],
    meaning: 'M: Ładnie ci w tym, kup. K: Kolor dobry, ale jest za długie. — Pytanie: Co kobieta sądzi o ubraniu?',
  },
  {
    lines: [['女', '你每天几点起床？'], ['男', '六点半，起床以后去跑步。']],
    question: '男的起床以后做什么？', options: ['跑步', '游泳', '看报纸'],
    meaning: 'K: O której codziennie wstajesz? M: O wpół do siódmej, potem idę biegać. — Pytanie: Co robi mężczyzna po wstaniu?',
  },
];
