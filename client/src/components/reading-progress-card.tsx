import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronRight, Timer, BookText } from "lucide-react";
import { type BookWithAuthor } from "@shared/schema";
import { type UserProgressWithBook } from "@/lib/hooks";

interface ReadingProgressCardProps {
  book: BookWithAuthor;
  progress: UserProgressWithBook;
  onClick?: () => void;
}

const ReadingProgressCard = ({ book, progress, onClick }: ReadingProgressCardProps) => {
  // Перетворення строкових кольорів в динамічні класи Tailwind
  const getBgColor = (color: string | null) => {
    if (!color) return 'bg-primary';
    
    switch (color) {
      case 'red': return 'bg-red-500';
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'purple': return 'bg-purple-500';
      case 'orange': return 'bg-orange-500';
      case 'emerald': return 'bg-emerald-500';
      case 'indigo': return 'bg-indigo-500';
      case 'stone': return 'bg-stone-500';
      case 'zinc': return 'bg-zinc-500';
      default: return 'bg-primary';
    }
  };

  // Розрахунок відображення прогресу
  const progressPercentage = progress.totalPages > 0 
    ? Math.round((progress.currentPage / progress.totalPages) * 100) 
    : 0;
  
  // Стан читання
  const getReadingStatus = () => {
    if (progress.completed) {
      return { text: "Прочитано", variant: "success" as const };
    }
    if (progress.currentPage > 0) {
      return { 
        text: `Сторінка ${progress.currentPage} з ${progress.totalPages}`, 
        variant: "outline" as const 
      };
    }
    return { text: "Не розпочато", variant: "secondary" as const };
  };

  const status = getReadingStatus();

  // Отримуємо останню дату читання
  const lastReadDate = progress.lastReadAt 
    ? new Date(progress.lastReadAt).toLocaleDateString('uk-UA', { 
        day: 'numeric', 
        month: 'short'
      }) 
    : null;

  return (
    <Card 
      className="text-block cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-primary p-0"
      onClick={onClick}
    >
      <div className="flex p-4">
        {/* Іконка книги зі стилізацією кольору */}
        <div className={`h-20 w-16 flex-shrink-0 flex items-center justify-center ${getBgColor(book.coverColor)} rounded shadow-sm`}>
          <BookText className="h-8 w-8 text-white" />
        </div>
        
        <div className="ml-4 flex-1 flex flex-col">
          <div className="flex justify-between">
            <h3 className="font-medium text-primary-900">{book.title}</h3>
            <Badge variant={status.variant} className="text-xs">
              {status.text}
            </Badge>
          </div>
          
          <p className="text-sm text-neutral-600 mb-2">{book.author.name}</p>
          
          <div className="flex items-center gap-2 mt-auto">
            <Progress value={progressPercentage} className="h-2 flex-1 bg-neutral-100" />
            <span className="text-xs text-primary-600 font-medium">{progressPercentage}%</span>
          </div>
          
          {lastReadDate && (
            <div className="flex items-center mt-1 text-xs text-neutral-500">
              <Timer className="h-3 w-3 mr-1" />
              <span>Останнє читання: {lastReadDate}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          <ChevronRight className="h-5 w-5 text-primary ml-2" />
        </div>
      </div>
    </Card>
  );
};

export default ReadingProgressCard;