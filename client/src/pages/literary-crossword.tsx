import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, Trophy, RefreshCw, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Визначення типів для кросворду
type CrosswordCell = {
  letter: string;
  isRevealed: boolean;
  rowIndex: number;
  colIndex: number;
  wordIndex?: number;
  clueNumber?: number;
  isStartOfWord?: boolean;
  orientation?: 'across' | 'down';
};

type CrosswordWord = {
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  orientation: 'across' | 'down';
  number: number;
};

type UserInput = {
  rowIndex: number;
  colIndex: number;
  value: string;
};

const LiteraryCrossword = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [grid, setGrid] = useState<CrosswordCell[][]>([]);
  const [words, setWords] = useState<CrosswordWord[]>([]);
  const [userInputs, setUserInputs] = useState<UserInput[]>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [selectedOrientation, setSelectedOrientation] = useState<'across' | 'down'>('across');
  const [gameCompleted, setGameCompleted] = useState(false);
  const [correctWords, setCorrectWords] = useState<number[]>([]);

  // Встановлення даних для кросворду
  useEffect(() => {
    const initCrossword = () => {
      // Літературні кросворд - слова та підказки (спрощений)
      const crosswordData: CrosswordWord[] = [
        { word: "БАЛАДА", clue: "Ліро-епічний твір, часто фантастичного змісту", startRow: 0, startCol: 0, orientation: 'across', number: 1 },
        { word: "БАЙКА", clue: "Алегоричний твір повчального характеру", startRow: 0, startCol: 0, orientation: 'down', number: 1 },
        { word: "АВТОР", clue: "Творець художнього твору", startRow: 2, startCol: 2, orientation: 'across', number: 2 },
        { word: "ДРАМА", clue: "Літературний твір, призначений для театру", startRow: 4, startCol: 0, orientation: 'across', number: 3 },
        { word: "ОБРАЗ", clue: "Художнє відображення людини в літературі", startRow: 2, startCol: 2, orientation: 'down', number: 2 },
        { word: "РОМАН", clue: "Великий епічний твір", startRow: 0, startCol: 4, orientation: 'down', number: 4 },
        { word: "КАЗКА", clue: "Розповідний народнопоетичний твір", startRow: 6, startCol: 0, orientation: 'across', number: 5 },
        { word: "ПОЕМА", clue: "Великий віршований твір", startRow: 4, startCol: 2, orientation: 'down', number: 6 }
      ];

      // Створення порожньої сітки
      const maxRow = Math.max(...crosswordData.map(w => 
        w.orientation === 'across' 
          ? w.startRow 
          : w.startRow + w.word.length - 1
      ));
      
      const maxCol = Math.max(...crosswordData.map(w => 
        w.orientation === 'across' 
          ? w.startCol + w.word.length - 1 
          : w.startCol
      ));
      
      const newGrid: CrosswordCell[][] = Array(maxRow + 1).fill(null).map(() => 
        Array(maxCol + 1).fill(null).map(() => ({
          letter: '',
          isRevealed: false,
          rowIndex: 0,
          colIndex: 0
        }))
      );

      // Заповнення сітки літерами
      crosswordData.forEach(word => {
        for (let i = 0; i < word.word.length; i++) {
          const row = word.orientation === 'across' ? word.startRow : word.startRow + i;
          const col = word.orientation === 'across' ? word.startCol + i : word.startCol;
          
          if (row <= maxRow && col <= maxCol) {
            newGrid[row][col] = {
              letter: word.word[i],
              isRevealed: false,
              rowIndex: row,
              colIndex: col,
              isStartOfWord: i === 0,
              clueNumber: i === 0 ? word.number : undefined,
              orientation: i === 0 ? word.orientation : undefined
            };
          }
        }
      });

      // Заповнення порожніх клітинок
      for (let row = 0; row <= maxRow; row++) {
        for (let col = 0; col <= maxCol; col++) {
          if (!newGrid[row][col].letter) {
            newGrid[row][col] = {
              letter: '',
              isRevealed: true, // Порожні клітинки відразу відображаються
              rowIndex: row,
              colIndex: col
            };
          }
        }
      }

      setGrid(newGrid);
      setWords(crosswordData);
      setIsLoading(false);
    };

    // Імітація завантаження даних
    const timer = setTimeout(() => {
      initCrossword();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Обробка введення користувача
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    // Перевіряємо, що введено тільки один символ
    if (value.length > 1) value = value.charAt(value.length - 1);
    // Переводимо в верхній регістр
    value = value.toUpperCase();
    
    // Оновлюємо стан введених даних
    setUserInputs(prev => {
      const existingInputIndex = prev.findIndex(
        input => input.rowIndex === rowIndex && input.colIndex === colIndex
      );
      
      if (existingInputIndex > -1) {
        // Оновлення існуючого введення
        const updatedInputs = [...prev];
        updatedInputs[existingInputIndex].value = value;
        return updatedInputs;
      } else {
        // Додавання нового введення
        return [...prev, { rowIndex, colIndex, value }];
      }
    });

    // Встановлюємо поточну вибрану клітинку (для коректної роботи переміщення)
    if (!selectedCell || selectedCell.row !== rowIndex || selectedCell.col !== colIndex) {
      setSelectedCell({ row: rowIndex, col: colIndex });
    }

    // Визначаємо орієнтацію слова, якщо не визначено
    if (!selectedOrientation) {
      // Спочатку перевіряємо горизонтальну орієнтацію
      const hasAcross = words.some(word => 
        word.orientation === 'across' && 
        rowIndex === word.startRow &&
        colIndex >= word.startCol && 
        colIndex < word.startCol + word.word.length
      );

      if (hasAcross) {
        setSelectedOrientation('across');
      } else {
        setSelectedOrientation('down');
      }
    }

    // Обробка переміщення до наступної клітинки, але тільки якщо введено літеру
    if (value && value.trim() !== '') {
      // Використовуємо setTimeout для переміщення після рендеру
      setTimeout(() => {
        moveToNextCell();
        
        // Перевірка завершення кросворду
        checkCrosswordCompletion();
      }, 50);
    }
  };

  // Перевірка завершення кросворду
  const checkCrosswordCompletion = () => {
    let allCorrect = true;
    const newCorrectWords: number[] = [];
    
    words.forEach(word => {
      let isWordCorrect = true;
      
      for (let i = 0; i < word.word.length; i++) {
        const row = word.orientation === 'across' ? word.startRow : word.startRow + i;
        const col = word.orientation === 'across' ? word.startCol + i : word.startCol;
        
        const userInput = userInputs.find(
          input => input.rowIndex === row && input.colIndex === col
        );
        
        if (!userInput || userInput.value !== word.word[i]) {
          isWordCorrect = false;
          allCorrect = false;
          break;
        }
      }
      
      if (isWordCorrect) {
        newCorrectWords.push(word.number);
      }
    });
    
    setCorrectWords(newCorrectWords);
    
    if (allCorrect) {
      setGameCompleted(true);
      toast({
        title: "Вітаємо!",
        description: "Ви успішно розгадали кросворд!",
      });
    }
  };

  // Вибір клітинки
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    if (grid[rowIndex][colIndex].isRevealed) return;
    
    // Змінити орієнтацію, якщо ми натискаємо на ту ж клітинку
    if (selectedCell?.row === rowIndex && selectedCell?.col === colIndex) {
      setSelectedOrientation(prev => prev === 'across' ? 'down' : 'across');
    } else {
      setSelectedCell({ row: rowIndex, col: colIndex });
      
      // Визначити найкращу орієнтацію
      let hasAcross = false;
      let hasDown = false;
      
      if (colIndex > 0 && grid[rowIndex][colIndex-1].letter) hasAcross = true;
      if (colIndex < grid[rowIndex].length-1 && grid[rowIndex][colIndex+1].letter) hasAcross = true;
      
      if (rowIndex > 0 && grid[rowIndex-1][colIndex].letter) hasDown = true;
      if (rowIndex < grid.length-1 && grid[rowIndex+1][colIndex].letter) hasDown = true;
      
      // Якщо обидві орієнтації можливі, вибираємо ту, що була вибрана раніше
      if (hasAcross && hasDown) {
        // Залишаємо поточну орієнтацію
      } else if (hasAcross) {
        setSelectedOrientation('across');
      } else if (hasDown) {
        setSelectedOrientation('down');
      }
    }
  };

  // Переміщення до наступної клітинки
  const moveToNextCell = () => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    let nextRow = row;
    let nextCol = col;
    
    if (selectedOrientation === 'across') {
      // Рухаємося вправо для горизонтального слова
      nextCol += 1;
      // Перевірка, чи наступна клітинка валідна
      while (nextCol < grid[row].length) {
        // Якщо це клітинка з буквою і не розкрита - переходимо до неї
        if (grid[nextRow][nextCol].letter && !grid[nextRow][nextCol].isRevealed) {
          setSelectedCell({ row: nextRow, col: nextCol });
          return;
        }
        // Інакше, якщо це порожня клітинка або вже розкрита - шукаємо далі
        nextCol++;
      }
    } else {
      // Рухаємося вниз для вертикального слова
      nextRow += 1;
      // Перевірка, чи наступна клітинка валідна
      while (nextRow < grid.length) {
        // Якщо це клітинка з буквою і не розкрита - переходимо до неї
        if (grid[nextRow][nextCol].letter && !grid[nextRow][nextCol].isRevealed) {
          setSelectedCell({ row: nextRow, col: nextCol });
          return;
        }
        // Інакше, якщо це порожня клітинка або вже розкрита - шукаємо далі
        nextRow++;
      }
    }
  };

  // Обробка нажаття клавіш
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      moveToNextCell();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSelectedOrientation('across');
      if (colIndex < grid[rowIndex].length - 1) {
        setSelectedCell({ row: rowIndex, col: colIndex + 1 });
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSelectedOrientation('across');
      if (colIndex > 0) {
        setSelectedCell({ row: rowIndex, col: colIndex - 1 });
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedOrientation('down');
      if (rowIndex < grid.length - 1) {
        setSelectedCell({ row: rowIndex + 1, col: colIndex });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedOrientation('down');
      if (rowIndex > 0) {
        setSelectedCell({ row: rowIndex - 1, col: colIndex });
      }
    }
  };

  // Очищення кросворду (скидання введених значень)
  const handleClearCrossword = () => {
    setUserInputs([]);
    setGameCompleted(false);
    setCorrectWords([]);
  };

  // Отримання введеного значення для клітинки
  const getCellValue = (rowIndex: number, colIndex: number) => {
    const input = userInputs.find(
      input => input.rowIndex === rowIndex && input.colIndex === colIndex
    );
    return input ? input.value : '';
  };

  // Відображення завантаження
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // Відображення результатів гри
  if (gameCompleted) {
    return (
      <div className="p-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">Вітаємо!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center p-4">
              <Trophy className="h-16 w-16 text-yellow-500 mb-2" />
              <h2 className="text-2xl font-bold">
                Ви розгадали кросворд!
              </h2>
              <p className="text-neutral-500 mt-2">
                Ви успішно розгадали всі слова в літературному кросворді.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/games")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> До списку ігор
            </Button>
            <Button onClick={handleClearCrossword}>
              <RefreshCw className="mr-2 h-4 w-4" /> Грати ще раз
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate("/games")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад
        </Button>
        <h1 className="text-lg font-medium">Літературний кросворд</h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        {/* Сітка кросворду */}
        <div className="w-full md:w-1/2 overflow-x-auto">
          <div 
            className="grid mx-auto" 
            style={{ 
              gridTemplateRows: `repeat(${grid.length}, minmax(35px, 1fr))`,
              gridTemplateColumns: `repeat(${grid[0].length}, minmax(35px, 1fr))`,
              gap: '1px',
              maxWidth: '100%'
            }}
          >
            {grid.map((row, rowIndex) => 
              row.map((cell, colIndex) => {
                const isCellSelected = 
                  selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                const isInSelectedWord = selectedCell && selectedOrientation && 
                  ((selectedOrientation === 'across' && selectedCell.row === rowIndex && 
                    ((cell.letter && !cell.isRevealed) || getCellValue(rowIndex, colIndex))) ||
                  (selectedOrientation === 'down' && selectedCell.col === colIndex && 
                    ((cell.letter && !cell.isRevealed) || getCellValue(rowIndex, colIndex))));
                    
                return (
                  <div 
                    key={`${rowIndex}-${colIndex}`}
                    className={`relative flex items-center justify-center border-2 ${
                      cell.isRevealed ? 'bg-neutral-300 border-neutral-400' : 
                      isCellSelected ? 'bg-primary-100 border-primary shadow-sm' :
                      isInSelectedWord ? 'bg-primary-50 border-primary-200' :
                      'bg-neutral-100 border-neutral-300'
                    } ${cell.isRevealed ? 'pointer-events-none' : 'cursor-pointer'} min-w-[30px] sm:min-w-[35px] md:min-w-[40px] min-h-[30px] sm:min-h-[35px] md:min-h-[40px]`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {cell.clueNumber && (
                      <span className="absolute top-0 left-1 text-xs text-neutral-500">
                        {cell.clueNumber}
                      </span>
                    )}
                    
                    {!cell.isRevealed && (
                      <Input
                        value={getCellValue(rowIndex, colIndex)}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                        className={`w-[30px] h-[30px] sm:w-[35px] sm:h-[35px] md:w-10 md:h-10 text-center p-0 border-0 focus:ring-0 font-medium text-base sm:text-lg uppercase ${
                          isCellSelected ? 'bg-primary-100' : 
                          isInSelectedWord ? 'bg-primary-50' : 'bg-neutral-100'
                        }`}
                        maxLength={1}
                        autoFocus={isCellSelected}
                        disabled={cell.isRevealed}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          <div className="flex justify-between mt-4">
            <Button 
              variant="outline" 
              onClick={handleClearCrossword}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Очистити
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                toast({
                  title: "Підказка",
                  description: "Натисніть на пусту клітинку, щоб почати вводити. Використовуйте стрілки для переміщення.",
                });
              }}
            >
              <HelpCircle className="mr-2 h-4 w-4" /> Підказка
            </Button>
          </div>
        </div>
        
        {/* Підказки для кросворду */}
        <div className="md:w-1/2">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">По горизонталі:</h3>
              <ul className="space-y-2">
                {words.filter(w => w.orientation === 'across').map(word => (
                  <li 
                    key={`across-${word.number}`}
                    className={`${correctWords.includes(word.number) ? 'text-green-600' : ''}`}
                  >
                    <span className="font-medium">{word.number}.</span> {word.clue}
                    {correctWords.includes(word.number) && (
                      <Check className="inline-block ml-2 h-4 w-4 text-green-600" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">По вертикалі:</h3>
              <ul className="space-y-2">
                {words.filter(w => w.orientation === 'down').map(word => (
                  <li 
                    key={`down-${word.number}`}
                    className={`${correctWords.includes(word.number) ? 'text-green-600' : ''}`}
                  >
                    <span className="font-medium">{word.number}.</span> {word.clue}
                    {correctWords.includes(word.number) && (
                      <Check className="inline-block ml-2 h-4 w-4 text-green-600" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiteraryCrossword;