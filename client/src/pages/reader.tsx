import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useBook, useUserId, useUserProgress } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, BookOpen, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const Reader = () => {
  const { id } = useParams<{ id: string }>();
  const bookId = parseInt(id);
  const [, setLocation] = useLocation();
  const { data: book, isLoading, error } = useBook(bookId);
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id || 0;
  const queryClient = useQueryClient();
  const { data: userBookProgress } = useUserProgress(userId);
  
  // Налаштування відображення
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineHeight, setLineHeight] = useState<number>(1.6);
  
  // Пагінація
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pagesContent, setPagesContent] = useState<string[][]>([]);
  const [progressLoaded, setProgressLoaded] = useState<boolean>(false);
  
  // Референції для підрахунку розмірів
  const contentRef = useRef<HTMLDivElement>(null);
  const testParagraphRef = useRef<HTMLParagraphElement>(null);

  // Завантаження налаштувань та прогресу з бази даних при відкритті
  useEffect(() => {
    // Зберігаємо налаштування форматування тексту з localStorage
    const savedFontSize = localStorage.getItem("reader-font-size");
    const savedLineHeight = localStorage.getItem("reader-line-height");
    
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    if (savedLineHeight) setLineHeight(parseFloat(savedLineHeight));
    
    // Запобігання перезаписуванню даних, завантажених з БД
    if (progressLoaded) return;
    
    // Перевіряємо чи є прогрес у базі даних
    if (userBookProgress && userBookProgress.length > 0) {
      // Шукаємо прогрес для поточної книги
      const bookProgress = userBookProgress.find(p => p.bookId === bookId);
      
      if (bookProgress && bookProgress.currentPage > 0) {
        console.log("Завантажуємо прогрес з бази даних:", bookProgress);
        // Пріоритет віддаємо прогресу з бази даних
        setCurrentPage(bookProgress.currentPage);
        
        // Встановлюємо загальну кількість сторінок з бази даних
        if (bookProgress.totalPages > 0) {
          setTotalPages(bookProgress.totalPages);
        }
        
        setProgressLoaded(true);
      } else {
        // Якщо немає в базі даних, використовуємо localStorage
        const savedPage = localStorage.getItem(`reader-page-${bookId}`);
        if (savedPage) {
          console.log("Завантажуємо прогрес з localStorage:", savedPage);
          setCurrentPage(parseInt(savedPage));
        }
      }
    } else {
      // Якщо взагалі немає прогресу в базі даних, використовуємо localStorage
      const savedPage = localStorage.getItem(`reader-page-${bookId}`);
      if (savedPage) {
        console.log("Завантажуємо прогрес з localStorage:", savedPage);
        setCurrentPage(parseInt(savedPage));
      }
    }
  }, [bookId, userBookProgress, progressLoaded]);

  // Розподіл тексту на сторінки при зміні параметрів
  useEffect(() => {
    if (!book || !contentRef.current || !testParagraphRef.current) return;
    
    const calculatePages = () => {
      const paragraphs = (book.fullText || "").split("\n").filter(p => p.trim().length > 0);
      const containerHeight = contentRef.current!.clientHeight;
      const pages: string[][] = [[]];
      let currentPageHeight = 0;
      let currentPageIndex = 0;
      
      // Встановлюємо мінімальну кількість сторінок до 2, якщо є достатньо тексту
      if (paragraphs.length > 5) {
        // Кожен абзац буде займати приблизно 20% висоти сторінки
        const heightPerParagraph = containerHeight * 0.2;
        
        paragraphs.forEach(paragraph => {
          // Визначаємо висоту абзацу більш надійно
          testParagraphRef.current!.textContent = paragraph;
          const paragraphHeight = testParagraphRef.current!.offsetHeight || heightPerParagraph;
          
          // Якщо абзац не вміщується на поточній сторінці або сторінка вже має 3 абзаци, створюємо нову
          // Це забезпечить, що у нас буде більше сторінок для довгих текстів
          if (currentPageHeight + paragraphHeight > containerHeight || pages[currentPageIndex].length >= 3) {
            currentPageIndex++;
            pages[currentPageIndex] = [paragraph];
            currentPageHeight = paragraphHeight;
          } else {
            // Додаємо абзац до поточної сторінки
            pages[currentPageIndex].push(paragraph);
            currentPageHeight += paragraphHeight;
          }
        });
      } else {
        // Для малих текстів, просто додаємо по одному абзацу на сторінку
        paragraphs.forEach((paragraph, index) => {
          if (index > 0) {
            currentPageIndex++;
            pages[currentPageIndex] = [];
          }
          pages[currentPageIndex].push(paragraph);
        });
      }
      
      // Переконуємось, що маємо як мінімум одну сторінку
      if (pages.length === 0) {
        pages.push(["Текст відсутній"]);
      }
      
      // Розраховуємо кількість сторінок
      const calculatedTotalPages = Math.max(pages.length, paragraphs.length > 5 ? 2 : 1);
      
      // Перевіряємо, чи маємо дані з бази даних
      const bookProgress = userBookProgress?.find(p => p.bookId === bookId);
      const dbTotalPages = bookProgress?.totalPages;
      
      // Обчислюємо фінальне значення кількості сторінок
      // Якщо в базі є значення і воно не менше розрахованого, використовуємо його
      const finalTotalPages = dbTotalPages && dbTotalPages >= calculatedTotalPages 
        ? dbTotalPages
        : calculatedTotalPages;
      
      console.log("Розрахунок сторінок:", {
        paragraphCount: paragraphs.length,
        containerHeight: containerHeight,
        calculatedPages: pages.length,
        finalTotalPages: finalTotalPages
      });
      
      // Зберігаємо розрахунки
      setTotalPages(finalTotalPages);
      setPagesContent(pages);
      
      // Діагностична інформація для аналізу
      console.log("Інформація про книгу:", {
        title: book.title,
        textLength: book.fullText?.length || 0,
        providedTotalPages: dbTotalPages || 0,
        estimatedTotalPages: calculatedTotalPages,
        finalTotalPages: finalTotalPages,
        currentPage: currentPage,
        actualProgressPercentage: Math.round((currentPage / finalTotalPages) * 100)
      });
      
      // Переконуємося, що поточна сторінка не більша за загальну кількість
      if (currentPage > finalTotalPages) {
        setCurrentPage(1);
      }
    };
    
    // Запускаємо розрахунок після відмальовки UI
    const timer = setTimeout(calculatePages, 100);
    
    return () => clearTimeout(timer);
  }, [book, fontSize, lineHeight, bookId, currentPage, userBookProgress]);
  
  // Мутація для створення/оновлення прогресу читання
  const createProgressMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/user/progress', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/progress/${userId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Помилка збереження прогресу',
        description: 'Не вдалося зберегти прогрес читання',
        variant: 'destructive',
      });
      console.error('Error saving progress:', error);
    }
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PATCH', `/api/user/progress/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/progress/${userId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Помилка оновлення прогресу',
        description: 'Не вдалося оновити прогрес читання',
        variant: 'destructive',
      });
      console.error('Error updating progress:', error);
    }
  });

  // Зберігаємо номер поточної сторінки для конкретної книги
  useEffect(() => {
    if (!book || !userId) return;
    
    localStorage.setItem(`reader-page-${bookId}`, currentPage.toString());
    
    // Якщо користувач авторизований, зберігаємо прогрес у БД
    if (userId) {
      const readingProgress = Math.round((currentPage / totalPages) * 100);
      const isCompleted = currentPage === totalPages;
      
      // Викликаємо API для отримання актуального прогресу цієї книги
      const getUserBookProgress = async () => {
        try {
          const response = await fetch(`/api/user/progress/${userId}`);
          if (!response.ok) throw new Error('Failed to fetch progress');
          
          const allProgress = await response.json();
          console.log("Перевіряємо наявність прогресу перед збереженням:", allProgress);
          
          // Шукаємо запис для поточної книги
          const bookProgress = allProgress
            .filter((p: any) => p.bookId === bookId)
            .sort((a: any, b: any) => {
              const dateA = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0;
              const dateB = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0;
              return dateB - dateA;
            })[0];
          
          // Дані для оновлення/створення запису
          const progressData = {
            progress: readingProgress,
            currentPage: currentPage,
            totalPages: totalPages,
            lastReadAt: new Date().toISOString(),
            completed: isCompleted
          };
          
          if (bookProgress) {
            console.log("Оновлюємо існуючий запис прогресу:", bookProgress.id);
            // Оновлюємо існуючий запис
            updateProgressMutation.mutate({
              id: bookProgress.id,
              data: progressData
            });
          } else if (totalPages > 0) {
            console.log("Створюємо новий запис прогресу для книги", bookId);
            // Створюємо новий запис прогресу
            createProgressMutation.mutate({
              userId: userId,
              bookId: bookId,
              ...progressData
            });
          }
        } catch (error) {
          console.error("Помилка отримання прогресу:", error);
        }
      };
      
      getUserBookProgress();
    }
  }, [currentPage, bookId, book, totalPages, userId]);

  const updateFontSize = (newSize: number) => {
    setFontSize(newSize);
    localStorage.setItem("reader-font-size", newSize.toString());
  };

  const updateLineHeight = (newHeight: number) => {
    setLineHeight(newHeight);
    localStorage.setItem("reader-line-height", newHeight.toString());
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Навігація по клавіатурі
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPreviousPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, totalPages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-12 w-12 border-t-2 border-blue-500 border-solid rounded-full mb-4"></div>
          <p>Завантажуємо твір...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-semibold mb-4">Помилка завантаження</h2>
        <p className="mb-6">На жаль, не вдалося завантажити твір.</p>
        <Button onClick={() => setLocation("/theory")}>
          Повернутися до списку творів
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Панель навігації - адаптована для мобільних */}
      <div className="sticky top-0 z-10 bg-white shadow-md p-2 sm:p-4">
        <div className="container mx-auto">
          {/* Верхня частина для мобільного відображення з назвою книги */}
          <div className="md:hidden mb-2 text-center">
            <h1 className="text-lg font-semibold truncate">
              {book.title}
            </h1>
          </div>
          
          {/* Кнопки навігації та форматування */}
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center">
              <Link href={`/books/${bookId}`}>
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                  <ChevronLeft className="h-4 w-4 mr-0 sm:mr-1" />
                  <span className="hidden xs:inline">Назад</span>
                </Button>
              </Link>
              <h1 className="text-xl font-semibold hidden md:block ml-2">
                {book.title}
              </h1>
            </div>
            
            {/* Кнопки форматування в групі */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFontSize(Math.max(14, fontSize - 2))}
                disabled={fontSize <= 14}
                className="px-2 h-8 sm:px-3"
              >
                A-
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFontSize(Math.min(26, fontSize + 2))}
                disabled={fontSize >= 26}
                className="px-2 h-8 sm:px-3"
              >
                A+
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateLineHeight(Math.max(1.2, lineHeight - 0.2))}
                disabled={lineHeight <= 1.2}
                className="px-2 h-8 sm:px-3"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateLineHeight(Math.min(2.4, lineHeight + 0.2))}
                disabled={lineHeight >= 2.4}
                className="px-2 h-8 sm:px-3"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Вміст тексту книги - контейнер із фіксованою висотою */}
      <div className="flex-1 container mx-auto py-3 sm:py-6 px-2 sm:px-4 flex flex-col">
        <div 
          ref={contentRef}
          className="bg-white shadow-md rounded-lg p-3 sm:p-8 flex-1 overflow-hidden" 
          style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
        >
          {pagesContent[currentPage - 1]?.map((paragraph, index) => (
            <p key={index} className="mb-4">{paragraph}</p>
          ))}
          
          {/* Тестовий елемент для оцінки висоти абзаців (невидимий) */}
          <p 
            ref={testParagraphRef} 
            className="absolute opacity-0 pointer-events-none" 
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight, width: 'calc(100% - 2rem)' }}
          ></p>
        </div>
        
        {/* Навігація по сторінках - адаптована для мобільних */}
        <div className="flex flex-wrap justify-between items-center mt-3 sm:mt-4 bg-white rounded-lg shadow-md p-2 sm:p-4 gap-2">
          <Button 
            variant="outline"
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="flex items-center px-2 sm:px-4 h-9 flex-grow sm:flex-grow-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="hidden xs:inline">Попередня</span>
          </Button>
          
          <div className="text-center order-first sm:order-none w-full sm:w-auto">
            <div className="mb-1">
              <span className="text-sm text-gray-500">
                Сторінка {currentPage} з {totalPages}
              </span>
            </div>
            <div className="w-full sm:w-32 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
              <div 
                className="h-full bg-primary-500" 
                style={{ width: `${Math.round((currentPage / Math.max(1, totalPages)) * 100)}%` }}
              ></div>
            </div>
          </div>
          
          {currentPage >= totalPages ? (
            <Button 
              variant="default"
              onClick={() => setLocation("/theory")}
              className="flex items-center px-2 sm:px-4 h-9 flex-grow sm:flex-grow-0"
            >
              <span className="hidden xs:inline">Завершити</span>
              <BookOpen className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={goToNextPage}
              className="flex items-center px-2 sm:px-4 h-9 flex-grow sm:flex-grow-0"
            >
              <span className="hidden xs:inline">Наступна</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reader;