import { useQuery } from "@tanstack/react-query";
import { type Book, type BookWithAuthor, type Test, type TestWithBook, type UserProgress, type TestResult } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

// Get the current user ID from auth context
export const useUserId = (): number => {
  const { user } = useAuth();
  return user?.id || 0;
};

// Fetch books with optional category filter
export const useBooks = (category?: string) => {
  const url = category 
    ? `/api/books?category=${category}` 
    : "/api/books";
  
  return useQuery<BookWithAuthor[]>({
    queryKey: [url],
  });
};

// Fetch specific book by ID
export const useBook = (id: number) => {
  return useQuery<BookWithAuthor>({
    queryKey: [`/api/books/${id}`],
    enabled: !!id,
  });
};

// Fetch tests with optional filters
export const useTests = (type?: string, bookId?: number) => {
  let url = "/api/tests";
  
  if (type) {
    url += `?type=${type}`;
  } else if (bookId) {
    url += `?bookId=${bookId}`;
  }
  
  return useQuery<TestWithBook[]>({
    queryKey: [url],
  });
};

// Fetch specific test by ID
export const useTest = (id: number) => {
  return useQuery<TestWithBook>({
    queryKey: [`/api/tests/${id}`],
    enabled: !!id,
  });
};

// Тип для розширених даних прогресу користувача з інформацією про книгу
export type UserProgressWithBook = UserProgress & {
  bookTitle?: string;
};

