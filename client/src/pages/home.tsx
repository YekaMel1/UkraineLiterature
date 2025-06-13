import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useBooks, useTests, useUserId, useReadingProgress, useRecentlyReadBooks } from "@/lib/hooks";
import BookCard from "@/components/book-card";
import TestCard from "@/components/test-card";
import ProgressBar from "@/components/progress-bar";
import ReadingProgressCard from "@/components/reading-progress-card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const Home = () => {
  const [, navigate] = useLocation();
  const userId = useUserId();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get recommended books (ZNO category)
  const { data: recommendedBooks, isLoading: loadingBooks, refetch: refetchBooks } = useBooks("zno");
  
  // Get book tests
  const { data: tests, isLoading: loadingTests, refetch: refetchTests } = useTests("book");
  
  // Get reading progress
  const { percentage, read, total, refetch: refetchProgress } = useReadingProgress(userId);
  
  // Get recently read books (тільки незавершені книги)
  const { data: recentBooks, isLoading: loadingRecentBooks, refetch: refetchRecentBooks } = useRecentlyReadBooks(userId, 2);
  
  // Функція для повного оновлення даних на сторінці
  const refreshAllData = async () => {
    setIsRefreshing(true);
    
    try {
      console.log("Оновлюємо всі дані на головній сторінці...");
      // Інвалідуємо ключі запитів для свіжих даних
      await queryClient.invalidateQueries({ queryKey: [`/api/user/progress/${userId}`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/user/recent-books/${userId}`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      
      // Оновлюємо всі дані
      await Promise.all([
        refetchProgress(),
        refetchRecentBooks(),
        refetchBooks(),
        refetchTests()
      ]);
      
      console.log("Дані на головній сторінці оновлено");
    } catch (error) {
      console.error("Помилка оновлення даних:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Оновлюємо дані при першому завантаженні та кожного разу, коли користувач переходить на цю сторінку
  useEffect(() => {
    refreshAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  
  return (
    <div className="home-page">
      <header className="p-4 bg-white shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary-900">Українська література</h1>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={refreshAllData}
          disabled={isRefreshing}
          className="text-primary-600 hover:text-primary-800"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Оновлення...' : 'Оновити'}
        </Button>
      </header>

      <section className="p-4 bg-white mb-2">
        <h2 className="text-lg font-medium mb-3">Ваш прогрес</h2>
        <ProgressBar 
          progress={percentage} 
          label={`${read} з ${total} творів прочитано`} 
        />
      </section>

      <section className="p-4 bg-white mb-2">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium">Продовжити читання</h2>
          <button 
            className="text-primary-700 text-sm"
            onClick={() => navigate("/theory")}
          >
            Всі книги
          </button>
        </div>
        
        {loadingRecentBooks ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : recentBooks && recentBooks.length > 0 ? (
          <div className="space-y-3">
            {recentBooks.map(({ book, progress }) => (
              <ReadingProgressCard 
                key={book.id} 
                book={book} 
                progress={progress}
                onClick={() => navigate(`/reader/${book.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 bg-neutral-50 rounded border border-neutral-100 text-center flex flex-col items-center gap-2">
            <BookOpen className="h-8 w-8 text-neutral-400" />
            <div className="text-neutral-700">
              Почніть читати літературу з розділу "Теорія" або "Бібліотека"
            </div>
          </div>
        )}
      </section>

      <section className="p-4 bg-white mb-2">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium">Рекомендовано для вас</h2>
          <button 
            className="text-primary-700 text-sm"
            onClick={() => navigate("/library")}
          >
            Все
          </button>
        </div>
        
        {loadingBooks ? (
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {recommendedBooks
              // Фільтруємо тільки ті книги, які ще не прочитані
              ?.filter(book => {
                // Шукаємо прогрес для даної книги
                const bookProgress = recentBooks?.find(item => item.book.id === book.id);
                // Якщо немає прогресу або книга не помічена як прочитана, включаємо її
                return !bookProgress || !bookProgress.progress.completed;
              })
              .slice(0, 2)
              .map((book) => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onClick={() => navigate(`/books/${book.id}`)}
                />
              ))}
          </div>
        )}
      </section>

      <section className="p-4 bg-white">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium">Тести для вас</h2>
          <button 
            className="text-primary-700 text-sm"
            onClick={() => navigate("/games")}
          >
            Всі тести
          </button>
        </div>
        
        {loadingTests ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Перемішуємо тести та вибираємо 4 випадкові */}
            {tests
              ?.sort(() => Math.random() - 0.5)
              .slice(0, 4)
              .map((test) => (
                <TestCard 
                  key={test.id} 
                  test={test} 
                  compact 
                  onStart={() => navigate(`/test/${test.id}`)}
                />
              ))
            }
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
