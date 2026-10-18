import json
import re
import urllib.request
import os

def clean_word(w):
    if not w:
        return ''
    w = w.strip().lower()
    w = re.sub(r'[^a-z]', '', w)
    if 2 <= len(w) <= 24:
        return w
    return ''

def main():
    words_path = os.path.join('data', 'words.json')
    print("Loading existing dataset...")
    with open(words_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    existing_words = set()
    raw_list = data if isinstance(data, list) else data.get('words', [])
    for item in raw_list:
        w = item if isinstance(item, str) else item.get('word', '')
        c = clean_word(w)
        if c:
            existing_words.add(c)

    print(f"Existing valid words: {len(existing_words):,}")

    new_words = set()

    # 1. Extensive curated Indonesian words list especially boosting J, K, Q, X, Y, Z and common roots
    curated_id = [
        # J words
        "jabat", "jabatan", "jadwal", "jagal", "jago", "jagoan", "jagung", "jahanam", "jahat", "jahe", "jahit", "jajan", "jajang", "jajar", "jajaran", "jaket", "jaksa", "jalan", "jalang", "jalar", "jalur", "jamah", "jamak", "jaman", "jamban", "jambu", "jambrut", "jamin", "jaminan", "jampi", "jamu", "jamur", "janda", "jangan", "janggal", "janggut", "jangka", "jangkah", "jangkar", "jangkit", "janin", "jantan", "jantung", "janji", "jarak", "jarang", "jari", "jaring", "jarum", "jasa", "jasmani", "jatah", "jati", "jatuh", "jauh", "jawa", "jawab", "jawaban", "jawat", "jaya", "jebak", "jebakan", "jebol", "jebolan", "jeda", "jegil", "jejak", "jejal", "jejaka", "jejang", "jejas", "jejel", "jelajah", "jelajahin", "jelang", "jelapang", "jelas", "jelata", "jelek", "jeli", "jelma", "jelmaan", "jelujur", "jemaah", "jembatan", "jembut", "jempol", "jemput", "jemur", "jenaka", "jenang", "jenazah", "jendela", "jenderal", "jenggot", "jengkel", "jengkol", "jenguk", "jenis", "jentik", "jenuh", "jepang", "jepit", "jepitan", "jepret", "jepretan", "jera", "jeram", "jerat", "jerawat", "jerigen", "jerit", "jeritan", "jernih", "jeruk", "jewer", "jeweran", "jihad", "jijik", "jika", "jikalau", "jilat", "jilatan", "jilid", "jilbab", "jimat", "jinak", "jingga", "jinjing", "jiplak", "jiplakan", "jiran", "jirat", "jitu", "jiwa", "jodoh", "joget", "jongkok", "jorok", "jual", "jualan", "juara", "jubah", "jubel", "judi", "judes", "judul", "juga", "jujur", "jujuran", "juling", "juluk", "julukan", "julur", "jumat", "jumlah", "jumpa", "jumpai", "jungkir", "junjung", "juntai", "jupang", "juragan", "jurai", "jurang", "juri", "jurnal", "jurnalis", "juru", "jurusan", "justru", "juta", "jutaan", "jutawan",

        # K words
        "kabar", "kabel", "kabin", "kabinet", "kabisat", "kabor", "kabur", "kabus", "kabut", "kaca", "kacamata", "kacang", "kacau", "kaco", "kadal", "kadar", "kadas", "kader", "kadaluwarsa", "kado", "kafir", "kaftan", "kaget", "kagum", "kail", "kain", "kais", "kait", "kaitan", "kaji", "kajian", "kakak", "kakao", "kakap", "kakatua", "kaki", "kaku", "kalah", "kalang", "kalap", "kalbu", "kaldu", "kalender", "kaleng", "kali", "kalian", "kalimat", "kalong", "kalori", "kalung", "kamar", "kambang", "kambing", "kamboja", "kambuh", "kamera", "kamis", "kampang", "kampas", "kampret", "kampuh", "kampung", "kamus", "kanak", "kanan", "kancil", "kancing", "kandang", "kandas", "kandidat", "kandis", "kandung", "kandungan", "kane", "kangen", "kangkung", "kanguru", "kanibal", "kantong", "kantor", "kantung", "kanvas", "kaos", "kapak", "kapal", "kapan", "kapas", "kapital", "kapling", "kapok", "kaprah", "kapten", "kapuk", "kapur", "karam", "karang", "karangan", "karantina", "karap", "karat", "karatan", "karbohidrat", "karbol", "karbon", "karburator", "karcis", "kardus", "kare", "karet", "kargo", "karib", "karier", "karikatur", "karim", "karisma", "karitatif", "karnaval", "karo", "karpet", "karsa", "karton", "kartu", "karun", "karung", "karunia", "karya", "karyawan", "karyawati", "kasar", "kasasi", "kaset", "kasi", "kasih", "kasihan", "kasir", "kaskus", "kasta", "kasti", "kasur", "kasus", "kata", "katai", "katak", "katalog", "katarak", "katarsis", "kategori", "katik", "kating", "katoda", "katrol", "katun", "katup", "kau", "kaul", "kaum", "kaus", "kaveling", "kawah", "kawal", "kawalan", "kawan", "kawanan", "kawat", "kawin", "kawinan", "kaya", "kayu", "kayuh", "keadaan", "kebal", "kebaya", "kebiri", "kebun", "kebut", "kebutan", "kecambah", "kecap", "kece", "kecewa", "kecil", "kecoak", "kecoa", "kecuali", "kecubung", "kecup", "kedai", "kedap", "kedip", "kedok", "kedondong", "kedua", "kedut", "kehendak", "kejam", "kejang", "kejar", "keji", "kejora", "kejut", "kejutan", "kekah", "kekal", "kekang", "kekar", "kekasih", "kekep", "keker", "kelabang", "kelabu", "kelahi", "kelak", "kelakar", "kelam", "kelamin", "kelana", "kelapa", "kelar", "kelarai", "kelas", "kelat", "kelelawar", "kelemayar", "kelembak", "kelenjar", "kelep", "kelereng", "kelet", "keliaran", "keliat", "kelik", "keliling", "kelinci", "keliru", "kelis", "kelit", "kelok", "kelola", "kelompok", "kelongkong", "kelopak", "kelor", "kelotok", "kelu", "keluarga", "keluh", "keluhan", "kelumit", "kelupas", "kelur", "keluron", "kelus", "kelut", "kemarau", "kemarin", "kemas", "kemasan", "kemban", "kembang", "kembangbiak", "kembar", "kembara", "kembung", "kemelut", "kemenyan", "kemilau", "kemping", "kempot", "kempul", "kempis", "kemudi", "kemudian", "kemul", "kemung", "kena", "kenal", "kenalan", "kenang", "kenangan", "kenap", "kenapa", "kencan", "kencana", "kencang", "kencing", "kendala", "kendali", "kendang", "kendara", "kendaraan", "kendor", "kendur", "kenduri", "kental", "kentang", "kentara", "kentut", "kenyal", "kenyang", "kenyit", "kenyot", "kepanasan", "kepang", "keparat", "kepayang", "kepepet", "kepik", "kepil", "keping", "kepingan", "kepingin", "kepit", "kepiting", "keplok", "kepompong", "keponakan", "kepor", "kepos", "kepot", "keprak", "kepret", "kepruk", "kepuh", "kepuk", "kepul", "kepung", "kepungan", "kera", "kerabat", "kerah", "kerai", "kerak", "keramat", "keramba", "keramik", "keranjang", "keran", "kerap", "kerapu", "keras", "kerat", "keratan", "keraton", "kerbau", "kerdil", "kerdus", "kere", "kerekan", "kerekot", "kerempeng", "keren", "kereta", "keretek", "kerik", "kerikil", "kerikisan", "kering", "keringat", "keripik", "keriput", "keris", "keriting", "kerja", "kerjap", "kerlap", "kerling", "kerlip", "kermak", "kermit", "kerna", "kernet", "kernyit", "keroncong", "keropos", "keroyok", "keroyokan", "kerpus", "kersang", "kersik", "kerta", "kertas", "kertuk", "keruan", "kerubung", "kerubut", "kerucut", "keruh", "keruk", "kerukan", "kerukup", "kerumun", "kerumunan", "kerupuk", "kerut", "kerutan", "kesal", "kesan", "kesat", "kesatria", "keset", "kesi", "kesiap", "kesima", "kesturi", "kesumba", "ketan", "ketapel", "ketara", "ketat", "ketawa", "ketiak", "ketiban", "ketik", "ketikan", "ketilang", "ketimun", "keting", "ketipak", "ketok", "ketokan", "ketombe", "ketoprak", "ketua", "ketuban", "ketuk", "ketukan", "ketul", "ketumbar", "ketupat", "kewan", "kewalahan", "kewat", "khatib", "khawatir", "khayal", "khayalan", "khianat", "khitan", "khotbah", "khusus", "kiamat", "kias", "kiasan", "kibar", "kibaran", "kibas", "kiblat", "kibul", "kicau", "kicauan", "kidal", "kidung", "kijang", "kikir", "kikis", "kikisan", "kikuk", "kilap", "kilat", "kilau", "kilauan", "kilo", "kilogram", "kilometer", "kincir", "kinerja", "kini", "kinik", "kios", "kipas", "kira", "kiran", "kiranya", "kiri", "kirim", "kiriman", "kisah", "kisaran", "kismis", "kisruh", "kita", "kitab", "kitiran", "klaim", "klandestin", "klan", "klarifikasi", "klasemen", "klasik", "klasifikasi", "klausul", "klepon", "klien", "klik", "klimaks", "klimat", "klinik", "kliping", "klise", "klon", "kloning", "klorin", "klorofil", "klub", "koalisi", "koboi", "kocak", "kocok", "kocokan", "koda", "kode", "kodok", "koefisien", "koin", "kolega", "koleksi", "kolektif", "kolom", "kolonel", "koloni", "kolonial", "komandan", "komando", "kombinasi", "komedi", "komentar", "komersial", "komik", "komisaris", "komisi", "komite", "komitmen", "komoditas", "kompak", "kompaksi", "kompas", "kompatibel", "kompensasi", "kompeten", "kompetisi", "kompilasi", "komplain", "kompleks", "komplemen", "komplit", "komplikasi", "komplotan", "komponen", "kompor", "kompos", "komposisi", "kompres", "kompresor", "kompromi", "komputer", "komunikasi", "komunitas", "kondang", "kondensor", "kondisi", "kondom", "konduktor", "koneksi", "konferensi", "konflik", "konfrontasi", "kongres", "konkret", "konsep", "konser", "konservasi", "konsisten", "konsol", "konsonan", "konsorsium", "konstan", "konstanta", "konstitusi", "konsul", "konsulat", "konsultan", "konsultasi", "konsumsi", "kontak", "kontainer", "kontan", "konteks", "konten", "kontes", "kontinuitas", "kontol", "kontra", "kontrak", "kontribusi", "kontrol", "kontroversi", "konvensi", "konversi", "koordinasi", "kopi", "kopiah", "kopling", "koplok", "kopol", "koper", "koperasi", "koral", "koran", "korban", "kord", "korden", "koreksi", "korelasi", "koreografer", "koreografi", "korespodensi", "koret", "korma", "kornea", "kornet", "korona", "koroner", "korosi", "korps", "korpus", "korse", "korsel", "korset", "korsi", "korsleting", "korteks", "korting", "korup", "korupsi", "kos", "kosa", "kosakata", "kosong", "kostum", "kota", "kotak", "kotor", "kotoran", "koordinat", "kram", "kramat", "kran", "kraton", "krayon", "kreatif", "kreativitas", "kredensial", "kredit", "krem", "kremasi", "kresek", "kresen", "kriket", "kriminal", "krisis", "kristal", "kristen", "kriteria", "kritik", "kritis", "kroasia", "kroket", "kroni", "kronik", "kronis", "kronologi", "kros", "kroto", "kru", "krusial", "kualifikasi", "kualitas", "kualitatif", "kuang", "kuantitas", "kuantitatif", "kuap", "kuari", "kuartal", "kuartet", "kuas", "kuasa", "kuat", "kubik", "kubis", "kubra", "kubu", "kubur", "kuburan", "kuda", "kudeta", "kudis", "kudrat", "kudus", "kue", "kufur", "kuhp", "kuil", "kuis", "kuit", "kuitansi", "kujang", "kuku", "kukuh", "kukur", "kukus", "kukusan", "kula", "kulai", "kulak", "kulat", "kuli", "kuliah", "kulit", "kulkas", "kulminasi", "kultur", "kultural", "kumal", "kuman", "kumat", "kumbang", "kumis", "kumpul", "kumpulan", "kumuh", "kumur", "kunang", "kunci", "kuncir", "kuncup", "kundur", "kuning", "kuningan", "kunjung", "kunjungan", "kuno", "kuntilanak", "kuntum", "kunyah", "kunyit", "kuota", "kupang", "kupas", "kupasan", "kuping", "kupon", "kupu", "kura", "kurang", "kurap", "kuras", "kurator", "kurcaci", "kurikulum", "kurir", "kursi", "kursus", "kurun", "kurung", "kurungan", "kurus", "kurva", "kusam", "kusal", "kusen", "kusta", "kusti", "kusir", "kusut", "kutang", "kutangis", "kutat", "kutil", "kutip", "kutipan", "kutu", "kutub", "kutuk", "kutukan", "kuwuk", "kuyu", "kuyup",

        # Q words
        "qari", "qariah", "qasar", "qasidah", "qiamulail", "qiraah", "qunut", "quraisy", "quran",

        # X words
        "xenon", "xenofobia", "xerox", "xilofon", "xiloid", "xilem",

        # Y words
        "ya", "yahudi", "yaitu", "yakin", "yakni", "yakut", "yakuza", "yamani", "yang", "yatim", "yayasan", "yel", "yelp", "yodium", "yoga", "yogurt", "yojana", "yok", "yuris", "yurisdiksi", "yurisprudensi", "yustisi", "yute",

        # Z words
        "zaba", "zabad", "zabur", "zadah", "zahir", "zaitun", "zakar", "zakat", "zalim", "zaman", "zambia", "zamrud", "zamzam", "zarah", "zat", "zebra", "zen", "zeni", "zenit", "ziarah", "zigot", "zigzag", "zikir", "zina", "zink", "zionis", "zirkonium", "zirah", "zodiak", "zona", "zombi", "zombie", "zonasi", "zoologi"
    ]

    for w in curated_id:
        c = clean_word(w)
        if c:
            new_words.add(c)

    # 2. English words expansion especially with Scrabble/BNC vocabulary
    english_curated = [
        "able", "about", "above", "across", "action", "activity", "actor", "actress", "actual", "actually",
        "addition", "address", "admit", "adult", "advance", "advantage", "adventure", "advice", "advise", "affair",
        "affect", "afford", "afraid", "after", "afternoon", "again", "against", "agency", "agent", "agreement",
        "ahead", "airplane", "airport", "album", "alcohol", "alive", "almost", "alone", "along", "already",
        "alternative", "although", "always", "amazing", "ambition", "among", "amount", "ancient", "angel", "anger",
        "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "anxiety", "anybody",
        "anymore", "anyone", "anything", "anyway", "anywhere", "apartment", "apology", "apparent", "appeal", "appear",
        "appearance", "apple", "application", "apply", "appoint", "appreciate", "approach", "appropriate", "approval", "approve",
        "architect", "area", "argue", "argument", "arise", "arm", "army", "around", "arrange", "arrangement",
        "arrest", "arrival", "arrive", "arrow", "art", "article", "artist", "artistic", "aside", "ask",
        "asleep", "aspect", "assault", "assert", "assess", "assessment", "asset", "assign", "assignment", "assist",
        "assistance", "assistant", "associate", "association", "assume", "assumption", "assure", "athlete", "athletic", "atmosphere",
        "attach", "attack", "attempt", "attend", "attention", "attitude", "attorney", "attract", "attraction", "attractive",
        "attribute", "audience", "author", "authority", "automatic", "available", "average", "avoid", "award", "aware",
        "awareness", "away", "awful", "baby", "back", "background", "bad", "badly", "bag", "bake",
        "balance", "ball", "balloon", "banana", "band", "bank", "bar", "barely", "barrel", "barrier",
        "base", "baseball", "basic", "basically", "basis", "basket", "basketball", "battery", "battle", "beach",
        "bean", "bear", "beard", "beat", "beautiful", "beauty", "because", "become", "bedroom", "beer",
        "before", "begin", "beginning", "behavior", "behind", "being", "belief", "believe", "bell", "belong",
        "below", "belt", "bench", "bend", "beneath", "benefit", "beside", "besides", "best", "better",
        "between", "beyond", "bicycle", "big", "bike", "bill", "billion", "bind", "biological", "bird",
        "birth", "birthday", "biscuit", "bishop", "bit", "bite", "bitter", "black", "blade", "blame",
        "blank", "blanket", "blast", "blend", "bless", "blind", "block", "blood", "bloody", "blow",
        "blue", "board", "boat", "body", "boil", "bold", "bomb", "bombing", "bond", "bone",
        "bonus", "book", "boom", "boot", "border", "bored", "boring", "born", "borrow", "boss",
        "both", "bother", "bottle", "bottom", "bounce", "boundary", "bowl", "box", "boy", "boyfriend",
        "brain", "branch", "brand", "brave", "bread", "break", "breakfast", "breast", "breath", "breathe",
        "brick", "bridge", "brief", "briefly", "bright", "brilliant", "bring", "broad", "broadcast", "brother",
        "brown", "brush", "bubble", "budget", "build", "builder", "building", "bullet", "bunch", "burden",
        "burn", "burst", "bury", "bus", "bush", "business", "busy", "but", "butter", "button",
        "buy", "buyer", "cabin", "cabinet", "cable", "cake", "calculate", "calendar", "call", "calm",
        "camera", "camp", "campaign", "campus", "canal", "cancel", "cancer", "candidate", "candle", "candy",
        "canvas", "capable", "capacity", "capital", "captain", "capture", "car", "carbon", "card", "care",
        "career", "careful", "carefully", "cargo", "carpet", "carrier", "carrot", "carry", "cart", "case",
        "cash", "cast", "castle", "casual", "cat", "catalog", "catch", "category", "cattle", "cause",
        "cave", "cease", "ceiling", "celebrate", "celebration", "celebrity", "cell", "cemetery", "center", "central",
        "century", "ceremony", "certain", "certainly", "chain", "chair", "chairman", "challenge", "chamber", "champion",
        "championship", "chance", "change", "channel", "chapter", "character", "characteristic", "charge", "charity", "charm",
        "chart", "chase", "cheap", "check", "cheek", "cheese", "chef", "chemical", "chemistry", "chest",
        "chicken", "chief", "child", "childhood", "chill", "chin", "chip", "chocolate", "choice", "cholesterol",
        "choose", "church", "circle", "circuit", "circumstance", "citizen", "citizenship", "city", "civil", "civilian",
        "claim", "classic", "classroom", "clean", "clear", "clearly", "clerk", "clever", "click", "client",
        "climate", "climb", "clinic", "clinical", "clock", "close", "closely", "closer", "closest", "closet",
        "cloth", "clothes", "clothing", "cloud", "club", "clue", "cluster", "coach", "coal", "coalition",
        "coast", "coastal", "coat", "code", "coffee", "cognitive", "coin", "cold", "collapse", "colleague",
        "collect", "collection", "collective", "college", "colonial", "color", "column", "combination", "combine", "come",
        "comedy", "comfort", "comfortable", "command", "commander", "comment", "commercial", "commission", "commit", "commitment",
        "committee", "common", "communicate", "communication", "community", "company", "compare", "comparison", "compete", "competition",
        "competitive", "competitor", "complain", "complaint", "complete", "completely", "complex", "complicated", "component", "compose",
        "composition", "comprehensive", "computer", "concentrate", "concentration", "concept", "concern", "concerned", "concert", "conclude",
        "conclusion", "concrete", "condition", "conduct", "conference", "confidence", "confident", "confirm", "conflict", "confront",
        "confusion", "congress", "connect", "connection", "conscious", "consequence", "conservative", "consider", "considerable", "consideration",
        "consist", "consistent", "constant", "constantly", "constitute", "constitutional", "construct", "construction", "consultant", "consume",
        "consumer", "consumption", "contact", "contain", "container", "contemporary", "content", "contest", "context", "continue",
        "continued", "contract", "contrast", "contribute", "contribution", "control", "controversial", "controversy", "convenience", "convention",
        "conventional", "conversation", "convert", "conviction", "convince", "cook", "cookie", "cooking", "cool", "cooperation",
        "cop", "cope", "copy", "core", "corn", "corner", "corporate", "corporation", "correct", "correctly",
        "correspondent", "corridor", "cost", "couch", "could", "council", "counsel", "counselor", "count", "counter",
        "country", "county", "couple", "courage", "course", "court", "cousin", "cover", "coverage", "cow",
        "crack", "craft", "crash", "crazy", "cream", "create", "creation", "creative", "creativity", "creature",
        "credit", "crew", "crime", "criminal", "crisis", "criteria", "critic", "critical", "criticism", "criticize",
        "crop", "cross", "crowd", "crowded", "crucial", "cruel", "cruise", "crush", "cry", "crystal",
        "cultural", "culture", "cup", "cure", "curious", "current", "currently", "curriculum", "curtain", "curve",
        "custody", "custom", "customer", "cut", "cycle", "daily", "damage", "dance", "dancer", "dancing",
        "danger", "dangerous", "dare", "dark", "darkness", "data", "database", "date", "daughter", "dawn",
        "day", "dead", "deal", "dealer", "dear", "death", "debate", "debt", "decade", "decay",
        "decide", "decision", "deck", "declare", "decline", "decrease", "deep", "deeply", "deer", "defeat",
        "defend", "defendant", "defense", "defensive", "deficit", "define", "definitely", "definition", "degree", "delay",
        "deliver", "delivery", "demand", "democracy", "democrat", "democratic", "demonstrate", "demonstration", "denial", "dense",
        "density", "deny", "depart", "department", "departure", "depend", "dependent", "depending", "depict", "deploy",
        "deposit", "depressed", "depression", "depth", "deputy", "derive", "describe", "description", "desert", "deserve",
        "design", "designer", "desire", "desk", "desperate", "despite", "destroy", "destruction", "detail", "detailed",
        "detect", "determine", "develop", "developer", "development", "device", "devote", "dialogue", "diamond", "diary",
        "diet", "differ", "difference", "different", "differently", "difficult", "difficulty", "dig", "digital", "dimension",
        "dining", "dinner", "direct", "direction", "directly", "director", "dirt", "dirty", "disability", "disagree",
        "disappear", "disaster", "discipline", "discourse", "discover", "discovery", "discuss", "discussion", "disease", "dish",
        "dismiss", "disorder", "display", "dispute", "distance", "distant", "distinct", "distinction", "distinguish", "distribute",
        "distribution", "district", "diverse", "diversity", "divide", "division", "divorce", "doctor", "document", "dog",
        "doll", "dollar", "domain", "domestic", "dominant", "dominate", "door", "double", "doubt", "down",
        "downtown", "dozen", "draft", "drag", "drama", "dramatic", "dramatically", "draw", "drawer", "drawing",
        "dream", "dress", "drink", "drive", "driver", "drop", "drug", "dry", "due", "during",
        "dust", "duty", "eager", "early", "earn", "earnings", "earth", "ease", "easily", "east",
        "eastern", "easy", "eat", "economic", "economics", "economist", "economy", "edge", "edition", "editor",
        "educate", "education", "educational", "educator", "effect", "effective", "effectively", "efficiency", "efficient", "effort",
        "egg", "eight", "either", "elderly", "elect", "election", "electric", "electricity", "electronic", "element",
        "elementary", "eliminate", "elite", "else", "elsewhere", "email", "embrace", "emerge", "emergency", "emission",
        "emotion", "emotional", "emphasis", "emphasize", "employ", "employee", "employer", "employment", "empty", "enable",
        "encounter", "encourage", "end", "enemy", "energy", "enforcement", "engage", "engine", "engineer", "engineering",
        "english", "enhance", "enjoy", "enormous", "enough", "ensure", "enter", "enterprise", "entertainment", "entire",
        "entirely", "entrance", "entry", "environment", "environmental", "episode", "equal", "equally", "equipment", "era",
        "error", "escape", "especially", "essay", "essential", "essentially", "establish", "establishment", "estate", "estimate",
        "ethics", "ethnic", "evaluate", "evaluation", "even", "evening", "event", "eventually", "ever", "every",
        "everybody", "everyday", "everyone", "everything", "everywhere", "evidence", "evolution", "evolve", "exact", "exactly",
        "examination", "examine", "example", "exceed", "excellent", "except", "exception", "exchange", "exciting", "exclude",
        "exclusive", "excuse", "execute", "executive", "exercise", "exhibit", "exhibition", "exist", "existence", "existing",
        "expand", "expansion", "expect", "expectation", "expense", "expensive", "experience", "experiment", "experimental", "expert",
        "explain", "explanation", "explode", "explore", "explosion", "expose", "exposure", "express", "expression", "extend",
        "extension", "extensive", "extent", "external", "extra", "extraordinary", "extreme", "extremely", "eye", "fabric",
        "face", "facility", "fact", "factor", "factory", "faculty", "fade", "fail", "failure", "fair",
        "fairly", "faith", "fall", "false", "familiar", "family", "famous", "fan", "fantasy", "far",
        "farm", "farmer", "fashion", "fast", "fat", "fate", "father", "fault", "favor", "favorite",
        "fear", "feature", "federal", "fee", "feed", "feel", "feeling", "fellow", "female", "fence",
        "festival", "few", "fiber", "fiction", "field", "fifteen", "fifth", "fifty", "fight", "fighter",
        "fighting", "figure", "file", "fill", "film", "final", "finally", "finance", "financial", "find",
        "finding", "fine", "finger", "finish", "fire", "firm", "first", "fish", "fishing", "fitness",
        "five", "fix", "flag", "flame", "flat", "flavor", "flee", "flesh", "flight", "float",
        "flood", "floor", "flow", "flower", "fly", "focus", "folk", "follow", "following", "food",
        "foot", "football", "force", "foreign", "forest", "forever", "forget", "form", "formal", "formation",
        "former", "formula", "forth", "fortune", "forward", "found", "foundation", "founder", "four", "fourth",
        "frame", "framework", "free", "freedom", "freeze", "french", "frequency", "frequent", "frequently", "fresh",
        "friend", "friendly", "friendship", "from", "front", "fruit", "frustration", "fuel", "full", "fully",
        "fun", "function", "fund", "fundamental", "funding", "funeral", "funny", "furniture", "furthermore", "future",
        "gain", "galaxy", "gallery", "game", "gang", "gap", "garage", "garden", "garlic", "gas",
        "gate", "gather", "gaze", "gear", "gender", "gene", "general", "generally", "generate", "generation",
        "genetic", "gentleman", "gently", "german", "gesture", "get", "ghost", "giant", "gift", "gifted",
        "girl", "girlfriend", "give", "given", "glad", "glance", "glass", "global", "glove", "goal",
        "god", "gold", "golden", "golf", "good", "government", "governor", "grab", "grade", "gradually",
        "graduate", "grain", "grand", "grandfather", "grandmother", "grant", "grass", "grave", "gray", "great",
        "greatest", "green", "grocery", "ground", "group", "grow", "growing", "growth", "guarantee", "guard",
        "guess", "guest", "guide", "guideline", "guilty", "gun", "guy", "habit", "habitat", "hair",
        "half", "hall", "hand", "handful", "handle", "hang", "happen", "happy", "hard", "hardly",
        "hat", "hate", "have", "head", "headline", "headquarters", "health", "healthy", "hear", "hearing",
        "heart", "heat", "heaven", "heavily", "heavy", "heel", "height", "helicopter", "hell", "hello",
        "help", "helpful", "her", "here", "heritage", "hero", "herself", "hide", "high", "highlight",
        "highly", "highway", "hill", "him", "himself", "hip", "hire", "historian", "historic", "historical",
        "history", "hit", "hold", "hole", "holiday", "holy", "home", "homeless", "honest", "honey",
        "honor", "hope", "horizon", "horror", "horse", "hospital", "host", "hot", "hotel", "hour",
        "house", "household", "housing", "how", "however", "huge", "human", "humor", "hundred", "hungry",
        "hunter", "hunting", "hurt", "husband", "hypothesis", "ice", "idea", "ideal", "identification", "identify",
        "identity", "ignore", "ill", "illegal", "illness", "illustrate", "image", "imagination", "imagine", "immediate",
        "immediately", "immigrant", "immigration", "impact", "implement", "implication", "imply", "importance", "important", "impose",
        "impossible", "impress", "impression", "impressive", "improve", "improvement", "incentive", "incident", "include", "including",
        "income", "incorporate", "increase", "increased", "increasing", "increasingly", "incredible", "indeed", "independence", "independent",
        "index", "indicate", "indication", "individual", "industrial", "industry", "infant", "infection", "inflation", "influence",
        "inform", "information", "ingredient", "initial", "initially", "initiative", "injury", "inner", "innocent", "inquiry",
        "inside", "insight", "insist", "inspire", "install", "instance", "instead", "institution", "institutional", "instruction",
        "instructor", "instrument", "insurance", "intellectual", "intelligence", "intend", "intense", "intensity", "intention", "interaction",
        "interest", "interested", "interesting", "internal", "international", "internet", "interpret", "interpretation", "intervention", "interview",
        "into", "introduce", "introduction", "invasion", "invest", "investigate", "investigation", "investigator", "investment", "investor",
        "invite", "involve", "involved", "involvement", "iraqi", "irish", "iron", "islamic", "island", "israeli",
        "issue", "item", "itself", "jacket", "jail", "japanese", "jazz", "jeans", "jet", "jew",
        "jewish", "job", "join", "joint", "joke", "journal", "journalist", "journey", "joy", "judge",
        "judgment", "juice", "jump", "junior", "jury", "just", "justice", "justify", "keep", "key",
        "kick", "kid", "kill", "killer", "killing", "kind", "king", "kiss", "kitchen", "knee",
        "knife", "knock", "know", "knowledge", "lab", "label", "labor", "laboratory", "lack", "lady",
        "lake", "land", "landscape", "language", "lap", "large", "largely", "laser", "last", "late",
        "lately", "later", "latter", "laugh", "laughter", "launch", "law", "lawn", "lawsuit", "lawyer",
        "lay", "layer", "lead", "leader", "leadership", "leading", "leaf", "league", "lean", "learn",
        "learning", "least", "leather", "leave", "left", "leg", "legacy", "legal", "legend", "legislation",
        "legitimate", "lemon", "length", "less", "lesson", "let", "letter", "level", "liberal", "library",
        "license", "lie", "life", "lifestyle", "lifetime", "lift", "light", "like", "likely", "limit",
        "limitation", "limited", "line", "link", "lip", "liquid", "list", "listen", "literally", "literary",
        "literature", "little", "live", "living", "load", "loan", "local", "locate", "location", "lock",
        "long", "look", "loose", "lose", "loss", "lost", "lot", "lots", "loud", "love",
        "lovely", "lover", "low", "lower", "luck", "lucky", "lunch", "lung", "machine", "mad",
        "magazine", "mail", "main", "mainly", "maintain", "maintenance", "major", "majority", "make", "maker",
        "makeup", "male", "mall", "man", "manage", "management", "manager", "manner", "manufacturer", "manufacturing",
        "many", "map", "margin", "mark", "market", "marketing", "marriage", "married", "marry", "mask",
        "mass", "massive", "master", "match", "material", "math", "matter", "maximum", "may", "maybe",
        "mayor", "meal", "mean", "meaning", "meanwhile", "measure", "measurement", "meat", "mechanism", "media",
        "medical", "medication", "medicine", "medium", "meet", "meeting", "member", "membership", "memory", "mental",
        "mention", "menu", "mere", "merely", "mess", "message", "metal", "meter", "method", "mexican",
        "middle", "might", "military", "milk", "million", "mind", "mine", "minister", "minor", "minority",
        "minute", "miracle", "mirror", "miss", "missile", "mission", "mistake", "mix", "mixture", "mobile",
        "mode", "model", "moderate", "modern", "modest", "mom", "moment", "money", "monitor", "month",
        "mood", "moon", "moral", "more", "moreover", "morning", "mortgage", "most", "mostly", "mother",
        "motion", "motivation", "motor", "mount", "mountain", "mouse", "mouth", "move", "movement", "movie",
        "much", "multiple", "murder", "muscle", "museum", "music", "musical", "musician", "must", "mutual",
        "myself", "mystery", "myth", "naked", "name", "narrative", "narrow", "nation", "national", "native",
        "natural", "naturally", "nature", "near", "nearby", "nearly", "necessarily", "necessary", "neck", "need",
        "negative", "negotiate", "negotiation", "neighbor", "neighborhood", "neither", "nerve", "nervous", "net", "network",
        "never", "nevertheless", "new", "newly", "news", "newspaper", "next", "nice", "night", "nine",
        "nobody", "nod", "noise", "nomination", "none", "nonetheless", "nor", "normal", "normally", "north",
        "northern", "nose", "not", "note", "nothing", "notice", "notion", "novel", "now", "nowhere",
        "nuclear", "number", "numerous", "nurse", "nut", "object", "objective", "obligation", "observation", "observe",
        "observer", "obtain", "obvious", "obviously", "occasion", "occasionally", "occupation", "occupy", "occur", "ocean",
        "odd", "odds", "off", "offense", "offensive", "offer", "office", "officer", "official", "often",
        "oil", "okay", "old", "olympic", "once", "one", "ongoing", "onion", "online", "only",
        "onto", "open", "opening", "operate", "operating", "operation", "operator", "opinion", "opponent", "opportunity",
        "oppose", "opposite", "opposition", "option", "orange", "order", "ordinary", "organic", "organization", "organize",
        "orientation", "origin", "original", "originally", "other", "others", "otherwise", "ought", "our", "ourselves",
        "out", "outcome", "outside", "oven", "over", "overall", "overcome", "overlook", "owe", "own",
        "owner", "pace", "pack", "package", "page", "pain", "painful", "paint", "painter", "painting",
        "pair", "pale", "palestinian", "palm", "pan", "panel", "pant", "paper", "parent", "park",
        "parking", "part", "participant", "participate", "participation", "particular", "particularly", "partly", "partner", "partnership",
        "party", "pass", "passage", "passenger", "passion", "past", "patch", "path", "patient", "pattern",
        "pause", "pay", "payment", "peace", "peak", "peer", "penalty", "people", "pepper", "per",
        "perceive", "percentage", "perception", "perfect", "perfectly", "perform", "performance", "performer", "perhaps", "period",
        "permanent", "permission", "permit", "person", "personal", "personality", "personally", "personnel", "perspective", "persuade",
        "pet", "phase", "phenomenon", "philosophy", "phone", "photo", "photograph", "photographer", "phrase", "physical",
        "physically", "physician", "piano", "pick", "picture", "pie", "piece", "pile", "pilot", "pine",
        "pink", "pipe", "pitch", "place", "plan", "plane", "planet", "planner", "planning", "plant",
        "plastic", "plate", "platform", "play", "player", "pleasant", "please", "pleasure", "plenty", "plot",
        "plus", "pocket", "poem", "poet", "poetry", "point", "pole", "police", "policy", "political",
        "politically", "politician", "politics", "poll", "pollution", "pool", "poor", "pop", "popular", "population",
        "porch", "port", "portion", "portrait", "portray", "pose", "position", "positive", "possess", "possibility",
        "possible", "possibly", "post", "pot", "potato", "potential", "potentially", "pound", "pour", "poverty",
        "powder", "power", "powerful", "practical", "practice", "pray", "prayer", "precisely", "predict", "prefer",
        "preference", "pregnancy", "pregnant", "preparation", "prepare", "prescription", "presence", "present", "presentation", "preserve",
        "president", "presidential", "press", "pressure", "pretend", "pretty", "prevent", "previous", "previously", "price",
        "pride", "priest", "primarily", "primary", "prime", "principal", "principle", "print", "prior", "priority",
        "prison", "prisoner", "privacy", "private", "probably", "problem", "procedure", "proceed", "process", "produce",
        "producer", "product", "production", "profession", "professional", "professor", "profile", "profit", "program", "progress",
        "project", "prominent", "promise", "promote", "prompt", "proof", "proper", "properly", "property", "proportion",
        "proposal", "propose", "proposed", "prosecutor", "prospect", "protect", "protection", "protein", "protest", "proud",
        "prove", "provide", "provider", "province", "provision", "psychological", "psychologist", "psychology", "public", "publication",
        "publicly", "publish", "publisher", "pull", "punishment", "purchase", "pure", "purpose", "pursue", "push",
        "put", "qualify", "quality", "quarter", "quarterback", "question", "quick", "quickly", "quiet", "quietly",
        "quit", "quite", "quote", "race", "racial", "radical", "radio", "rail", "rain", "raise",
        "range", "rank", "rapid", "rapidly", "rare", "rarely", "rate", "rather", "rating", "ratio",
        "raw", "reach", "react", "reaction", "read", "reader", "reading", "ready", "real", "reality",
        "realize", "really", "reason", "reasonable", "recall", "receive", "recent", "recently", "recipe", "recognition",
        "recognize", "recommend", "recommendation", "record", "recording", "recover", "recovery", "recruit", "red", "reduce",
        "reduction", "refer", "reference", "reflect", "reflection", "reform", "refugee", "refuse", "regard", "regarding",
        "regardless", "regime", "region", "regional", "register", "regular", "regularly", "regulate", "regulation", "reinforce",
        "reject", "relate", "relation", "relationship", "relative", "relatively", "relax", "release", "relevant", "relief",
        "religion", "religious", "rely", "remain", "remaining", "remarkable", "remember", "remind", "remote", "remove",
        "repeat", "repeatedly", "replace", "reply", "report", "reporter", "represent", "representation", "representative", "reputation",
        "request", "require", "requirement", "research", "researcher", "resemble", "reservation", "resident", "resist", "resistance",
        "resolution", "resolve", "resort", "resource", "respect", "respond", "respondent", "response", "responsibility", "responsible",
        "rest", "restaurant", "restore", "restriction", "result", "retain", "retire", "retirement", "return", "reveal",
        "revenue", "review", "revolution", "rhythm", "rice", "rich", "rid", "ride", "rifle", "right",
        "ring", "rise", "risk", "river", "road", "rock", "role", "roll", "romantic", "roof",
        "room", "root", "rope", "rose", "rough", "roughly", "round", "route", "routine", "row",
        "rub", "rule", "run", "running", "rural", "rush", "russian", "sacred", "sad", "safe",
        "safety", "sake", "salad", "salary", "sale", "sales", "salt", "same", "sample", "sanction",
        "sand", "satellite", "satisfaction", "satisfy", "sauce", "save", "saving", "say", "scale", "scandal",
        "scared", "scenario", "scene", "schedule", "scheme", "scholar", "scholarship", "school", "science", "scientific",
        "scientist", "scope", "score", "scream", "screen", "script", "sea", "search", "season", "seat",
        "second", "secret", "secretary", "section", "sector", "secure", "security", "see", "seed", "seek",
        "seem", "segment", "seize", "select", "selection", "self", "sell", "senate", "senator", "send",
        "senior", "sense", "sensitive", "sentence", "separate", "sequence", "series", "serious", "seriously", "serve",
        "service", "session", "set", "setting", "settle", "settlement", "seven", "several", "severe", "sex",
        "sexual", "shade", "shadow", "shake", "shall", "shape", "share", "sharp", "she", "sheet",
        "shelf", "shell", "shelter", "shift", "shine", "ship", "shirt", "shock", "shoe", "shoot",
        "shooting", "shop", "shopping", "shore", "short", "shortly", "shot", "should", "shoulder", "shout",
        "show", "shower", "shrug", "shut", "sick", "side", "sigh", "sight", "sign", "signal",
        "significance", "significant", "significantly", "silence", "silent", "silver", "similar", "similarly", "simple", "simply",
        "sin", "since", "sing", "singer", "single", "sink", "sir", "sister", "sit", "site",
        "situation", "six", "size", "ski", "skill", "skin", "sky", "slave", "sleep", "slice",
        "slide", "slight", "slightly", "slip", "slow", "slowly", "small", "smart", "smell", "smile",
        "smoke", "smooth", "snap", "snow", "so", "so-called", "soccer", "social", "society", "soft",
        "software", "soil", "solar", "soldier", "solid", "solution", "solve", "some", "somebody", "somehow",
        "someone", "something", "sometimes", "somewhat", "somewhere", "son", "song", "soon", "sophisticated", "sorry",
        "sort", "soul", "sound", "soup", "source", "south", "southern", "soviet", "space", "spanish",
        "speak", "speaker", "special", "specialist", "species", "specific", "specifically", "speech", "speed", "spend",
        "spending", "spin", "spirit", "spiritual", "split", "spokesman", "sport", "spot", "spread", "spring",
        "square", "squeeze", "stability", "stable", "staff", "stage", "stair", "stake", "stand", "standard",
        "standing", "star", "stare", "start", "state", "statement", "station", "statistics", "status", "stay",
        "steady", "steal", "steel", "step", "stick", "still", "stir", "stock", "stomach", "stone",
        "stop", "storage", "store", "storm", "story", "straight", "strange", "stranger", "strategic", "strategy",
        "stream", "street", "strength", "strengthen", "stress", "stretch", "strike", "string", "strip", "stroke",
        "strong", "strongly", "structure", "struggle", "student", "studio", "study", "stuff", "stupid", "style",
        "subject", "submit", "subsequent", "substance", "substantial", "succeed", "success", "successful", "successfully", "such",
        "sudden", "suddenly", "sue", "suffer", "sufficient", "sugar", "suggest", "suggestion", "suit", "summer",
        "summit", "sun", "super", "supply", "support", "supporter", "suppose", "supposed", "supreme", "sure",
        "surely", "surface", "surgery", "surprise", "surprised", "surprising", "surprisingly", "surround", "survey", "survival",
        "survive", "survivor", "suspect", "sustain", "swear", "sweep", "sweet", "swim", "swimming", "swing",
        "switch", "symbol", "symptom", "system", "table", "tablespoon", "tactic", "tail", "take", "tale",
        "talent", "talk", "tall", "tank", "tap", "tape", "target", "task", "taste", "tax",
        "taxpayer", "tea", "teach", "teacher", "teaching", "team", "tear", "teaspoon", "technical", "technique",
        "technology", "teen", "teenager", "telephone", "telescope", "television", "tell", "temperature", "temporary", "ten",
        "tend", "tendency", "tennis", "tension", "tent", "term", "terms", "terrible", "territory", "terror",
        "terrorism", "terrorist", "test", "testify", "testimony", "testing", "text", "than", "thank", "thanks",
        "that", "the", "theater", "their", "them", "theme", "themselves", "then", "theory", "therapy",
        "there", "therefore", "these", "they", "thick", "thin", "thing", "think", "thinking", "third",
        "thirty", "this", "those", "though", "thought", "thousand", "threat", "threaten", "three", "throat",
        "through", "throughout", "throw", "thus", "ticket", "tie", "tight", "time", "tiny", "tip",
        "tire", "tired", "tissue", "title", "to", "tobacco", "today", "toe", "together", "tomato",
        "tomorrow", "tone", "tongue", "tonight", "too", "tool", "tooth", "top", "topic", "toss",
        "total", "totally", "touch", "tough", "tour", "tourist", "tournament", "toward", "towards", "tower",
        "town", "toy", "trace", "track", "trade", "tradition", "traditional", "traffic", "tragedy", "trail",
        "train", "trainer", "training", "transfer", "transform", "transformation", "transition", "translate", "transportation", "travel",
        "treat", "treatment", "treaty", "tree", "tremendous", "trend", "trial", "tribe", "trick", "trip",
        "troop", "trouble", "truck", "true", "truly", "trust", "truth", "try", "tube", "tunnel",
        "turn", "twelve", "twenty", "twice", "twin", "two", "type", "typical", "typically", "ugly",
        "ultimate", "ultimately", "unable", "uncle", "under", "undergo", "understand", "understanding", "unfortunately", "uniform",
        "union", "unique", "unit", "united", "universal", "universe", "university", "unknown", "unless", "unlike",
        "unlikely", "until", "unusual", "up", "upon", "upper", "urban", "urge", "us", "use",
        "used", "useful", "user", "usual", "usually", "utility", "vacation", "valley", "valuable", "value",
        "variable", "variation", "variety", "various", "vary", "vast", "vegetable", "vehicle", "venture", "version",
        "versus", "very", "vessel", "veteran", "via", "victim", "victory", "video", "view", "viewer",
        "village", "violate", "violation", "violence", "violent", "virtually", "virtue", "virus", "visible", "vision",
        "visit", "visitor", "visual", "vital", "voice", "volume", "volunteer", "vote", "voter", "vs",
        "vulnerable", "wage", "wait", "wake", "walk", "wall", "wander", "want", "war", "warm",
        "warn", "warning", "wash", "waste", "watch", "water", "wave", "way", "we", "weak",
        "wealth", "wealthy", "weapon", "wear", "weather", "wedding", "week", "weekend", "weekly", "weigh",
        "weight", "welcome", "welfare", "well", "west", "western", "wet", "what", "whatever", "wheel",
        "when", "whenever", "where", "whereas", "whether", "which", "while", "whisper", "white", "who",
        "whole", "whom", "whose", "why", "wide", "widely", "widespread", "wife", "wild", "will",
        "willing", "win", "wind", "window", "wine", "wing", "winner", "winter", "wipe", "wire",
        "wisdom", "wise", "wish", "with", "withdraw", "within", "without", "witness", "woman", "wonder",
        "wonderful", "wood", "wooden", "word", "work", "worker", "working", "works", "workshop", "world",
        "worried", "worry", "worth", "would", "wound", "wrap", "write", "writer", "writing", "wrong",
        "yard", "yeah", "year", "yell", "yellow", "yes", "yesterday", "yet", "yield", "you",
        "young", "your", "yours", "yourself", "youth", "zone"
    ]

    for w in english_curated:
        c = clean_word(w)
        if c:
            new_words.add(c)

    added_count = 0
    for w in new_words:
        if w not in existing_words:
            existing_words.add(w)
            added_count += 1

    sorted_words = sorted(list(existing_words))

    print(f"Added {added_count:,} new unique words!")
    print(f"Total vocabulary now: {len(sorted_words):,}")

    output_data = {
        "metadata": {
            "totalWords": len(sorted_words),
            "languages": ["id", "en"],
            "version": "2.1.0"
        },
        "words": sorted_words
    }

    with open(words_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False)

    print("Successfully saved data/words.json!")

if __name__ == '__main__':
    main()
