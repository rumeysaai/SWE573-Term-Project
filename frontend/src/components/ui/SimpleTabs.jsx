import React, { useState } from 'react';

export const SimpleTabs = ({ defaultValue, onValueChange, children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const handleTabChange = (value) => {
    setActiveTab(value);
    if (onValueChange) onValueChange(value);
  };
  
  // Çocukları klonlarken null/undefined kontrolü ekle
  const clonedChildren = React.Children.map(children, (child) => {
    if (!child) return null; // Null çocukları atla
    
    if (child.type === SimpleTabsList) {
      return React.cloneElement(child, { activeTab, onTabChange: handleTabChange });
    }
    if (child.type === SimpleTabsContent) {
      return React.cloneElement(child, { activeTab });
    }
    return child;
  });
  return <div>{clonedChildren}</div>;
};

export const SimpleTabsList = ({ children, className = "", activeTab, onTabChange }) => (
  <div className={`w-full flex rounded-md bg-gray-200/50 border border-blue-500/20 p-1 ${className}`}>
    {React.Children.map(children, (child) => {
      if (!child) return null; // Null çocukları atla
      return React.cloneElement(child, {
        isActive: activeTab === child.props.value,
        onClick: () => onTabChange(child.props.value),
      });
    })}
  </div>
);

export const SimpleTabsTrigger = ({ children, className = "", value, isActive, onClick }) => {
  // İhtiyaçlar butonu için turuncu, teklifler için mavi
  const activeClasses = value === "needs" ? "bg-orange-500 text-white" : "bg-blue-600 text-white";
  const inactiveClasses = "hover:bg-gray-100";
  return (
    <button
      onClick={onClick}
      className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive ? activeClasses : inactiveClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export const SimpleTabsContent = ({ children, value, activeTab, className = "" }) => {
  if (value !== activeTab) return null;
  return <div className={`mt-4 ${className}`}>{children}</div>;
};

