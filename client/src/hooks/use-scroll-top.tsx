import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook для автоматичної прокрутки вгору при зміні маршруту
 */
export function useScrollTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    // При зміні маршруту прокручуємо сторінку вгору
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [location]);
  
  return null;
}