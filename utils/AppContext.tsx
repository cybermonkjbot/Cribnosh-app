import React, { createContext, ReactNode, useContext, useState } from 'react';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [activeHeaderTab, setActiveHeaderTab] = useState<HeaderTab>('for-you');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CategoryFilter>('all');

  const handleHeaderTabChange = (tab: HeaderTab) => {
    setActiveHeaderTab(tab);
    console.log('Header tab changed to:', tab);
  };

  const handleCategoryFilterChange = (filter: CategoryFilter) => {
    setActiveCategoryFilter(filter);
    console.log('Category filter changed to:', filter);
  };

  const getFilteredContent = (content: any[]) => {
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
  };

  const value: AppContextType = {
    activeHeaderTab,
    setActiveHeaderTab,
    activeCategoryFilter,
    setActiveCategoryFilter,
    getFilteredContent,
    handleHeaderTabChange,
    handleCategoryFilterChange,
  };

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