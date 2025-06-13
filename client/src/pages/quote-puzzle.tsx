import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, Trophy, RefreshCw, HelpCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Типи для пазлу цитат
type QuotePiece = {
  id: number;
  text: string;
  originalIndex: number;
  isCorrectPosition: boolean;
};

type Quote = {
  id: number;
  text: string;
  author: string;
  source: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

const QuotePuzzle = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [quotePieces, setQuotePieces] = useState<QuotePiece[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  const maxScore = 100;
  const hintPenalty = 10;

  // Підготовка цитат
  useEffect(() => {
    // Зразки цитат з української літератури для гри
    const sampleQuotes: Quote[] = [
      {
        id: 1,
        text: "Якби ви вчились так, як треба, то й мудрість би була своя.",
        author: "Тарас Шевченко",
        source: "І мертвим, і живим, і ненародженим...",
        difficulty: 'easy'
      },
      {
        id: 2,
        text: "Contra spem spero! Без надії сподіваюсь!",
        author: "Леся Українка",
        source: "Contra spem spero",
        difficulty: 'easy'
      },
      {
        id: 3,
        text: "Лиш боротись — значить жить! Вічний революціонер — Дух, що тіло рве до бою...",
        author: "Іван Франко",
        source: "Гімн",
        difficulty: 'medium'
      },
      {
        id: 4,
        text: "Страшні слова, коли вони мовчать, коли вони зненацька причаїлись, коли не знаєш, з чого їх почать...",
        author: "Ліна Костенко",
        source: "Страшні слова, коли вони мовчать",
        difficulty: 'medium'
      },
      {
        id: 5,
        text: "Книги — морська глибина: хто в них пірне аж до дна, той, хоч і труду мав досить, дивнії перли виносить.",
        author: "Іван Франко",
        source: "Ой ти, дівчино, з горіха зерня",
        difficulty: 'hard'
      },
      {
        id: 6,
        text: "Ну що б, здавалося, слова... Слова та голос — більш нічого. А серце б'ється-ожива, як їх почує!",
        author: "Тарас Шевченко",
        source: "Ну що б, здавалося, слова...",
        difficulty: 'medium'
      },
      {
        id: 7,
        text: "Борітеся — поборете, Вам Бог помагає! За вас правда, за вас слава І воля святая!",
        author: "Тарас Шевченко",
        source: "Кавказ",
        difficulty: 'medium'
      },
      {
        id: 8,
        text: "Можна все на світі вибирати, сину, вибрати не можна тільки Батьківщину.",
        author: "Василь Симоненко",
        source: "Лебеді материнства",
        difficulty: 'easy'
      },
      {
        id: 9,
        text: "І все на світі треба пережити. І кожен фініш — це, по суті, старт. І наперед не треба ворожити...",
        author: "Ліна Костенко",
        source: "І все на світі треба пережити",
        difficulty: 'hard'
      },
      {
        id: 10,
        text: "Не бійтесь заглядати у словник: Це пишний яр, а не сумне провалля.",
        author: "Максим Рильський",
        source: "Мова",
        difficulty: 'easy'
      }
    ];

    setQuotes(sampleQuotes);
    setIsLoading(false);
  }, []);

  // Ініціалізація гри з новою цитатою
  const initQuotePuzzle = useCallback(() => {
    if (quotes.length === 0) return;

    const currentQuote = quotes[currentQuoteIndex];
    
    // Розбиваємо цитату на логічні частини (речення або фрази)
    let pieces: string[] = [];
    
    // Спочатку розбиваємо за розділовими знаками, зберігаючи їх у частинах
    const parts = currentQuote.text.split(/([,;:.!?] )/g);
    let tempPiece = '';
    
    for (let i = 0; i < parts.length; i++) {
      tempPiece += parts[i];
      
      // Якщо закінчується розділовим знаком або це останній елемент
      if (parts[i].match(/[,;:.!?] $/) || i === parts.length - 1) {
        // Якщо це надто коротка частина, об'єднаємо з наступною
        if (tempPiece.length < 10 && i < parts.length - 2) {
          continue;
        }
        pieces.push(tempPiece.trim());
        tempPiece = '';
      }
    }
    
    // Якщо залишились незавершені частини
    if (tempPiece.length > 0) {
      pieces.push(tempPiece.trim());
    }
    
    // Для коротких цитат, розбиваємо на слова
    if (pieces.length < 3) {
      pieces = currentQuote.text.split(' ');
      // Групуємо слова, щоб отримати 3-6 фрагментів
      const pieceSize = Math.max(1, Math.ceil(pieces.length / Math.min(pieces.length, 5)));
      const regroupedPieces: string[] = [];
      
      for (let i = 0; i < pieces.length; i += pieceSize) {
        regroupedPieces.push(pieces.slice(i, i + pieceSize).join(' '));
      }
      
      pieces = regroupedPieces;
    }
    
    // Створюємо масив об'єктів частин цитати
    const newQuotePieces: QuotePiece[] = pieces.map((text, index) => ({
      id: index,
      text,
      originalIndex: index,
      isCorrectPosition: false
    }));
    
    // Перемішуємо частини цитати
    const shuffledPieces = [...newQuotePieces].sort(() => Math.random() - 0.5);
    
    setQuotePieces(shuffledPieces);
    setGameCompleted(false);
    setScore(0);
    setAttempts(0);
    setHintsUsed(0);
    setShowHelp(false);
  }, [quotes, currentQuoteIndex]);

  // Ініціалізація гри при завантаженні
  useEffect(() => {
    if (!isLoading) {
      initQuotePuzzle();
    }
  }, [isLoading, initQuotePuzzle]);

  // Обробка вибору фрагмента цитати
  const handlePieceSelection = (index: number) => {
    if (gameCompleted) return;
    
    if (selectedPieceIndex === null) {
      // Вибираємо перший фрагмент
      setSelectedPieceIndex(index);
    } else if (selectedPieceIndex === index) {
      // Знімаємо виділення при повторному кліку
      setSelectedPieceIndex(null);
    } else {
      // Міняємо місцями два вибрані фрагменти
      setAttempts(prev => prev + 1);
      
      const newPieces = [...quotePieces];
      const temp = newPieces[selectedPieceIndex];
      newPieces[selectedPieceIndex] = newPieces[index];
      newPieces[index] = temp;
      
      // Перевіряємо правильність позицій
      const updatedPieces = newPieces.map((piece, i) => ({
        ...piece,
        isCorrectPosition: piece.originalIndex === i
      }));
      
      setQuotePieces(updatedPieces);
      setSelectedPieceIndex(null);
      
      // Перевіряємо, чи всі фрагменти на своїх місцях
      const allCorrect = updatedPieces.every(piece => piece.isCorrectPosition);
      if (allCorrect) {
        completeGame();
      }
    }
  };

  // Завершення гри
  const completeGame = async () => {
    setGameCompleted(true);
    
    // Обчислення фінального рахунку
    const baseScore = Math.max(10, maxScore - attempts * 5 - hintsUsed * hintPenalty);
    const finalScore = Math.min(maxScore, baseScore);
    setScore(finalScore);
    
    toast({
      title: "Вітаємо!",
      description: `Ви успішно склали цитату! Ваш рахунок: ${finalScore} балів.`,
      variant: "default",
    });
    
    // Зберігаємо результат гри
    if (user) {
      try {
        await apiRequest('POST', '/api/user/game-results', {
          userId: user.id,
          gameType: 'Пазл цитат',
          score: finalScore,
          completed: true,
          metadata: {
            quoteId: quotes[currentQuoteIndex].id,
            attempts,
            hintsUsed
          }
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/user/game-results'] });
        
      } catch (error) {
        console.error('Помилка при збереженні результату:', error);
      }
    }
  };

  // Показати підказку: повернути один шматок на правильне місце
  const useHint = () => {
    if (gameCompleted) return;
    
    setHintsUsed(prev => prev + 1);
    
    const incorrectPieces = quotePieces.filter((piece, index) => !piece.isCorrectPosition);
    if (incorrectPieces.length === 0) return;
    
    // Вибираємо випадковий неправильний шматок
    const randomIncorrectPiece = incorrectPieces[Math.floor(Math.random() * incorrectPieces.length)];
    const currentIndex = quotePieces.findIndex(p => p.id === randomIncorrectPiece.id);
    const correctIndex = randomIncorrectPiece.originalIndex;
    
    // Міняємо місцями
    const newPieces = [...quotePieces];
    const temp = newPieces[currentIndex];
    newPieces[currentIndex] = newPieces[correctIndex];
    newPieces[correctIndex] = temp;
    
    // Перевіряємо правильність позицій
    const updatedPieces = newPieces.map((piece, i) => ({
      ...piece,
      isCorrectPosition: piece.originalIndex === i
    }));
    
    setQuotePieces(updatedPieces);
    setSelectedPieceIndex(null);
    
    toast({
      title: "Підказка використана",
      description: "Один фрагмент повернуто на правильне місце",
      variant: "default",
    });
    
    // Перевіряємо, чи всі фрагменти на своїх місцях
    const allCorrect = updatedPieces.every(piece => piece.isCorrectPosition);
    if (allCorrect) {
      completeGame();
    }
  };

  // Перейти до наступної цитати
  const nextQuote = () => {
    const nextIndex = (currentQuoteIndex + 1) % quotes.length;
    setCurrentQuoteIndex(nextIndex);
    setGameCompleted(false);
    setScore(0);
    setAttempts(0);
    setHintsUsed(0);
    setShowHelp(false);
    setSelectedPieceIndex(null);
  };

  // Завантаження
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle className="text-center">Пазл цитат</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <p>Завантаження цитат...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuote = quotes[currentQuoteIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 py-10">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => navigate('/games')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-center text-xl md:text-2xl">Пазл цитат</CardTitle>
            <div className="w-9"> {/* Порожній div для вирівнювання */}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {!gameCompleted && (
              <div className="flex flex-col md:flex-row md:justify-between space-y-2 md:space-y-0 items-start md:items-center mb-4">
                <Badge variant="outline" className="px-3 py-1 mb-2 md:mb-0">
                  Складність: {currentQuote.difficulty === 'easy' ? 'Легка' : 
                              currentQuote.difficulty === 'medium' ? 'Середня' : 'Складна'}
                </Badge>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowHelp(!showHelp)}
                    className="flex-1 md:flex-auto"
                  >
                    <HelpCircle className="h-4 w-4 mr-1" />
                    Допомога
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={useHint}
                    className="flex-1 md:flex-auto"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Підказка ({hintsUsed})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={initQuotePuzzle}
                    className="flex-1 md:flex-auto"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Перемішати
                  </Button>
                </div>
              </div>
            )}

            {showHelp && !gameCompleted && (
              <Alert>
                <AlertTitle>Як грати</AlertTitle>
                <AlertDescription>
                  <p>1. Натискайте на фрагменти цитати, щоб вибрати їх</p>
                  <p>2. Виберіть спочатку один, а потім другий фрагмент, щоб поміняти їх місцями</p>
                  <p>3. Складіть цитату у правильному порядку</p>
                  <p>4. Використовуйте підказки, якщо потрібна допомога (зменшує бали)</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Відображення фрагментів цитати */}
            <div className="grid grid-cols-1 gap-2 mt-4">
              {quotePieces.map((piece, index) => (
                <div
                  key={piece.id}
                  className={`p-3 rounded-md border-2 cursor-pointer transition-all
                    ${piece.isCorrectPosition ? 'bg-green-100 dark:bg-green-900/30 border-green-400' : 'bg-card border-border'}
                    ${selectedPieceIndex === index ? 'ring-2 ring-primary border-primary' : ''}
                    ${gameCompleted ? 'cursor-default' : 'hover:border-primary'}
                    active:bg-primary/10 touch-manipulation`}
                  onClick={() => !gameCompleted && handlePieceSelection(index)}
                >
                  <p className="text-md md:text-lg select-none">{piece.text}</p>
                </div>
              ))}
            </div>

            {gameCompleted && (
              <div className="mt-6 space-y-4">
                <Alert className="bg-green-100 dark:bg-green-900/30 border-green-400">
                  <AlertTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                    Вітаємо! Цитату складено правильно
                  </AlertTitle>
                  <AlertDescription>
                    <p className="mt-2">Автор: <strong>{currentQuote.author}</strong></p>
                    <p>Джерело: <strong>{currentQuote.source}</strong></p>
                    <div className="mt-2">
                      <p>Ваш рахунок: <strong>{score} балів</strong></p>
                      <p>Кількість спроб: {attempts}</p>
                      <p>Використано підказок: {hintsUsed}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {gameCompleted && (
            <div className="w-full flex flex-col sm:flex-row gap-2 sm:justify-between">
              <Button 
                variant="outline" 
                onClick={initQuotePuzzle}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Спробувати ще раз
              </Button>
              
              <Button 
                onClick={nextQuote}
                className="w-full sm:w-auto"
              >
                Наступна цитата
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
          
          {!gameCompleted && (
            <div className="w-full">
              <p className="text-sm text-muted-foreground">
                Спроб: {attempts} • Підказок: {hintsUsed}
              </p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuotePuzzle;