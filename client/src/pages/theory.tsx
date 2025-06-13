import { useLocation } from "wouter";
import { useBooks } from "@/lib/hooks";
import LiteratureItem from "@/components/literature-item";
import { Badge } from "@/components/ui/badge";

const Theory = () => {
  const [, navigate] = useLocation();
  
  // Get ZNO/NMT books
  const { data: books, isLoading } = useBooks("zno");
  
  // Group books by author for better organization
  const booksByAuthor = books?.reduce((acc, book) => {
    const authorName = book.author.name;
    if (!acc[authorName]) {
      acc[authorName] = [];
    }
    acc[authorName].push(book);
    return acc;
  }, {} as Record<string, typeof books>);
  
  return (
    <div className="theory-page pb-16">
      <header className="p-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold text-primary-900">Теорія</h1>
        <p className="text-sm text-neutral-700">Твори для ЗНО/НМТ з повними текстами</p>
      </header>

      <section className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Література для ЗНО/НМТ</h2>
          <Badge variant="outline" className="px-2 py-1">
            {books?.length || 0} творів
          </Badge>
        </div>
        
        {isLoading ? (
          <div className="text-center py-4">Завантаження...</div>
        ) : booksByAuthor ? (
          <div>
            {Object.entries(booksByAuthor).map(([authorName, authorBooks]) => (
              <div key={authorName} className="mb-6">
                <h3 className="font-medium text-neutral-700 mb-2">{authorName}</h3>
                <div className="space-y-2">
                  {authorBooks?.map((book) => (
                    <LiteratureItem 
                      key={book.id} 
                      book={book} 
                      onClick={() => navigate(`/books/${book.id}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-neutral-500">
            Не знайдено творів для ЗНО/НМТ
          </div>
        )}
      </section>
      

    </div>
  );
};

export default Theory;
