import { type BookWithAuthor } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface LiteratureItemProps {
  book: BookWithAuthor;
  onClick?: () => void;
}

const LiteratureItem = ({ book, onClick }: LiteratureItemProps) => {
  // Для створення мініатюри кольору з текстовим представленням
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

  return (
    <div 
      className="text-block flex justify-between items-center cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-primary"
      onClick={onClick}
    >
      <div className="flex gap-3 items-center">
        {/* Мініатюрна кольорова обкладинка */}
        <div className={`min-w-10 h-12 ${getBgColor(book.coverColor || 'primary')} rounded flex items-center justify-center`}>
          <span className="material-icons text-white text-lg">{book.coverIcon || "auto_stories"}</span>
        </div>
        
        <div>
          <h3 className="font-medium text-primary-900 mb-1">{book.title}</h3>
          <div className="flex items-center gap-2">
            <p className="text-sm text-neutral-600">{book.author.name}</p>
            {book.category && (
              <Badge variant="outline" className="text-xs">
                {book.category}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Стрілка та короткий опис */}
      <div className="flex items-center gap-2">
        {book.description && (
          <p className="text-xs text-neutral-500 max-w-[150px] hidden md:block truncate">
            {book.description.slice(0, 40)}...
          </p>
        )}
        <ArrowRight className="text-primary w-5 h-5" />
      </div>
    </div>
  );
};

export default LiteratureItem;
