import {
  users, type User, type InsertUser,
  authors, type Author, type InsertAuthor,
  books, type Book, type InsertBook,
  tests, type Test, type InsertTest,
  userProgress, type UserProgress, type InsertUserProgress,
  testResults, type TestResult, type InsertTestResult,
  type BookWithAuthor, type TestWithBook
} from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';
import session from "express-session";
import createMemoryStore from "memorystore";

// Поправляємо імпорт для SessionStore
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Literature operations
  getAuthors(): Promise<Author[]>;
  getAuthor(id: number): Promise<Author | undefined>;
  createAuthor(author: InsertAuthor): Promise<Author>;
  
  getBooks(): Promise<BookWithAuthor[]>;
  getBooksByCategory(category: string): Promise<BookWithAuthor[]>;
  getBook(id: number): Promise<BookWithAuthor | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  
  // Test operations
  getTests(): Promise<TestWithBook[]>;
  getTestsByType(type: string): Promise<TestWithBook[]>;
  getTestsByBookId(bookId: number): Promise<TestWithBook[]>;
  getTest(id: number): Promise<TestWithBook | undefined>;
  createTest(test: InsertTest): Promise<Test>;
  
  // User progress operations
  getUserProgress(userId: number): Promise<UserProgress[]>;
  getUserBookProgress(userId: number, bookId: number): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: number, progress: Partial<UserProgress>): Promise<UserProgress>;
  
  // Test results operations
  getUserTestResults(userId: number): Promise<TestResult[]>;
  getTestResult(userId: number, testId: number): Promise<TestResult | undefined>;
  createTestResult(result: InsertTestResult): Promise<TestResult>;
  updateTestResult(id: number, result: Partial<TestResult>): Promise<TestResult>;
}

export class MemStorage implements IStorage {
  public sessionStore: any;
  private users: Map<number, User>;
  private authors: Map<number, Author>;
  private books: Map<number, Book>;
  private tests: Map<number, Test>;
  private userProgresses: Map<number, UserProgress>;
  private testResults: Map<number, TestResult>;
  
  private currentUserId: number;
  private currentAuthorId: number;
  private currentBookId: number;
  private currentTestId: number;
  private currentUserProgressId: number;
  private currentTestResultId: number;

