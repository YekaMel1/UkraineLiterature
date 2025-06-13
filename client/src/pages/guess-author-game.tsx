import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Trophy, RefreshCw, Clock, BookOpenCheck, Quote } from "lucide-react";
import { shuffle } from "lodash";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useBooks } from "@/lib/hooks";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Тип для питання у грі
type GameQuestion = {
  quoteText: string;
  authorId: number;
  authorName: string;
  options: { id: number; name: string }[];
};

export default function GuessAuthorGame() {
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Завантажуємо всі книги щоб отримати цитати і авторів
  const { data: books, isLoading: loadingBooks } = useBooks();
  
  // Підготовка питань для гри
  useEffect(() => {
    if (!loadingBooks && books) {
      // Фільтруємо книги які мають цитати
      const booksWithQuotes = books.filter(book => book.quotes && book.quotes.length > 0);
      
      if (booksWithQuotes.length === 0) {
        toast({
          title: "Помилка",
          description: "Не знайдено жодної цитати для гри.",
          variant: "destructive",
        });
        setLocation("/games");
        return;
      }
      
      // Створюємо список всіх авторів для варіантів відповідей
      const allAuthors = books.map(book => ({
        id: book.author.id,
        name: book.author.name
      })).filter((author, index, self) => 
        // Видаляємо дублікати авторів
        index === self.findIndex(a => a.id === author.id)
      );
      
      // Підготовка питань
      const gameQuestions: GameQuestion[] = [];
      
      // Для кожної книги з цитатами
      booksWithQuotes.forEach(book => {
        if (book.quotes) {
          // Для кожної цитати створюємо питання
          book.quotes.forEach(quote => {
            // Для варіантів відповідей беремо справжнього автора і 3 випадкових
            const otherAuthors = shuffle(
              allAuthors.filter(author => author.id !== book.author.id)
            ).slice(0, 3);
            
            const options = shuffle([
              { id: book.author.id, name: book.author.name },
              ...otherAuthors
            ]);
            
            gameQuestions.push({
              quoteText: quote,
              authorId: book.author.id,
              authorName: book.author.name,
              options
            });
          });
        }
      });
      
      // Обираємо випадкові 10 питань
      const selectedQuestions = shuffle(gameQuestions).slice(0, 10);
      setQuestions(selectedQuestions);
      setIsLoading(false);
      setTimerActive(true);
    }
  }, [books, loadingBooks, setLocation, toast]);
  
  // Таймер для відповіді
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (timerActive && timeLeft > 0 && !answered) {
      timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !answered) {
      handleAnswer();
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timerActive, timeLeft, answered]);
  
  // Обробка відповіді
  const handleAnswer = () => {
    setAnswered(true);
    setTimerActive(false);
    
    const currentQuestion = questions[currentQuestionIndex];
    
    if (selectedOption === currentQuestion.authorId) {
      setScore(prev => prev + 1);
      toast({
        title: "Правильно!",
        description: `Це цитата ${currentQuestion.authorName}`,
      });
    } else {
      toast({
        title: "Неправильно",
        description: `Правильна відповідь: ${currentQuestion.authorName}`,
        variant: "destructive",
      });
    }
  };
  
  // Збереження результату гри
  const saveGameResult = async () => {
    if (!user || resultSaved) return;
    
    try {
      const finalScore = Math.round((score / questions.length) * 100);
      
      await apiRequest('POST', '/api/user/game-results', {
        userId: user.id,
        gameType: 'guess-author-game',
        score: finalScore,
        completed: true
      });
      
      setResultSaved(true);
      
      queryClient.invalidateQueries({ queryKey: ['/api/user/test-results'] });
      
      toast({
        title: "Результат збережено",
        description: "Ваш результат гри успішно збережено у профілі",
      });
    } catch (error) {
      console.error('Помилка при збереженні результату:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти результат гри",
        variant: "destructive",
      });
    }
  };

  // Перехід до наступного питання
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
      setTimeLeft(30);
      setTimerActive(true);
    } else {
      setGameCompleted(true);
      // Автоматично зберігаємо результат при завершенні гри
      if (user) {
        saveGameResult();
      }
    }
  };
  
  // Перезапуск гри
  const restartGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setAnswered(false);
    setGameCompleted(false);
    setTimeLeft(30);
    setTimerActive(true);
    setResultSaved(false);
    setQuestions(shuffle(questions));
  };
  
  // Відображення завантаження
  if (isLoading) {
    return (
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 sm:h-10 w-20 sm:w-24" />
          <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
        </div>
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <Skeleton className="h-12 sm:h-16 w-full" />
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Skeleton className="h-16 sm:h-20 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 sm:h-8 w-full" />
              <Skeleton className="h-6 sm:h-8 w-full" />
              <Skeleton className="h-6 sm:h-8 w-full" />
              <Skeleton className="h-6 sm:h-8 w-full" />
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6">
            <Skeleton className="h-8 sm:h-10 w-28 sm:w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Відображення результатів гри
  if (gameCompleted) {
    const finalScore = (score / questions.length) * 100;
    let resultMessage = "";
    
    if (finalScore >= 90) {
      resultMessage = "Чудово! Ви справжній знавець української літератури!";
    } else if (finalScore >= 70) {
      resultMessage = "Дуже добре! Ви гарно знаєте українських авторів.";
    } else if (finalScore >= 50) {
      resultMessage = "Непогано! Є перспективи для вдосконалення.";
    } else {
      resultMessage = "Варто більше читати українську літературу.";
    }
    
    return (
      <div className="p-3 sm:p-4">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-center text-lg sm:text-xl">Результати гри</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="flex flex-col items-center justify-center p-2 sm:p-4">
              <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-500 mb-2" />
              <h2 className="text-xl sm:text-2xl font-bold text-center">
                Ваш результат: {score} з {questions.length}
              </h2>
              <p className="text-neutral-600 mt-2 text-center text-sm sm:text-base">{resultMessage}</p>
              
              <div className="w-full mt-4">
                <Progress value={finalScore} className="h-2 sm:h-3" />
                <p className="text-xs sm:text-sm text-neutral-500 mt-1 text-center">
                  {finalScore.toFixed(0)}% правильних відповідей
                </p>
              </div>
              
              {user && (
                <div className="flex items-center justify-center mt-3">
                  <p className={`text-xs sm:text-sm ${resultSaved ? 'text-green-600 dark:text-green-500' : 'text-neutral-500'}`}>
                    {resultSaved 
                      ? "✓ Результат збережено у вашому профілі" 
                      : "Збереження результату..."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 sm:p-6">
            <Button variant="outline" onClick={() => setLocation("/games")} 
              className="w-full sm:w-auto text-xs sm:text-sm">
              <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> До списку ігор
            </Button>
            <Button onClick={restartGame} className="bg-primary text-white w-full sm:w-auto text-xs sm:text-sm">
              <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Спробувати ще раз
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Поточне питання
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="p-3 sm:p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation("/games")}
          className="text-xs sm:text-sm"
        >
          <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Назад
        </Button>
        <h1 className="text-base sm:text-lg font-medium">Вгадай автора</h1>
      </div>
      
      <div className="flex justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full">
          <BookOpenCheck className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500 mr-1.5" />
          <span className="text-xs sm:text-sm font-medium">
            Питання {currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
        
        <div className={`flex items-center px-3 py-1.5 rounded-full ${
          timeLeft <= 10 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-neutral-100 dark:bg-neutral-800'
        }`}>
          <Clock className={`h-4 w-4 sm:h-5 sm:w-5 ${timeLeft <= 10 ? 'text-red-500 dark:text-red-400' : 'text-neutral-500'} mr-1.5`} />
          <span className={`text-xs sm:text-sm font-medium ${timeLeft <= 10 ? 'text-red-500 dark:text-red-400' : ''}`}>
            {timeLeft} сек
          </span>
        </div>
      </div>
      
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-start space-x-2">
            <Quote className="h-5 w-5 sm:h-6 sm:w-6 text-teal-500 flex-shrink-0 mt-1" />
            <CardTitle className="text-lg sm:text-xl">Хто є автором цієї цитати?</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          <blockquote className="pl-3 sm:pl-4 border-l-4 border-teal-500 italic text-sm sm:text-base">
            "{currentQuestion.quoteText}"
          </blockquote>
          
          <RadioGroup 
            value={selectedOption?.toString() || ""} 
            onValueChange={(value) => setSelectedOption(parseInt(value))}
            disabled={answered}
            className="space-y-2 sm:space-y-3"
          >
            {currentQuestion.options.map((option) => (
              <div 
                key={option.id} 
                className={`flex items-center space-x-2 p-3 sm:p-4 rounded-lg border ${
                  answered 
                    ? option.id === currentQuestion.authorId 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30' 
                      : selectedOption === option.id 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/30' 
                        : 'border-neutral-200 dark:border-neutral-700' 
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-teal-200 dark:hover:border-teal-700 cursor-pointer active:bg-neutral-100 dark:active:bg-neutral-800'
                } touch-manipulation`}
                onClick={() => !answered && setSelectedOption(option.id)}
              >
                <RadioGroupItem 
                  value={option.id.toString()} 
                  id={option.id.toString()} 
                  disabled={answered}
                  className="scale-90 sm:scale-100"
                />
                <Label 
                  htmlFor={option.id.toString()} 
                  className={`cursor-pointer w-full text-sm sm:text-base select-none ${
                    answered && option.id === currentQuestion.authorId 
                      ? 'font-medium text-green-700 dark:text-green-400' 
                      : answered && selectedOption === option.id 
                        ? 'text-red-700 dark:text-red-400' 
                        : ''
                  }`}
                >
                  {option.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 sm:p-6">
          <div className="flex items-center self-start sm:self-auto px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mr-1.5" />
            <span className="text-xs sm:text-sm font-medium">Рахунок: {score}</span>
          </div>
          
          {!answered ? (
            <Button 
              onClick={handleAnswer} 
              disabled={selectedOption === null}
              className="bg-teal-500 hover:bg-teal-600 text-white w-full sm:w-auto text-sm"
            >
              Відповісти
            </Button>
          ) : (
            <Button 
              onClick={handleNextQuestion}
              className="bg-primary text-white w-full sm:w-auto text-sm"
            >
              {currentQuestionIndex < questions.length - 1 ? "Наступне питання" : "Завершити гру"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}