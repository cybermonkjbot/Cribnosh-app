import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

// Types for tabs and filters
export type HeaderTab = 'for-you' | 'live';
export type CategoryFilter = 'all' | 'sushi' | 'pizza' | 'burgers' | 'chinese' | 'italian' | 'indian' | 'mexican' | 'thai' | 'japanese';

interface AppContextType {
  // Header tabs state
  activeHeaderTab: HeaderTab;
  setActiveHeaderTab: (tab: HeaderTab) => void;
  
  // Category filters state
  activeCategoryFilter: CategoryFilter;
  setActiveCategoryFilter: (filter: CategoryFilter) => void;
  
  // Content filtering based on active states
  getFilteredContent: (content: any[]) => any[];
  
  // Tab change handlers
  handleHeaderTabChange: (tab: HeaderTab) => void;
  handleCategoryFilterChange: (filter: CategoryFilter) => void;
  
  // Scroll to top functionality
  scrollToTop: () => void;
  registerScrollToTopCallback: (callback: () => void) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [activeHeaderTab, setActiveHeaderTab] = useState<HeaderTab>('for-you');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CategoryFilter>('all');
  const [scrollToTopCallback, setScrollToTopCallback] = useState<(() => void) | null>(null);

  const handleHeaderTabChange = useCallback((tab: HeaderTab) => {
    setActiveHeaderTab(tab);
  }, []);

  const handleCategoryFilterChange = useCallback((filter: CategoryFilter) => {
    setActiveCategoryFilter(filter);
  }, []);

  const getFilteredContent = useCallback((content: any[]) => {
    // Filter content based on active category
    if (activeCategoryFilter === 'all') {
      return content;
    }
    
    return content.filter(item => {
      // Add your filtering logic here based on your content structure
      // For example, if content has a 'category' or 'cuisine' property
      return item.category === activeCategoryFilter || 
             item.cuisine === activeCategoryFilter ||
             item.tags?.includes(activeCategoryFilter);
    });
  }, [activeCategoryFilter]);

  const scrollToTop = useCallback(() => {
    // Only call the scroll callback - don't switch tabs automatically
    // Tab switching should be handled separately by the double-tap handler
    if (scrollToTopCallback) {
      scrollToTopCallback();
    }
  }, [scrollToTopCallback]);

  const registerScrollToTopCallback = useCallback((callback: () => void) => {
    setScrollToTopCallback(() => callback);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value: AppContextType = useMemo(() => ({
    activeHeaderTab,
    setActiveHeaderTab,
    activeCategoryFilter,
    setActiveCategoryFilter,
    getFilteredContent,
    handleHeaderTabChange,
    handleCategoryFilterChange,
    scrollToTop,
    registerScrollToTopCallback,
  }), [
    activeHeaderTab,
    activeCategoryFilter,
    getFilteredContent,
    handleHeaderTabChange,
    handleCategoryFilterChange,
    scrollToTop,
    registerScrollToTopCallback,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 