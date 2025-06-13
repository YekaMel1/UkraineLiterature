import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useBook, useUserId, useUserBookProgress, useUserProgress } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProgressBar from "@/components/progress-bar";
import { BookOpen } from "lucide-react";

const BookDetails = () => {
  const { id } = useParams<{ id: string }>();
  const bookId = parseInt(id);
  const [, navigate] = useLocation();
  const userId = useUserId();
  const { toast } = useToast();
  
  // Get book details
  const { data: book, isLoading: loadingBook } = useBook(bookId);
  
  // Get user progress for this book
  const { data: userProgress } = useUserBookProgress(userId, bookId);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<string>("about");
  
  // Інформація про прогрес з бази даних
  const progressPercentage = Math.min(userProgress?.progress || 0, 100); 
  const isCompleted = userProgress?.completed || false;
  
  // Поточна сторінка читання
  const currentPage = userProgress?.currentPage || 0;
    
  // Виводимо відлагоджувальну інформацію
  console.log("Інформація про книгу:", {
    title: book?.title,
    currentPage,
    progress: progressPercentage,
    completed: isCompleted
  });
  
  // Прогрес оновлюється автоматично в режимі читання
  
  if (loadingBook) {
    return (
      <div className="book-details-page p-4 h-screen flex items-center justify-center">
        <p>Завантаження...</p>
      </div>
    );
  }
  
  if (!book) {
    return (
      <div className="book-details-page p-4 h-screen flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold mb-2">Твір не знайдено</h1>
        <Button onClick={() => navigate("/theory")}>
          Повернутися до списку
        </Button>
      </div>
    );
  }
  
  // Render book cover
  const renderCover = () => {
    if (book.coverType === "house") {
      return (
        <div className={`h-48 w-full bg-${book.coverColor} relative rounded-t-lg`}>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center">
              <div className="flex gap-8">
                <div className="w-16 h-20 bg-blue-300"></div>
                <div className="w-16 h-20 bg-blue-300"></div>
              </div>
              <div className="mt-2 w-20 h-8 bg-neutral-800"></div>
            </div>
          </div>
        </div>
      );
    } 
    
    if (book.coverType === "mountain") {
      return (
        <div className={`h-48 w-full bg-${book.coverColor} relative rounded-t-lg`}>
          <div className="absolute inset-0">
            <div className="flex flex-col justify-end h-full">
              <div className={`h-1/2 bg-gradient-to-t from-${book.coverColor} to-green-700`}></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl">
              ПРЕДКІВ
            </div>
          </div>
        </div>
      );
    }
    
    // Default icon-based cover
    return (
      <div className={`h-48 w-full bg-${book.coverColor} relative rounded-t-lg`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-icons text-7xl text-blue-400">{book.coverIcon || "auto_stories"}</span>
        </div>
      </div>
    );
  };
  
  return (
    <div className="book-details-page pb-16">
      {/* Header */}
      <header className="p-4 bg-white shadow-sm flex items-center">
        <button 
          className="mr-3"
          onClick={() => navigate("/theory")}
        >
          <span className="material-icons">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-primary-900">Деталі твору</h1>
      </header>
      
      <div className="bg-white mb-3">
        {/* Book cover */}
        {renderCover()}
        
        {/* Book info */}
        <div className="p-4">
          <h2 className="text-xl font-bold mb-1">{book.title}</h2>
          <p className="text-neutral-700 mb-3">{book.author.name}</p>
          <p className="text-sm">{book.description}</p>
          
          {/* Читання */}
          <div className="mt-4">
            <Button 
              variant="default"
              onClick={() => navigate(`/reader/${bookId}`)}
              className="w-full"
            >
              {currentPage > 0 ? "Продовжити читання" : "Почати читання"}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Book content tabs */}
      <div className="bg-white">
        <Tabs defaultValue="about" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="about">Про твір</TabsTrigger>
            <TabsTrigger value="text">Текст</TabsTrigger>
            <TabsTrigger value="quotes">Цитати</TabsTrigger>
          </TabsList>
          
          {/* About tab - book details */}
          <TabsContent value="about" className="p-4">
            <div className="mb-4">
              <h3 className="font-medium mb-2">Про твір</h3>
              <p className="text-sm">{book.summary}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-neutral-50 p-3 rounded-lg">
                <h4 className="text-xs uppercase text-neutral-500 mb-1">Рік</h4>
                <p className="font-medium">{book.year}</p>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg">
                <h4 className="text-xs uppercase text-neutral-500 mb-1">Жанр</h4>
                <p className="font-medium">{book.genre}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Дійові особи</h3>
              <p className="text-sm">{book.characters}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Теми</h3>
              <p className="text-sm">{book.themes}</p>
            </div>
          </TabsContent>
          
          {/* Text tab - full text of the book */}
          <TabsContent value="text" className="p-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-sm whitespace-pre-line mb-6">
                {(book.fullText || "").substring(0, 800)}
                {book.fullText && book.fullText.length > 800 && "..."}
              </p>
              
              <div className="mb-8 flex justify-center">
                <Button
                  onClick={() => navigate(`/reader/${bookId}`)}
                  className="gap-2"
                >
                  <span className="material-icons text-sm">menu_book</span>
                  Читати повний текст в режимі читання
                </Button>
              </div>
              
              <div className="my-8 p-4 rounded-lg bg-primary-50 border border-primary-100">
                <p className="text-primary-700 text-sm">
                  <span className="material-icons text-sm mr-1 align-text-bottom">info</span>
                  У режимі читання ви можете змінювати розмір шрифту та інтервал між рядками для зручності.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Quotes tab - notable quotes */}
          <TabsContent value="quotes" className="p-4">
            <h3 className="font-medium mb-2">Відомі цитати</h3>
            <div className="space-y-3">
              {book.quotes?.map((quote, index) => (
                <div key={index} className="bg-neutral-50 p-3 rounded-lg">
                  <p className="text-sm italic">"{quote}"</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BookDetails;