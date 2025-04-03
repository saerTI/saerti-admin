// src/components/common/ChartTab.tsx
import React from 'react';

interface ChartTabProps {
  tabs: Array<{
    id: string;
    label: string;
  }>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}

const ChartTab: React.FC<ChartTabProps> = ({ tabs = [], activeTab = '', setActiveTab }) => {
  // Check if tabs is undefined or not an array, provide default empty array
  const safeTabs = Array.isArray(tabs) ? tabs : [];
  
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
      {safeTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${
            activeTab === tab.id
              ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ChartTab;