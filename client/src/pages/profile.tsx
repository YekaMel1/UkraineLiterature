import { useUserId, useUserProgress, useTestResults, useReadingProgress, useBooks, useTests, TestResultWithTitle } from "@/lib/hooks";
import { useAuth } from "@/hooks/use-auth";
import ProgressBar from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import { User, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useEffect } from "react";
import { useLocation } from "wouter";

const Profile = () => {
  const { user, logoutMutation } = useAuth();
  const userId = useUserId();
  const [location] = useLocation();
  
  const { 
    data: userProgress, 
    isLoading: loadingProgress,
    refetch: refetchProgress 
  } = useUserProgress(userId);
  
  const { 
    data: testResults, 
    isLoading: loadingTestResults,
    refetch: refetchTestResults 
  } = useTestResults(userId);
  
  const { percentage, read, total, refetch: refetchReadingStats }: {
    percentage: number;
    read: number;
    total: number;
    refetch: () => Promise<any>;
  } = useReadingProgress(userId);
  
  // Оновлюємо дані при відображенні сторінки
  useEffect(() => {
    const updateData = async () => {
      console.log("Оновлюємо дані профілю...");
      
      try {
        await Promise.all([
          refetchProgress(),
          refetchTestResults(),
          refetchReadingStats()
        ]);
        console.log("Дані профілю успішно оновлено");
      } catch (error) {
        console.error("Помилка оновлення даних профілю:", error);
      }
    };
    
    // Викликаємо оновлення, коли сторінка відображається
    if (location === "/profile") {
      updateData();
    }
  }, [location, refetchProgress, refetchTestResults, refetchReadingStats]);
  
  console.log("Профіль: дані користувача і прогрес читання:", {
    userId,
    userProgress,
    testResults,
    readingStats: { percentage, read, total }
  });
  
  // Calculate statistics
  const completedTests = testResults?.length || 0;
  
  // Розрахунок середнього бала за тестами
  const avgTestScore = testResults && testResults.length > 0 
    ? Math.round(testResults.reduce((sum, test) => sum + test.score, 0) / testResults.length) 
    : 0;
    
  // Групування тестів за типами
  const testsByType = testResults?.reduce((acc, test) => {
    // Визначаємо тип тесту на основі назви або встановлюємо "Загальні тести" як значення за замовчуванням
    const testType = test.testTitle?.includes("цитат") ? "Цитати" 
      : test.testTitle?.includes("Літературні герої") ? "Персонажі"
      : test.testTitle?.includes("характер") ? "Персонажі"
      : "Твори";
    
    if (!acc[testType]) {
      acc[testType] = [];
    }
    acc[testType].push(test);
    return acc;
  }, {} as Record<string, TestResultWithTitle[]>) || {};
  
  // Статистика пройдених тестів 
  const testTypeStats = Object.entries(testsByType).map(([type, tests]) => ({
    type,
    count: tests.length,
    avgScore: Math.round(tests.reduce((sum, test) => sum + test.score, 0) / tests.length)
  }));
  
  const achievements = 0; // In a real app, we would calculate achievements

  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return format(date, 'dd.MM.yyyy');
  };
  
  return (
    <div className="profile-page">
      <header className="p-4 bg-white shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary-900">Профіль</h1>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            refetchProgress();
            refetchTestResults();
            refetchReadingStats();
            console.log("Оновлення даних профілю вручну");
          }}
          className="flex items-center gap-1 text-neutral-500"
        >
          <RefreshCw className="h-4 w-4" />
          Оновити
        </Button>
      </header>

      <section className="p-4 bg-white mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="ml-4">
              <h2 className="font-medium">{user?.name || "Користувач"}</h2>
              <p className="text-sm text-neutral-700">{user?.email || "Електронна пошта недоступна"}</p>
              {user?.createdAt && (
                <p className="text-xs text-neutral-500">Дата реєстрації: {formatDate(user.createdAt)}</p>
              )}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="py-2 px-4 bg-neutral-100 text-neutral-700 rounded-lg font-medium"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? "Виходимо..." : "Вихід"}
          </Button>
        </div>
      </section>

      <section className="p-4 bg-white mb-3">
        <h3 className="text-sm font-medium mb-2">Прогрес ЗНО/НМТ</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-primary-50 p-3 rounded-lg border border-primary-100">
            <div className="text-lg font-semibold text-primary-900">{read}/{total}</div>
            <div className="text-xs text-neutral-600">Прочитано творів</div>
          </div>
          <div className="bg-primary-50 p-3 rounded-lg border border-primary-100">
            <div className="text-lg font-semibold text-primary-900">{completedTests}</div>
            <div className="text-xs text-neutral-600">Тестів пройдено</div>
          </div>
        </div>
        <div className="mb-3">
          <ProgressBar 
            progress={percentage} 
            label={`${read} з ${total} творів прочитано`} 
          />
        </div>
      </section>

      <section className="p-4 bg-white mb-3">
        <h2 className="text-lg font-medium mb-3">Завершені твори</h2>
        {userProgress && userProgress.filter(p => p.completed).length > 0 ? (
          <div className="space-y-2">
            {userProgress
              .filter(p => p.completed)
              .slice(0, 3)
              .map((progress) => (
                <div key={progress.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{progress.bookTitle || `Книга ID: ${progress.bookId}`}</h3>
                      <div className="mt-1">
                        <span className="text-xs bg-green-100 text-green-800 py-0.5 px-2 rounded-full">
                          Завершено
                        </span>
                      </div>
                    </div>
                    <ProgressBar progress={100} label="100%" />
                  </div>
                  {'lastReadAt' in progress && progress.lastReadAt && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Останнє читання: {formatDate(progress.lastReadAt)}
                    </p>
                  )}
                </div>
              ))
            }
            {userProgress.filter(p => p.completed).length > 3 && (
              <p className="text-sm text-primary text-center mt-2">
                + ще {userProgress.filter(p => p.completed).length - 3} завершених творів
              </p>
            )}
          </div>
        ) : (
          <div className="px-3 py-4 bg-neutral-50 rounded border border-neutral-100 text-center text-neutral-700">
            У вас немає завершених творів
          </div>
        )}
      </section>
      
      <section className="p-4 bg-white mb-3">
        <h2 className="text-lg font-medium mb-3">Незавершені твори</h2>
        {userProgress && userProgress.filter(p => !p.completed).length > 0 ? (
          <div className="space-y-2">
            {userProgress
              .filter(p => !p.completed)
              .slice(0, 3)
              .map((progress) => (
                <div key={progress.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{progress.bookTitle || `Книга ID: ${progress.bookId}`}</h3>
                      <p className="text-xs text-neutral-600">
                        Прогрес: {progress.progress}%
                      </p>
                      {'currentPage' in progress && 'totalPages' in progress && progress.currentPage ? (
                        <p className="text-xs text-neutral-600">
                          Сторінка: {progress.currentPage} з {
                            // Якщо totalPages = 1, встановлюємо оцінку кількості сторінок на основі довжини тексту
                            progress.totalPages <= 1 ? 
                              // За замовчуванням 11 для довгих текстів, 2 для коротких
                              11 : 
                              progress.totalPages
                          }
                        </p>
                      ) : null}
                      <div className="mt-1">
                        <span className="text-xs bg-yellow-100 text-yellow-800 py-0.5 px-2 rounded-full">
                          В процесі
                        </span>
                      </div>
                    </div>
                    <ProgressBar 
                      progress={progress.totalPages > 0 
                        ? Math.min(Math.round((progress.currentPage / 
                            (progress.totalPages <= 1 ? 11 : progress.totalPages)) * 100), 100) 
                        : progress.progress} 
                      label={progress.totalPages > 0 
                        ? `${Math.min(Math.round((progress.currentPage / 
                            (progress.totalPages <= 1 ? 11 : progress.totalPages)) * 100), 100)}%` 
                        : `${progress.progress}%`} 
                    />
                  </div>
                  {'lastReadAt' in progress && progress.lastReadAt && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Останнє читання: {formatDate(progress.lastReadAt)}
                    </p>
                  )}
                </div>
              ))
            }
            {userProgress.filter(p => !p.completed).length > 3 && (
              <p className="text-sm text-primary text-center mt-2">
                + ще {userProgress.filter(p => !p.completed).length - 3} незавершених творів
              </p>
            )}
          </div>
        ) : (
          <div className="px-3 py-4 bg-neutral-50 rounded border border-neutral-100 text-center text-neutral-700">
            У вас немає незавершених творів
          </div>
        )}
      </section>

      <section className="p-4 bg-white mb-3">
        <h2 className="text-lg font-medium mb-3">Результати тестів</h2>
        {testResults && testResults.length > 0 ? (
          <div className="space-y-2">
            {testResults.slice(0, 3).map((result) => (
              <div key={result.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{result.testTitle || `Тест ID: ${result.testId}`}</h3>
                    <p className="text-xs text-neutral-600">
                      Бали: {result.score}/{result.maxScore || 20}
                    </p>
                    <div className="w-full mt-1 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full" 
                        style={{ width: `${Math.min(Math.round((result.score / (result.maxScore || 20)) * 100), 100)}%` }}
                      ></div>
                    </div>
                    <div className="mt-1">
                      {result.completed ? (
                        <span className="text-xs bg-green-100 text-green-800 py-0.5 px-2 rounded-full">
                          Пройдено
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 py-0.5 px-2 rounded-full">
                          В процесі
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {result.completedAt && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Пройдено: {formatDate(result.completedAt)}
                  </p>
                )}
              </div>
            ))}
            {testResults.length > 3 && (
              <p className="text-sm text-primary text-center mt-2">
                + ще {testResults.length - 3} тестів
              </p>
            )}
          </div>
        ) : (
          <div className="px-3 py-4 bg-neutral-50 rounded border border-neutral-100 text-center text-neutral-700">
            Ви ще не пройшли жодного тесту
          </div>
        )}
      </section>
      

    </div>
  );
};

export default Profile;
