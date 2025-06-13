import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useBooks } from "@/lib/hooks";
import BookCard from "@/components/book-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";

const Library = () => {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [allBooks, setAllBooks] = useState<any[]>([]);
  
  // Get books by category
  const { data: schoolBooks, isLoading: loadingSchoolBooks } = useBooks("zno");
  const { data: modernBooks, isLoading: loadingModernBooks } = useBooks("modern");
  const { data: allBooksData, isLoading: loadingAllBooks } = useBooks();
  
  useEffect(() => {
    if (allBooksData) {
      setAllBooks(allBooksData);
    }
  }, [allBooksData]);
  
  // Перевіряємо наявність запиту на пошук з AI-рекомендацій
  useEffect(() => {
    const bookSearch = localStorage.getItem("book_search");
    if (bookSearch) {
      setSearchQuery(bookSearch);
      // Після використання видаляємо збережений запит
      localStorage.removeItem("book_search");
    }
  }, []);
  
  // Filter books based on search query
  const filterBooks = (books: any[] | undefined) => {
    if (!books) return [];
    if (!searchQuery.trim()) return books;
    
    return books.filter(book => 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      book.author.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const filteredSchoolBooks = filterBooks(schoolBooks);
  const filteredModernBooks = filterBooks(modernBooks);
  
  // Обробка вибору книги з AI асистента
  const handleBookSelection = (bookName: string) => {
    // Шукаємо книгу за назвою і автором
    const bookNameParts = bookName.split(" - ");
    const bookTitle = bookNameParts[0].trim();
    
    const foundBook = allBooks.find(book => 
      book.title.toLowerCase().includes(bookTitle.toLowerCase())
    );
    
    if (foundBook) {
      navigate(`/books/${foundBook.id}`);
    } else {
      // Якщо книгу не знайдено, встановлюємо її як пошуковий запит
      setSearchQuery(bookTitle);
    }
  };
  
  return (
    <div className="library-page">
      <header className="p-3 sm:p-4 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h1 className="text-xl font-bold text-primary-900">Бібліотека</h1>
          <Button
            variant="outline"
            size="sm" 
            className="flex items-center gap-2 group"
            onClick={() => navigate("/ai-recommendations")}
          >
            <Sparkles className="h-4 w-4 text-purple-500 group-hover:text-purple-600" />
            <span className="hidden xs:inline">Літературний асистент</span>
            <span className="xs:hidden">Асистент</span>
          </Button>
        </div>
        <div className="relative mt-3">
          <div className="flex items-center">
            <span className="absolute left-3 text-neutral-400 z-10">
              <Search className="h-4 w-4" />
            </span>
            <Input
              type="text"
              placeholder="Пошук творів..."
              className="w-full pl-9 border border-neutral-200 rounded-lg text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <section className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium">Шкільна програма</h2>
          <button 
            className="text-primary-700 text-sm"
            onClick={() => navigate("/theory")}
          >
            Все
          </button>
        </div>
        
        {loadingSchoolBooks ? (
          <div className="text-center py-4">Завантаження...</div>
        ) : filteredSchoolBooks.length === 0 ? (
          <div className="text-center py-4 text-neutral-500">Нічого не знайдено</div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {filteredSchoolBooks.slice(0, 4).map((book) => (
              <BookCard 
                key={book.id} 
                book={book} 
                onClick={() => navigate(`/books/${book.id}`)}
              />
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium">Сучасна література</h2>
          <button className="text-primary-700 text-sm">Все</button>
        </div>
        
        {loadingModernBooks ? (
          <div className="text-center py-4">Завантаження...</div>
        ) : filteredModernBooks.length === 0 ? (
          <div className="text-center py-4 text-neutral-500">Нічого не знайдено</div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredModernBooks.slice(0, 4).map((book) => (
              <BookCard 
                key={book.id} 
                book={book} 
                onClick={() => navigate(`/books/${book.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Library;
