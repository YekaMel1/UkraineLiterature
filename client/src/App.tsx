import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Theory from "@/pages/theory";
import Games from "@/pages/games";
import Library from "@/pages/library";
import Profile from "@/pages/profile";
import BookDetails from "@/pages/book-details";
import Reader from "@/pages/reader";
import AuthPage from "@/pages/auth-page";
import GuessAuthorGame from "@/pages/guess-author-game";
import AIRecommendations from "@/pages/ai-recommendations";

import QuotePuzzle from "@/pages/quote-puzzle";
import TestPage from "@/pages/test-page";
import Navigation from "@/components/navigation";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  const [location] = useLocation();
  
  // Check if we're on the reader page to hide navigation
  const isReaderPage = location.startsWith("/reader/");
  const isAuthPage = location === "/auth";
  
  // Track active section for Navigation component
  const getActiveSection = () => {
    if (location === "/" || location === "/home") return "home";
    if (location === "/theory") return "theory";
    if (location === "/games" || location.startsWith("/games/") || location.startsWith("/test/")) return "games";
    if (location === "/library" || location === "/ai-recommendations") return "library";
    if (location === "/profile") return "profile";
    return "home";
  };

  // Використовуємо ефект для прокрутки сторінки вгору при зміні маршруту
  useEffect(() => {
    // Не прокручуємо на сторінці читача, щоб не втратити позицію читання
    if (!isReaderPage) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [location, isReaderPage]);

  return (
    <div className={`flex flex-col min-h-screen ${!isReaderPage ? 'pb-16' : ''}`}>
      <main className="flex-1">
        <Switch>
          <ProtectedRoute path="/" component={Home} />
          <ProtectedRoute path="/home" component={Home} />
          <ProtectedRoute path="/theory" component={Theory} />
          <ProtectedRoute path="/games" component={Games} />
          <ProtectedRoute path="/library" component={Library} />
          <ProtectedRoute path="/profile" component={Profile} />
          <ProtectedRoute path="/books/:id" component={BookDetails} />
          <ProtectedRoute path="/reader/:id" component={Reader} />
          <ProtectedRoute path="/games/guess-author" component={GuessAuthorGame} />
          <ProtectedRoute path="/games/quote-puzzle" component={QuotePuzzle} />
          <ProtectedRoute path="/test/:id" component={TestPage} />
          <ProtectedRoute path="/ai-recommendations" component={AIRecommendations} />
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isReaderPage && !isAuthPage && <Navigation activeSection={getActiveSection()} />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