  constructor() {
    // Ініціалізація сховища сесій
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 години
    });
    this.users = new Map();
    this.authors = new Map();
    this.books = new Map();
    this.tests = new Map();
    this.userProgresses = new Map();
    this.testResults = new Map();
    
    this.currentUserId = 1;
    this.currentAuthorId = 1;
    this.currentBookId = 1;
    this.currentTestId = 1;
    this.currentUserProgressId = 1;
    this.currentTestResultId = 1;
    
    // Initialize with default data
    this.initializeData();
  }

  private readFullText(filename: string): string {
    try {
      const filepath = path.join('.', 'full_texts', filename);
      return fs.readFileSync(filepath, 'utf8');
    } catch (error) {
      console.error(`Помилка читання файлу ${filename}:`, error);
      return "Текст недоступний";
    }
  }

  private initializeData() {
    // Add authors
    const authors = [
      { name: "Іван Нечуй-Левицький" },
      { name: "Михайло Коцюбинський" },
      { name: "Леся Українка" },
      { name: "Тарас Шевченко" },
      { name: "Іван Франко" },
      { name: "Сергій Жадан" },
      { name: "Марія Матіос" },
      { name: "Софія Андрухович" }
    ];
    
    authors.forEach(author => this.createAuthor(author));
    
    // Add books
    const books = [
      { 
        title: "Кайдашева сім'я", 
        authorId: 1, 
        category: "zno", 
        description: "Повість про життя українського села 19 століття", 
        coverType: "house", 
        coverColor: "amber-800",
        year: 1878,
        genre: "Соціально-побутова повість",
        summary: "«Кайдашева сім'я» — соціально-побутова повість українського письменника Івана Нечуя-Левицького, написана у 1878 році. Твір є реалістичним змалюванням українського села та побуту селян у другій половині ХІХ століття.",
        characters: "Омелько Кайдаш, Маруся Кайдашиха, Карпо, Лаврін, Мотря, Мелашка",
        themes: "Родинні цінності, протиставлення поколінь, жадібність, соціальна нерівність",
        fullText: this.readFullText('nechuj_kajdasheva.txt'),
        quotes: ["Отак, сину, як будеш шануватись, то й другі тебе шануватимуть!", "В хаті Кайдаша того року не було ладу.", "В Карпа була така сама вдача, як і в батька. Тиха вода, казали люди, греблю рве."]
      },
      { 
        title: "Тіні забутих предків", 
        authorId: 2, 
        category: "zno", 
        description: "Повість про кохання на тлі гуцульських традицій", 
        coverType: "mountain", 
        coverColor: "green-900",
        year: 1911,
        genre: "Психологічна новела",
        summary: "«Тіні забутих предків» — повість українського письменника Михайла Коцюбинського, написана у 1911 році. Твір розповідає про кохання гуцульських Ромео і Джульєтти на тлі карпатських легенд та міфів.",
        characters: "Іван Палійчук, Марічка Гутенюк, Палагна, Юра (мольфар)",
        themes: "Кохання і смерть, єдність людини з природою, гуцульська міфологія, протистояння родів",
        fullText: this.readFullText('kocinbinskij_tini.txt'),
        quotes: ["Весь світ був як казка, повна чудес, таємнична, цікава й страшна.", "Як безвісті пропасти, затоптані ногами чужих людей.", "Запанувала знову мертва тиша, і вороги спокійно спали під одним дахом, слухаючи вітер, що мав танок з хатою"]
      },
      { 
        title: "Лісова пісня", 
        authorId: 3, 
        category: "zno", 
        description: "Драма-феєрія про кохання і людську природу", 
        coverType: "icon", 
        coverColor: "blue", 
        coverIcon: "forest",
        year: 1911,
        genre: "Драма-феєрія",
        summary: "«Лісова пісня» — драма-феєрія української письменниці Лесі Українки, написана у 1911 році. Твір розповідає про кохання лісової мавки до сільського парубка Лукаша на тлі протиставлення світу природи і людей.",
        characters: "Мавка, Лукаш, Килина, Дядько Лев, Лісовик, Перелесник, Той, що в скалі сидить",
        themes: "Протиставлення духовного і матеріального, природи і цивілізації, краса і гармонія, зрада і вірність",
        fullText: this.readFullText('lesja_lisova_pisnja.txt'),
        quotes: ["Той, хто дихає, той мусить пити, й їсти, і кохати.", "Я маю в серці те, що не вмирає.", "О, не журися за тіло! Ясним вогнем засвітилось воно, чистим, палючим, як добре вино, вільними іскрами вгору злетіло."]
      },
      { 
        title: "Кобзар", 
        authorId: 4, 
        category: "zno", 
        description: "Збірка поетичних творів", 
        coverType: "icon", 
        coverColor: "yellow", 
        coverIcon: "menu_book",
        year: 1840,
        genre: "Поезія, балади, поеми",
        summary: "«Кобзар» — збірка поетичних творів Тараса Шевченка, вперше видана у 1840 році. Це одна з найвідоміших книг в українській літературі, своєрідний символ української культури.",
        characters: "Катерина, Гайдамаки, Перебендя",
        themes: "Історія України, кріпацтво, соціальна несправедливість, боротьба за свободу, любов до Батьківщини",
        fullText: this.readFullText('shevchenko_kobzar.txt'),
        quotes: ["Борітеся — поборете, Вам Бог помагає!", "Свою Україну любіть, Любіть її... Во время люте, В останню тяжкую минуту За неї Господа моліть.", "І чужому научайтесь, Й свого не цурайтесь."]
      },
      { 
        title: "Захар Беркут", 
        authorId: 5, 
        category: "zno", 
        description: "Історична повість з часів Данила Галицького", 
        coverType: "icon", 
        coverColor: "purple", 
        coverIcon: "public",
        year: 1882,
        genre: "Історична повість",
        summary: "«Захар Беркут» — історична повість українського письменника Івана Франка, написана у 1882 році. Твір розповідає про боротьбу карпатських горян проти монголо-татар та місцевих феодалів у XIII столітті.",
        characters: "Захар Беркут, Максим Беркут, Тугар Вовк, Мирослава, Бурунда",
        themes: "Патріотизм, громадське самоврядування, боротьба з загарбниками, народна мудрість, протистояння суспільних устроїв",
        fullText: this.readFullText('franko_zahar.txt'),
        quotes: ["Нема насолоди в могучості, нема би щастя в неволі інших!", "Не кидайте топора, коли зарубалися, то й витешіться!", "Наша сила в громаді."]
      },
      { 
        title: "Ворошиловград", 
        authorId: 6, 
        category: "modern", 
        description: "Роман про повернення в рідне місто", 
        coverType: "icon", 
        coverColor: "stone", 
        coverIcon: "auto_stories",
        year: 2010,
        genre: "Сучасний роман",
        summary: "«Ворошиловград» — роман українського письменника Сергія Жадана, написаний у 2010 році. Твір розповідає про повернення головного героя до рідного міста на Донбасі, де він намагається захистити бізнес свого зниклого брата.",
        characters: "Герман, Коча, Ольга, Шура, Травмований",
        themes: "Повернення додому, пам'ять, дружба, протистояння системі, пошук самого себе",
        fullText: this.readFullText('zhadan_voroshylovgrad.txt'),
        quotes: ["Смерть – це те, що робить нас людьми.", "Любов – єдина гра, в якій немає правил", "Батьківщина – це те, за що ми готові померти, а не те, за що ми хочемо жити."]
      },
      { 
        title: "Солодка Даруся", 
        authorId: 7, 
        category: "modern", 
        description: "Драма на три життя", 
        coverType: "icon", 
        coverColor: "indigo", 
        coverIcon: "auto_stories",
        year: 2004,
        genre: "Психологічний роман",
        summary: "«Солодка Даруся» — роман української письменниці Марії Матіос, написаний у 2004 році. Твір розповідає історію німої жінки з буковинського села та оповідає про психологію людей, які пережили драматичні події на зламі історичних епох.",
        characters: "Даруся, Михайло, Матронка, Іван Цвичок",
        themes: "Тоталітаризм і його вплив на людей, історична пам'ять, психологічна травма, зрада, спокута",
        fullText: this.readFullText('matios_darusia.txt'),
        quotes: ["Гріх – це не тільки вчинок. Гріх – це ще й каяття.", "Кожному своя правда, як і кожному – свій хрест.", "Душа болить не за покійними – душа болить за живими."]
      },
      { 
        title: "Фелікс Австрія", 
        authorId: 8, 
        category: "modern", 
        description: "Роман про Галичину початку 20 століття", 
        coverType: "icon", 
        coverColor: "cyan", 
        coverIcon: "auto_stories",
        year: 2014,
        genre: "Історичний роман",
        summary: "«Фелікс Австрія» — роман української письменниці Софії Андрухович, написаний у 2014 році. Твір розповідає про життя в Станіславові (нині Івано-Франківськ) на початку XX століття, в останні роки існування Австро-Угорської імперії.",
        characters: "Стефанія Чорненько, Аделя, Петро, Йосиф Рідний",
        themes: "Дружба і залежність, історія Галичини, жіноча доля, зміна епох",
        fullText: this.readFullText('andrukhovich_felix.txt'),
        quotes: ["Найбільше благо – це згода і добрі стосунки.", "Ніщо не робить людину такою нещасною, як її власні рішення.", "Невже і я так ненавиджу себе, як вона? Ненавиджу свою ніжність і слабкість?"]
      },
      { 
        title: "Інтернат", 
        authorId: 6, 
        category: "modern", 
        description: "Роман про війну на Донбасі", 
        coverType: "icon", 
        coverColor: "green", 
        coverIcon: "auto_stories",
        year: 2017,
        genre: "Воєнний роман",
        summary: "«Інтернат» — роман українського письменника Сергія Жадана, написаний у 2017 році. Твір розповідає про три дні із життя вчителя української мови, який намагається вивезти свого племінника із зони бойових дій на Донбасі.",
        characters: "Паша, Саша, Ніна, Шура",
        themes: "Війна і мир, вибір та відповідальність, ідентичність, доросління",
        fullText: this.readFullText('zhadan_internat.txt'),
        quotes: ["Війна перевіряє тебе на людяність.", "Мертві не відчувають болю, проте й не отримують задоволення від помсти.", "Ось це і є твоя країна — люди, що виривають одне в одного надію, ніби шматок хліба."]
      }
    ];
    
    books.forEach(book => this.createBook(book));
    
    // Add tests
    const tests = [
      // Тести за творами
      { title: "Кайдашева сім'я", bookId: 1, questionCount: 10, difficulty: "easy", testType: "book", questions: "Тест на знання повісті 'Кайдашева сім'я'", time: 15 },
      { title: "Тіні забутих предків", bookId: 2, questionCount: 12, difficulty: "medium", testType: "book", questions: "Запитання про повість Михайла Коцюбинського", time: 20 },
      { title: "Лісова пісня", bookId: 3, questionCount: 15, difficulty: "hard", testType: "book", questions: "Тест на знання драми-феєрії Лесі Українки", time: 25 },
      { title: "Кобзар", bookId: 4, questionCount: 14, difficulty: "hard", testType: "book", questions: "Тест на знання поезій Тараса Шевченка", time: 20 },
      { title: "Захар Беркут", bookId: 5, questionCount: 15, difficulty: "medium", testType: "book", questions: "Тест на знання історичної повісті Івана Франка", time: 20 },
      { title: "Маруся Чурай", bookId: 7, questionCount: 16, difficulty: "hard", testType: "book", questions: "Глибокий аналіз історичного роману у віршах", time: 30 },
      { title: "Інтернат", bookId: 9, questionCount: 10, difficulty: "medium", testType: "book", questions: "Тест на розуміння сучасної української літератури", time: 15 },
      { title: "Енеїда", bookId: 6, questionCount: 18, difficulty: "medium", testType: "book", questions: "Детальний тест на знання 'Енеїди' Івана Котляревського", time: 25 },
      { title: "Мойсей", bookId: 8, questionCount: 12, difficulty: "hard", testType: "book", questions: "Тест на розуміння поеми Івана Франка", time: 20 },
      { title: "Хіба ревуть воли, як ясла повні?", bookId: 10, questionCount: 20, difficulty: "hard", testType: "book", questions: "Комплексний тест на знання роману Панаса Мирного", time: 35 },
      
      // Спеціальні тести
      { title: "Вгадай цитату", bookId: null, questionCount: 15, difficulty: "hard", testType: "quote", specialIcon: "quote", questions: "Вгадайте автора цитати з української літератури", time: 15 },
      { title: "Цитати класиків", bookId: null, questionCount: 12, difficulty: "medium", testType: "quote", specialIcon: "book-text", questions: "Тест на знання відомих цитат українських класиків", time: 15 },
      { title: "Літературні герої", bookId: null, questionCount: 20, difficulty: "medium", testType: "character", specialIcon: "user", questions: "Вкажіть, яким авторам належать літературні герої", time: 20 },
      { title: "Афоризми письменників", bookId: null, questionCount: 12, difficulty: "medium", testType: "quote", specialIcon: "quote", questions: "Знання афоризмів відомих українських письменників", time: 15 },
      { title: "Спадщина Франка", bookId: 5, questionCount: 15, difficulty: "hard", testType: "book", specialIcon: "book", questions: "Комплексний тест на знання творчості Івана Франка", time: 25 },
      { title: "Поезія Шевченка", bookId: 4, questionCount: 16, difficulty: "medium", testType: "quote", specialIcon: "book-text", questions: "Тест на знання поезій Тараса Шевченка", time: 18 },
      { title: "Сучасна українська література", bookId: null, questionCount: 14, difficulty: "medium", testType: "quote", specialIcon: "book", questions: "Тест на знання сучасної української літератури", time: 20 },
      
      // Тести про персонажів
      { title: "Літературні герої", bookId: null, questionCount: 12, difficulty: "medium", testType: "character", specialIcon: "users", questions: "Тест на знання літературних героїв української класики", time: 15 },
      { title: "Герої та їх автори", bookId: null, questionCount: 10, difficulty: "easy", testType: "character", specialIcon: "user", questions: "Визначення автора за персонажами", time: 10 },
      { title: "Літературні характери", bookId: null, questionCount: 15, difficulty: "hard", testType: "character", specialIcon: "users", questions: "Аналіз характерів персонажів української літератури", time: 20 },
      { title: "Характеристика персонажів", bookId: null, questionCount: 18, difficulty: "medium", testType: "character", specialIcon: "user", questions: "Запитання про характери персонажів у творах", time: 25 }
    ];
    
    tests.forEach(test => this.createTest(test));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  // Author operations
  async getAuthors(): Promise<Author[]> {
    return Array.from(this.authors.values());
  }

  async getAuthor(id: number): Promise<Author | undefined> {
    return this.authors.get(id);
  }

  async createAuthor(author: InsertAuthor): Promise<Author> {
    const id = this.currentAuthorId++;
    const newAuthor: Author = { ...author, id };
    this.authors.set(id, newAuthor);
    return newAuthor;
  }

  // Book operations
  async getBooks(): Promise<BookWithAuthor[]> {
    return Array.from(this.books.values()).map(book => ({
      ...book,
      author: this.authors.get(book.authorId)!
    }));
  }

  async getBooksByCategory(category: string): Promise<BookWithAuthor[]> {
    return Array.from(this.books.values())
      .filter(book => book.category === category)
      .map(book => ({
        ...book,
        author: this.authors.get(book.authorId)!
      }));
  }

  async getBook(id: number): Promise<BookWithAuthor | undefined> {
    const book = this.books.get(id);
    if (!book) return undefined;
    
    const author = this.authors.get(book.authorId);
    if (!author) return undefined;
    
    return { ...book, author };
  }

  async createBook(book: InsertBook): Promise<Book> {
    const id = this.currentBookId++;
    // Забезпечуємо правильні типи для необов'язкових полів
    const newBook: Book = { 
      ...book, 
      id,
      description: book.description ?? null,
      category: book.category ?? null,
      coverType: book.coverType ?? null,
      coverColor: book.coverColor ?? null,
      coverIcon: book.coverIcon ?? null,
      year: book.year ?? null,
      genre: book.genre ?? null,
      fullText: book.fullText ?? null,
      summary: book.summary ?? null,
      characters: book.characters ?? null,
      themes: book.themes ?? null,
      quotes: book.quotes ?? null
    };
    this.books.set(id, newBook);
    return newBook;
  }

  // Test operations
  async getTests(): Promise<TestWithBook[]> {
    return Array.from(this.tests.values()).map(test => {
      if (test.bookId) {
        const book = this.books.get(test.bookId);
        if (book) {
          const author = this.authors.get(book.authorId);
          if (author) {
            return {
              ...test,
              book: {
                ...book,
                author: author
              }
            };
          }
        }
      }
      return {
        ...test,
        book: undefined
      };
    });
  }

  async getTestsByType(type: string): Promise<TestWithBook[]> {
    return Array.from(this.tests.values())
      .filter(test => test.testType === type)
      .map(test => {
        if (test.bookId) {
          const book = this.books.get(test.bookId);
          if (book) {
            const author = this.authors.get(book.authorId);
            if (author) {
              return {
                ...test,
                book: {
                  ...book,
                  author: author
                }
              };
            }
          }
        }
        return {
          ...test,
          book: undefined
        };
      });
  }

  async getTestsByBookId(bookId: number): Promise<TestWithBook[]> {
    const book = this.books.get(bookId);
    if (!book) return [];
    
    const author = this.authors.get(book.authorId);
    if (!author) return [];
    
    return Array.from(this.tests.values())
      .filter(test => test.bookId === bookId)
      .map(test => ({
        ...test,
        book: {
          ...book,
          author: author
        }
      }));
  }

  async getTest(id: number): Promise<TestWithBook | undefined> {
    const test = this.tests.get(id);
    if (!test) return undefined;
    
    if (test.bookId) {
      const book = this.books.get(test.bookId);
      if (!book) return { ...test, book: undefined };
      
      const author = this.authors.get(book.authorId);
      if (!author) return { ...test, book: undefined };
      
      return { ...test, book: { ...book, author } };
    }
    
    return { ...test, book: undefined };
  }

  async createTest(test: InsertTest): Promise<Test> {
    const id = this.currentTestId++;
    // Забезпечуємо правильні типи для необов'язкових полів
    const newTest: Test = { 
      ...test, 
      id,
      bookId: test.bookId ?? null,
      specialIcon: test.specialIcon ?? null,
      questions: test.questions ?? null,
      time: test.time ?? null
    };
    this.tests.set(id, newTest);
    return newTest;
  }

  // User progress operations
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgresses.values())
      .filter(progress => progress.userId === userId);
  }

  async getUserBookProgress(userId: number, bookId: number): Promise<UserProgress | undefined> {
    return Array.from(this.userProgresses.values()).find(
      progress => progress.userId === userId && progress.bookId === bookId
    );
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const id = this.currentUserProgressId++;
    // Забезпечуємо правильні типи для необов'язкових полів
    const newProgress: UserProgress = { 
      ...progress, 
      id,
      progress: progress.progress ?? 0,
      currentPage: progress.currentPage ?? 0,
      totalPages: progress.totalPages ?? 0,
      lastReadAt: progress.lastReadAt ?? new Date(),
      completed: progress.completed ?? false 
    };
    this.userProgresses.set(id, newProgress);
    return newProgress;
  }

  async updateUserProgress(id: number, progress: Partial<UserProgress>): Promise<UserProgress> {
    const existing = this.userProgresses.get(id);
    if (!existing) throw new Error(`User progress with id ${id} not found`);
    
    const updated = { ...existing, ...progress };
    this.userProgresses.set(id, updated);
    return updated;
  }

  // Test results operations
  async getUserTestResults(userId: number): Promise<TestResult[]> {
    return Array.from(this.testResults.values())
      .filter(result => result.userId === userId);
  }

  async getTestResult(userId: number, testId: number): Promise<TestResult | undefined> {
    return Array.from(this.testResults.values()).find(
      result => result.userId === userId && result.testId === testId
    );
  }

  async createTestResult(result: InsertTestResult): Promise<TestResult> {
    const id = this.currentTestResultId++;
    // Забезпечуємо правильні типи для необов'язкових полів
    const newResult: TestResult = { 
      ...result, 
      id,
      completed: result.completed ?? false,
      completedAt: result.completedAt ?? null
    };
    this.testResults.set(id, newResult);
    return newResult;
  }

  async updateTestResult(id: number, result: Partial<TestResult>): Promise<TestResult> {
    const existing = this.testResults.get(id);
    if (!existing) throw new Error(`Test result with id ${id} not found`);
    
    const updated = { ...existing, ...result };
    this.testResults.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
