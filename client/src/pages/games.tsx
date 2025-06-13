import { useLocation } from "wouter";
import { useTests } from "@/lib/hooks";
import TestCard from "@/components/test-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, Puzzle, Gamepad2, Brain, Sparkles } from "lucide-react";

const Games = () => {
  const [, navigate] = useLocation();
  
  // Get tests by type
  const { data: bookTests, isLoading: loadingBookTests } = useTests("book");
  const { data: quoteTests, isLoading: loadingQuoteTests } = useTests("quote");
  const { data: characterTests, isLoading: loadingCharacterTests } = useTests("character");
  
  return (
    <div className="games-page pb-14">
      <header className="p-3 sm:p-4 bg-white shadow-sm">
        <h1 className="text-lg sm:text-xl font-bold text-primary-900">Ігри</h1>
        <p className="text-xs sm:text-sm text-neutral-700">Перевірте свої знання з української літератури</p>
      </header>

      <section className="p-3 sm:p-4 bg-white mb-4">
        <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Літературні ігри</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <GameCard 
            title="Вгадай автора"
            description="Гра з визначення авторів цитат з української літератури"
            icon={<Brain className="w-6 h-6 sm:w-8 sm:h-8 text-teal-500" />}
            onClick={() => navigate("/games/guess-author")}
          />

          <GameCard 
            title="Пазл цитат"
            description="Складіть відомі цитати з української літератури з фрагментів"
            icon={<Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />}
            onClick={() => navigate("/games/quote-puzzle")}
          />
        </div>
      </section>

      <section className="p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Тести за творами</h2>
        
        {loadingBookTests ? (
          <div className="space-y-2 sm:space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-20 sm:h-24 w-full" />)}
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {bookTests?.map((test) => (
              <TestCard 
                key={test.id} 
                test={test} 
                onStart={() => navigate(`/test/${test.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Спеціальні тести</h2>
        
        <div className="space-y-2 sm:space-y-3">
          {loadingQuoteTests ? (
            <Skeleton className="h-20 sm:h-24 w-full" />
          ) : (
            quoteTests?.map((test) => (
              <TestCard 
                key={test.id} 
                test={test} 
                onStart={() => navigate(`/test/${test.id}`)}
              />
            ))
          )}
          
          {loadingCharacterTests ? (
            <Skeleton className="h-20 sm:h-24 w-full" />
          ) : (
            characterTests?.map((test) => (
              <TestCard 
                key={test.id} 
                test={test} 
                onStart={() => navigate(`/test/${test.id}`)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

// Компонент для відображення картки гри
interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  comingSoon?: boolean;
}

const GameCard = ({ title, description, icon, onClick, comingSoon = false }: GameCardProps) => {
  // Визначаємо колір з icon
  const getColorClass = () => {
    if ((icon as any)?.props?.className?.includes('text-violet-500')) {
      return {
        border: 'border-l-violet-500',
        hover: 'hover:border-violet-500',
        button: 'bg-violet-500 hover:bg-violet-600'
      };
    } else if ((icon as any)?.props?.className?.includes('text-teal-500')) {
      return {
        border: 'border-l-teal-500',
        hover: 'hover:border-teal-500',
        button: 'bg-teal-500 hover:bg-teal-600'
      };
    } else if ((icon as any)?.props?.className?.includes('text-amber-500')) {
      return {
        border: 'border-l-amber-500',
        hover: 'hover:border-amber-500',
        button: 'bg-amber-500 hover:bg-amber-600'
      };
    } else {
      return {
        border: 'border-l-primary',
        hover: 'hover:border-primary',
        button: 'bg-primary hover:bg-primary/90'
      };
    }
  };
  
  const colorClass = getColorClass();

  return (
    <div 
      className={`flex flex-col p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-neutral-100 border-l-4 ${colorClass.border} ${!comingSoon ? `cursor-pointer ${colorClass.hover} hover:shadow-md transition-all duration-200` : ''} relative`}
      onClick={comingSoon ? undefined : onClick}
    >
      <div className="flex items-center mb-2">
        {icon}
        <h3 className="font-medium ml-2 text-sm sm:text-base">{title}</h3>
      </div>
      <p className="text-xs sm:text-sm text-neutral-600 mb-2 sm:mb-3">{description}</p>
      
      {comingSoon ? (
        <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
          Скоро
        </div>
      ) : (
        <Button 
          size="sm" 
          className={`mt-auto self-start text-white text-xs sm:text-sm ${colorClass.button}`}
          onClick={onClick}
        >
          Грати
        </Button>
      )}
    </div>
  );
};

export default Games;