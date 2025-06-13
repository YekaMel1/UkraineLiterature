import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type BookWithAuthor } from "@shared/schema";
import { BookOpen, Mountain, Trees, Sun, Feather, Music, Home, LucideIcon } from "lucide-react";

interface BookCardProps {
  book: BookWithAuthor;
  onClick?: () => void;
}

// Обираємо тематичні SVG зображення для обкладинок книг
const getBookThemeImage = (title: string): React.ReactNode => {
  // Ключові слова для визначення теми книги
  const keywords: Record<string, React.ReactNode> = {
    'тіні': <Mountain className="w-16 h-16 sm:w-20 sm:h-20 text-white/90 drop-shadow-lg" />,
    'ліс': <Trees className="w-16 h-16 sm:w-20 sm:h-20 text-white/90 drop-shadow-lg" />,
    'сонце': <Sun className="w-16 h-16 sm:w-20 sm:h-20 text-white/90 drop-shadow-lg" />,
    'дім': <Home className="w-16 h-16 sm:w-20 sm:h-20 text-white/90 drop-shadow-lg" />,
    'пісня': <Music className="w-16 h-16 sm:w-20 sm:h-20 text-white/90 drop-shadow-lg" />,
    'сім\'я': <Home className="w-16 h-16 sm:w-20 sm:h-20 text-white/90 drop-shadow-lg" />,
    'кобзар': <Feather className="w-16 h-16 sm:w-20 sm:h-20 text-white/90 drop-shadow-lg" />
  };

  // Шукаємо ключові слова в назві книги
  const lowerTitle = title.toLowerCase();
  for (const [key, icon] of Object.entries(keywords)) {
    if (lowerTitle.includes(key)) {
      return icon;
    }
  }

  // Якщо не знайдено відповідного ключового слова, повертаємо зображення за замовчуванням
  return <BookOpen className="w-16 h-16 sm:w-20 sm:h-20 text-white/90 drop-shadow-lg" />;
};

const BookCard = ({ book, onClick }: BookCardProps) => {
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

  const renderCover = () => {
    const bgColorClass = getBgColor(book.coverColor || 'primary');
    const themeImage = getBookThemeImage(book.title);

    // Створюємо псевдовипадковий орнамент на основі назви книги
    const patternType = book.title.length % 3; // 0, 1 або 2
    
    if (book.coverType === "house") {
      return (
        <div className={`h-32 sm:h-40 ${bgColorClass} book-shine relative overflow-hidden`}>
          <div className="absolute top-0 right-0 left-0 h-4 sm:h-6 bg-gradient-to-b from-black/20 to-transparent"></div>
          <div className="absolute bottom-0 right-0 left-0 h-8 sm:h-12 bg-gradient-to-t from-black/30 to-transparent"></div>
          
          {/* Орнаменти та візерунки */}
          {patternType === 0 && (
            <div className="absolute inset-0 book-pattern-dots"></div>
          )}
          {patternType === 1 && (
            <div className="absolute inset-0 book-pattern-lines"></div>
          )}
          
          <div className="absolute inset-0 flex items-center justify-center">
            {themeImage}
          </div>
        </div>
      );
    } 
    
    if (book.coverType === "mountain") {
      return (
        <div className={`h-32 sm:h-40 ${bgColorClass} book-shine relative overflow-hidden`}>
          <div className="absolute top-0 right-0 left-0 h-4 sm:h-6 bg-gradient-to-b from-black/20 to-transparent"></div>
          <div className="absolute bottom-0 right-0 left-0 h-8 sm:h-12 bg-gradient-to-t from-black/30 to-transparent"></div>
          
          {/* Гірський силует */}
          <div className="absolute bottom-0 w-full">
            <div className="h-16 sm:h-20 bg-black/20 clippy-mountain"></div>
          </div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {themeImage}
            <div className="absolute bottom-2 sm:bottom-3 text-white font-bold text-sm sm:text-lg tracking-wider drop-shadow-lg">
              {book.title.split(' ')[0] || 'КНИГА'}
            </div>
          </div>
        </div>
      );
    }
    
    // Default themed cover
    return (
      <div className={`h-32 sm:h-40 ${bgColorClass} book-shine relative overflow-hidden`}>
        <div className="absolute top-0 right-0 left-0 h-4 sm:h-6 bg-gradient-to-b from-black/20 to-transparent"></div>
        <div className="absolute bottom-0 right-0 left-0 h-8 sm:h-12 bg-gradient-to-t from-black/30 to-transparent"></div>
        
        {/* Декоративний елемент для обкладинки */}
        {patternType === 2 && (
          <div className="absolute inset-0 book-pattern-grid"></div>
        )}
        
        <div className="absolute inset-0 flex items-center justify-center">
          {themeImage}
        </div>
      </div>
    );
  };

  return (
    <Card 
      className="literature-card cursor-pointer transform transition-all duration-300 hover:-translate-y-1 h-full flex flex-col" 
      onClick={onClick}
    >
      <div className="relative">
        {renderCover()}
        {book.category && (
          <Badge className="absolute top-2 right-2 bg-white/80 text-primary text-xs font-medium">
            {book.category}
          </Badge>
        )}
      </div>
      <div className="p-3 sm:p-4 flex-grow flex flex-col">
        <h3 className="font-medium text-primary-900 mb-1 line-clamp-2 text-sm sm:text-base">{book.title}</h3>
        <p className="text-xs sm:text-sm text-neutral-600 italic line-clamp-1">{book.author.name}</p>
        {book.year && (
          <p className="text-xs text-neutral-500 mt-auto pt-1">{book.year} рік</p>
        )}
      </div>
    </Card>
  );
};

export default BookCard;
