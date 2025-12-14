import React from 'react';

interface LoadingBarProps {
  isLoading: boolean;
}

const LoadingBar: React.FC<LoadingBarProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
      <div className="h-full bg-gradient-to-r from-[#E6A85C] via-[#E85A9B] to-[#D946EF] animate-loading-bar" />
    </div>
  );
};

export default LoadingBar;