// Fetch user progress with book details
export const useUserProgress = (userId: number) => {
  const { data: books } = useBooks();
  
  return useQuery<UserProgressWithBook[]>({
    queryKey: [`/api/user/progress/${userId}`],
    queryFn: async () => {
      if (!userId) return [];
      
      try {
        console.log(`Запит прогресу для користувача ID: ${userId}`);
        const response = await fetch(`/api/user/progress/${userId}`);
        
        if (!response.ok) {
          console.error('Error response from API:', response.status, response.statusText);
          return [];
        }
        
        const progressData: UserProgress[] = await response.json();
        console.log(`Отримано дані прогресу:`, progressData);
        
        // Додаємо назви книг та видаляємо дублікати (залишаємо останній запис для кожної книги)
        if (books) {
          const uniqueBookIds = new Set<number>();
          const booksMap = new Map(books.map(book => [book.id, book]));
          
          // Спочатку сортуємо за датою читання (нові спершу)
          const sortedProgress = [...progressData].sort((a, b) => {
            const dateA = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0;
            const dateB = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0;
            return dateB - dateA;
          });
          
          // Залишаємо тільки унікальні книги (перший запис для кожної книги після сортування)
          const uniqueProgress = sortedProgress.filter(item => {
            if (uniqueBookIds.has(item.bookId)) {
              return false;
            }
            uniqueBookIds.add(item.bookId);
            return true;
          });
          
          // Додаємо назви книг
          const progressWithTitles = uniqueProgress.map(progress => ({
            ...progress,
            bookTitle: booksMap.get(progress.bookId)?.title
          }));
          
          console.log("Підготовлений список прогресу з назвами книг:", progressWithTitles);
          return progressWithTitles;
        }
        
        return progressData;
      } catch (error) {
        console.error('Failed to fetch user progress:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 60000, // 1 хвилина кеш
    retry: 2
  });
};

// Fetch user progress for a specific book
export const useUserBookProgress = (userId: number, bookId: number) => {
  return useQuery<UserProgress | undefined>({
    queryKey: [`/api/user/progress/${userId}`, bookId],
    queryFn: async () => {
      if (!userId || !bookId) return undefined;
      
      try {
        const response = await fetch(`/api/user/progress/${userId}`);
        if (!response.ok) {
          console.error('Error response from API:', response.status, response.statusText);
          return undefined;
        }
        
        const data: UserProgress[] = await response.json();
        console.log(`Отримано прогрес для користувача ${userId}, шукаємо книгу ${bookId}:`, data);
        
        // Шукаємо останній прогрес для конкретної книги
        const bookProgress = data
          .filter(p => p.bookId === bookId)
          .sort((a, b) => {
            // Сортуємо за датою останнього читання (якщо є)
            const dateA = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0;
            const dateB = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0;
            return dateB - dateA;
          })[0];
          
        if (bookProgress) {
          console.log(`Знайдено прогрес для книги ${bookId}:`, bookProgress);
        } else {
          console.log(`Прогрес для книги ${bookId} не знайдено`);
        }
        
        return bookProgress;
      } catch (error) {
        console.error('Failed to fetch user progress:', error);
        return undefined;
      }
    },
    enabled: !!userId && !!bookId,
    staleTime: 30000, // 30 секунд кеш
    retry: 2
  });
};

// Calculate reading progress percentage
export const useReadingProgress = (userId: number) => {
  const { data: progress, isLoading: progressLoading, refetch: refetchProgress } = useUserProgress(userId);
  const { data: allBooks, isLoading: booksLoading, refetch: refetchBooks } = useBooks();
  
  const refetch = async () => {
    console.log("Оновлюємо статистику читання...");
    await Promise.all([refetchProgress(), refetchBooks()]);
    console.log("Статистика читання оновлена");
  };
  
  // Отримуємо дані або повертаємо значення за замовчуванням
  if (progressLoading || booksLoading || !progress || !allBooks) {
    return { 
      percentage: 0, 
      read: 0, 
      total: 0,
      refetch
    };
  }
  
  // Фільтруємо книги ЗНО/НМТ програми
  const znoBooks = allBooks.filter(book => book.category === "zno");
  
  // Cписок ID книг ЗНО/НМТ
  const znoBookIds = new Set(znoBooks.map(book => book.id));
  
  // Фільтруємо прогрес тільки для книг ЗНО/НМТ програми
  const znoProgress = progress.filter(p => znoBookIds.has(p.bookId));
  
  // Рахуємо завершені книги
  const completedBooks = znoProgress.filter(p => p.completed).length;
  const totalBooks = znoBooks.length;
  const percentage = totalBooks > 0 ? (completedBooks / totalBooks) * 100 : 0;
  
  console.log("Розрахунок статистики читання ЗНО/НМТ:", { 
    completedBooks, 
    totalBooks, 
    percentage,
    znoBookIds: Array.from(znoBookIds),
    progressBookIds: znoProgress.map(p => p.bookId)
  });
  
  return {
    percentage,
    read: completedBooks,
    total: totalBooks,
    refetch
  };
};

// Хук для отримання останніх книг, які користувач читав, але ще не завершив
export const useRecentlyReadBooks = (userId: number, limit: number = 3) => {
  const { data: progress, isLoading: progressLoading, refetch: refetchProgress } = useUserProgress(userId);
  const { data: allBooks, isLoading: booksLoading, refetch: refetchBooks } = useBooks();
  
  const query = useQuery<{ book: BookWithAuthor, progress: UserProgressWithBook }[]>({
    queryKey: [`/api/user/recent-books/${userId}`],
    queryFn: async () => {
      if (!progress || !allBooks) return [];
      
      // Створюємо мапу книг для швидкого доступу
      const booksMap = new Map(allBooks.map(book => [book.id, book]));
      
      // Сортуємо прогрес за часом останнього читання (нові спершу)
      const sortedProgress = [...progress]
        // Фільтруємо, залишаючи тільки ті книги, які ще не прочитані повністю
        .filter(prog => !prog.completed)
        .sort((a, b) => {
          const dateA = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0;
          const dateB = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0;
          return dateB - dateA;
        });
      
      // Відбираємо унікальні книги (перші limit записів після сортування)
      const uniqueBookIds = new Set<number>();
      const recentBooks = [];
      
      for (const prog of sortedProgress) {
        if (uniqueBookIds.has(prog.bookId)) continue;
        
        const book = booksMap.get(prog.bookId);
        if (book) {
          uniqueBookIds.add(prog.bookId);
          recentBooks.push({
            book,
            progress: prog
          });
          
          if (recentBooks.length >= limit) break;
        }
      }
      
      return recentBooks;
    },
    enabled: !!userId && !progressLoading && !booksLoading,
  });
  
  // Додаємо свою реалізацію refetch, яка оновлює всі залежні дані 
  const refetch = async () => {
    console.log("Оновлення списку нещодавно прочитаних книг...");
    await Promise.all([refetchProgress(), refetchBooks()]);
    await query.refetch();
    console.log("Список нещодавно прочитаних книг оновлено");
  };
  
  return {
    ...query,
    refetch
  };
};

// Тип для розширених даних результатів тестів з інформацією про тест
export type TestResultWithTitle = TestResult & {
  testTitle?: string;
  maxScore?: number; // Максимальний бал для тесту
};

// Fetch user test results with test details
export const useTestResults = (userId: number) => {
  const { data: allTests } = useTests();
  
  return useQuery<TestResultWithTitle[]>({
    queryKey: [`/api/user/test-results/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/user/test-results/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch test results');
      }
      const resultsData: TestResult[] = await response.json();
      
      // Додаємо назви тестів
      if (allTests) {
        const testsMap = new Map(allTests.map(test => [test.id, test]));
        
        // Сортуємо за датою проходження (нові спершу)
        const sortedResults = [...resultsData].sort((a, b) => {
          const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return dateB - dateA;
        });
        
        return sortedResults.map(result => {
          // Якщо це результат гри (testId = 0) і в базі вже є testTitle і maxScore
          if (result.testId === 0 && result.testTitle && result.maxScore) {
            return {
              ...result,
              // Залишаємо ті ж значення, що вже є в базі
              testTitle: result.testTitle,
              maxScore: result.maxScore
            };
          }
          
          // Для звичайних тестів
          const test = testsMap.get(result.testId);
          
          // Розрахунок максимального балу на основі кількості питань у тесті
          // За замовчуванням вважаємо, що кожне питання дає 1 бал
          let maxScore = 20; // Стандартний максимальний бал
          
          if (test?.questionCount) {
            maxScore = test.questionCount;
          }
          
          return {
            ...result,
            testTitle: result.testTitle || test?.title,
            maxScore: result.maxScore || maxScore
          };
        });
      }
      
      return resultsData;
    },
    enabled: !!userId,
  });
};
