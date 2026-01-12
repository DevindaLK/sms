import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalItems, 
  pageSize, 
  onPageChange 
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-10 h-10 rounded-full text-[10px] font-black tracking-widest transition-all ${
            currentPage === i 
              ? 'bg-atelier-clay text-white shadow-lg shadow-atelier-clay/20' 
              : 'text-atelier-charcoal hover:bg-atelier-nude'
          }`}
        >
          {i.toString().padStart(2, '0')}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-12 py-8 border-t border-atelier-sand/30">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-3 bg-white border border-atelier-sand rounded-2xl text-atelier-clay disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-md transition-all active:scale-95"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2">
        {renderPageNumbers()}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-3 bg-white border border-atelier-sand rounded-2xl text-atelier-clay disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-md transition-all active:scale-95"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Pagination;
