import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
// Використовуємо безпосередньо контейнер з Tailwind замість окремого компонента
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, BookOpen, Search, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Recommendation = {
  recommendations: string[];
  explanation: string;
};

const AIRecommendations: React.FC = () => {
  const [query, setQuery] = useState("");
  const [storedQuery, setStoredQuery] = useState("");
  const [storedResults, setStoredResults] = useState<Recommendation | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const { mutate: getRecommendations, isPending, data } = useMutation({
    mutationFn: async (query: string): Promise<Recommendation> => {
      const res = await apiRequest("POST", "/api/recommendations", { query });
      return res.json();
    },
    onSuccess: (data) => {
      // Зберігаємо дані в локальному сховищі
      localStorage.setItem("ai_query", query);
      localStorage.setItem("ai_results", JSON.stringify(data));
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося отримати рекомендації. Спробуйте пізніше.",
        variant: "destructive",
      });
    },
  });

  // Завантажуємо збережені результати з локального сховища при завантаженні сторінки
  useEffect(() => {
    const savedQuery = localStorage.getItem("ai_query");
    const savedResults = localStorage.getItem("ai_results");
    
    if (savedQuery) {
      setStoredQuery(savedQuery);
      setQuery(savedQuery);
    }
    
    if (savedResults) {
      try {
        setStoredResults(JSON.parse(savedResults));
      } catch (error) {
        console.error("Помилка при розборі збережених результатів:", error);
      }
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 3) {
      toast({
        title: "Увага",
        description: "Запит повинен містити щонайменше 3 символи",
        variant: "default",
      });
      return;
    }
    getRecommendations(query.trim());
  };

  const handleBookSelect = (bookTitle: string) => {
    // Відкриття сторінки бібліотеки з пошуком по назві книги
    toast({
      title: "Пошук книги",
      description: `Шукаємо "${bookTitle}" в бібліотеці`,
    });
    
    // Зберігаємо назву книги для пошуку в бібліотеці
    localStorage.setItem("book_search", bookTitle);
    setLocation("/library");
  };

  // Визначаємо результати для відображення (нові або збережені)
  const displayResults = data || storedResults;
  const displayQuery = data ? query : storedQuery;

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-7xl py-4 sm:py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/library")}
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 flex-wrap">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <span>Літературний асистент</span>
          </h1>
        </div>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Пошук літературних рекомендацій</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Опишіть свої літературні вподобання чи інтереси українською, і я порекомендую вам українську літературу
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-6">
              <div className="flex-1 relative">
                <Input
                  placeholder="Опишіть літературу, яку шукаєте..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pr-3"
                  disabled={isPending}
                />
              </div>
              <Button 
                type="submit" 
                disabled={isPending || query.length < 3}
                className="sm:w-auto w-full"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Пошук
              </Button>
            </form>

            {isPending && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">
                  Аналізуємо ваш запит та підбираємо рекомендації...
                </p>
              </div>
            )}

            {!isPending && displayResults && (
              <div className="w-full space-y-6">
                <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                  <h3 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">Ваш запит:</h3>
                  <p className="text-xs sm:text-sm italic">"{displayQuery}"</p>
                </div>
                
                {/* Рекомендації зверху */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Рекомендовані книжки:</h3>
                  
                  <div className="rounded-md border">
                    {displayResults.recommendations.length > 0 ? (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:gap-4 sm:p-4">
                        {displayResults.recommendations.map((book, index) => (
                          <li key={index} className="bg-card rounded-lg p-3 sm:p-4 border shadow-sm">
                            <Button
                              variant="link"
                              className="h-auto p-0 justify-start text-left break-words whitespace-normal mb-2 text-primary hover:text-primary/80 text-sm sm:text-base"
                              onClick={() => handleBookSelect(book)}
                            >
                              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 min-w-[16px] sm:min-w-[20px] mr-2 sm:mr-3 flex-shrink-0" />
                              <span className="font-medium">{book}</span>
                            </Button>
                            <div className="ml-6 sm:ml-8 mt-2">
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="text-xs h-7 px-2 sm:px-3"
                                onClick={() => handleBookSelect(book)}
                              >
                                Знайти в бібліотеці
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <p className="text-muted-foreground">
                          Немає рекомендацій для відображення.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Пояснення внизу */}
                <div className="space-y-3 sm:space-y-4">
                  <details className="bg-white border rounded-lg text-sm sm:text-base">
                    <summary className="font-medium p-3 sm:p-4 cursor-pointer">Аналіз вашого запиту</summary>
                    <div className="prose max-w-none p-3 sm:p-4 pt-0 border-t text-sm sm:text-base">
                      <p>{displayResults.explanation}</p>
                    </div>
                  </details>
                </div>
              </div>
            )}
            
            {!isPending && !displayResults && (
              <div className="text-center py-8 sm:py-12">
                <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium mb-2">Спробуйте літературного асистента!</h3>
                <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base px-2 sm:px-0">
                  Опишіть свої літературні вподобання чи інтереси, наприклад:
                </p>
                <ul className="text-sm sm:text-base text-muted-foreground mt-2 max-w-md mx-auto space-y-1">
                  <li>"історичні романи про козаків"</li>
                  <li>"сучасна українська література для підлітків"</li>
                  <li>"драматичні твори про кохання"</li>
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t pt-4">
            <div className="text-sm text-muted-foreground text-center w-full">
              Powered by OpenAI | Підтримує запити українською та англійською мовами
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AIRecommendations;