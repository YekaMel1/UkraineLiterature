import { type TestWithBook } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Star, Award, Bookmark, Book, BookOpen, BookText, LucideIcon, Quote, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

interface TestCardProps {
  test: TestWithBook;
  onStart?: () => void;
  compact?: boolean;
}

// Функція для отримання кольору залежно від тесту
const getTestColorScheme = (testId: number, testType: string) => {
  // Створюємо набір різних кольорових схем
  const colorSchemes = [
    { bg: "bg-indigo-500", text: "text-indigo-500", button: "bg-indigo-500 hover:bg-indigo-600" },
    { bg: "bg-emerald-500", text: "text-emerald-500", button: "bg-emerald-500 hover:bg-emerald-600" },
    { bg: "bg-amber-500", text: "text-amber-500", button: "bg-amber-500 hover:bg-amber-600" },
    { bg: "bg-rose-500", text: "text-rose-500", button: "bg-rose-500 hover:bg-rose-600" },
    { bg: "bg-purple-500", text: "text-purple-500", button: "bg-purple-500 hover:bg-purple-600" },
    { bg: "bg-cyan-500", text: "text-cyan-500", button: "bg-cyan-500 hover:bg-cyan-600" },
    { bg: "bg-blue-500", text: "text-blue-500", button: "bg-blue-500 hover:bg-blue-600" },
    { bg: "bg-orange-500", text: "text-orange-500", button: "bg-orange-500 hover:bg-orange-600" },
    { bg: "bg-pink-500", text: "text-pink-500", button: "bg-pink-500 hover:bg-pink-600" },
    { bg: "bg-teal-500", text: "text-teal-500", button: "bg-teal-500 hover:bg-teal-600" },
  ];

  // Використовуємо фіксований колір для кожного id тесту
  if (testType === "quote") {
    return colorSchemes[3]; // rose для цитат
  } else if (testType === "character") {
    return colorSchemes[4]; // purple для персонажів
  } else {
    // Для книжкових тестів використовуємо різні кольори
    const index = testId % colorSchemes.length;
    return colorSchemes[index];
  }
};

const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case "easy": return "text-green-500";
    case "medium": return "text-yellow-500";
    case "hard": return "text-red-500";
    default: return "text-neutral-500";
  }
};

const getDifficultyLabel = (difficulty: string): string => {
  switch (difficulty) {
    case "easy": return "Легкий";
    case "medium": return "Середній";
    case "hard": return "Складний";
    default: return "Невідомо";
  }
};

const TestCard = ({ test, onStart, compact = false }: TestCardProps) => {
  // Отримуємо кольорову схему для поточного тесту
  const colorScheme = getTestColorScheme(test.id, test.testType);
  const [, navigate] = useLocation();
  
  // Вибір іконки залежно від типу тесту
  const getTestIcon = () => {
    if (test.testType === "quote") {
      return <Quote className="h-5 w-5 sm:h-6 sm:w-6 text-white" />;
    } else if (test.testType === "character") {
      return <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />;
    } else {
      return <BookText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />;
    }
  };

  if (compact) {
    return (
      <div className="bg-white rounded overflow-hidden shadow-sm border border-neutral-100 flex mb-4">
        <div className={`w-12 sm:w-16 ${colorScheme.bg} flex items-center justify-center`}>
          {getTestIcon()}
        </div>
        <div className="p-2 sm:p-3 flex-1">
          <h3 className="font-medium text-xs sm:text-sm mb-1">{test.title}</h3>
          <p className="text-xs text-neutral-700 mb-1 sm:mb-2">{test.questionCount} запитань</p>
          <Button 
            variant="default" 
            size="sm" 
            className={`${colorScheme.button} text-white text-xs sm:text-sm h-8 sm:h-9`} 
            onClick={() => onStart ? onStart() : navigate(`/test/${test.id}`)}
          >
            Почати
          </Button>
        </div>
      </div>
    );
  }
  
  // Special test (quote, character, etc)
  if (test.testType !== "book" && test.specialIcon) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex">
          <div className={`w-12 sm:w-16 ${colorScheme.bg} flex items-center justify-center`}>
            {getTestIcon()}
          </div>
          <div className="p-2 sm:p-3 flex-1">
            <div className="flex justify-between items-start">
              <div className="flex-1 mr-2">
                <h3 className="font-medium text-sm sm:text-base mb-1">{test.title}</h3>
                <div className="flex items-center mb-1">
                  <p className="text-xs sm:text-sm text-neutral-700">{test.questionCount} запитань</p>
                  {test.time && (
                    <p className="text-xs sm:text-sm text-neutral-700 ml-2">
                      <span className="inline-block w-1 h-1 bg-gray-300 rounded-full mr-2"></span>
                      {test.time} хв
                    </p>
                  )}
                </div>
                {test.questions && (
                  <p className="text-[10px] sm:text-xs text-neutral-500 mb-1 line-clamp-2">{test.questions}</p>
                )}
                <div className="flex items-center">
                  <Star className={`h-3 w-3 sm:h-4 sm:w-4 ${getDifficultyColor(test.difficulty)}`} />
                  <span className="text-[10px] sm:text-xs ml-1">{getDifficultyLabel(test.difficulty)}</span>
                </div>
              </div>
              <Button 
                variant="default" 
                size="sm" 
                className={`${colorScheme.button} text-white text-xs sm:text-sm h-8 sm:h-9 shrink-0`} 
                onClick={() => {
                console.log("Натиснуто 'Почати тест' для тесту з ID:", test.id);
                if (onStart) {
                  onStart();
                } else {
                  // Використовуємо window.location.href замість navigate для повного перезавантаження сторінки
                  window.location.href = `/test/${test.id}`;
                }
              }}
              >
                Почати
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Standard book test
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex">
        <div className={`w-12 sm:w-16 ${colorScheme.bg} flex items-center justify-center`}>
          {getTestIcon()}
        </div>
        <div className="p-2 sm:p-3 flex-1">
          <div className="flex justify-between items-start">
            <div className="flex-1 mr-2">
              <h3 className="font-medium text-sm sm:text-base mb-1">{test.title}</h3>
              <div className="flex items-center mb-1">
                <p className="text-xs sm:text-sm text-neutral-700">{test.questionCount} запитань</p>
                {test.time && (
                  <p className="text-xs sm:text-sm text-neutral-700 ml-2">
                    <span className="inline-block w-1 h-1 bg-gray-300 rounded-full mr-2"></span>
                    {test.time} хв
                  </p>
                )}
              </div>
              {test.questions && (
                <p className="text-[10px] sm:text-xs text-neutral-500 mb-1 line-clamp-2">{test.questions}</p>
              )}
              <div className="flex items-center">
                <Star className={`h-3 w-3 sm:h-4 sm:w-4 ${getDifficultyColor(test.difficulty)}`} />
                <span className="text-[10px] sm:text-xs ml-1">{getDifficultyLabel(test.difficulty)}</span>
              </div>
            </div>
            <Button 
              variant="default" 
              size="sm" 
              className={`${colorScheme.button} text-white text-xs sm:text-sm h-8 sm:h-9 shrink-0`} 
              onClick={() => {
                console.log("Натиснуто 'Почати тест' для тесту з ID:", test.id);
                if (onStart) {
                  onStart();
                } else {
                  // Використовуємо window.location.href замість navigate для повного перезавантаження сторінки
                  window.location.href = `/test/${test.id}`;
                }
              }}
            >
              Почати
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCard;
