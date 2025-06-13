import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, BookOpen, X, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

type Recommendation = {
  recommendations: string[];
  explanation: string;
};

interface AIAssistantProps {
  onSelectBook?: (bookName: string) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onSelectBook }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { mutate: getRecommendations, isPending, data } = useMutation({
    mutationFn: async (query: string): Promise<Recommendation> => {
      const res = await apiRequest("POST", "/api/recommendations", { query });
      return res.json();
    },
    onSuccess: (data) => {
      // При успішному пошуку зберігаємо запит та результати в локальному сховищі
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

  const handleSelectBook = (book: string) => {
    if (onSelectBook) {
      onSelectBook(book);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="items-center gap-2 group transition-all"
      >
        <Sparkles className="h-4 w-4 text-purple-500 group-hover:text-purple-600" />
        <span>Літературний асистент</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="relative">
              <div className="absolute right-4 top-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Літературний асистент
              </CardTitle>
              <CardDescription>
                Опишіть свої літературні вподобання чи інтереси українською, і я порекомендую вам українську літературу
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex space-x-2 mb-4">
                <Input
                  placeholder="Пошук літератури... (українською)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 text-sm"
                  disabled={isPending}
                />
                <Button type="submit" size="sm" disabled={isPending || query.length < 3}>
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </form>

              {isPending && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Пошук рекомендацій...
                  </p>
                </div>
              )}

              {data && !isPending && (
                <div className="space-y-4">
                  <div className="text-sm">{data.explanation}</div>
                  
                  <ScrollArea className="h-52 sm:h-60 rounded-md border p-2 sm:p-4">
                    <h4 className="mb-2 font-medium">Рекомендовані книги:</h4>
                    {data.recommendations.length > 0 ? (
                      <ul className="space-y-2">
                        {data.recommendations.map((book, index) => (
                          <li key={index} className="text-sm">
                            <Button
                              variant="link"
                              className="h-auto p-0 justify-start text-left break-words whitespace-normal"
                              onClick={() => handleSelectBook(book)}
                            >
                              <BookOpen className="h-3.5 w-3.5 min-w-[14px] mr-2 text-primary flex-shrink-0" />
                              <span>{book}</span>
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Немає рекомендацій для відображення.
                      </p>
                    )}
                  </ScrollArea>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                {data && !isPending && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setIsOpen(false);
                      setLocation("/ai-recommendations");
                    }}
                  >
                    Відкрити на повній сторінці
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Закрити
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Powered by OpenAI | Підтримує запити українською та англійською мовами
              </p>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
};

export default AIAssistant;