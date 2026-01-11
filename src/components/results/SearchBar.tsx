import { useState, KeyboardEvent } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '@/context/AppContext';

interface SearchBarProps {
  onSearch?: () => void;
  variant?: 'large' | 'compact';
}

const SearchBar = ({ onSearch, variant = 'large' }: SearchBarProps) => {
  const { query, setQuery } = useApp();
  const [localQuery, setLocalQuery] = useState(query);
  const router = useRouter();

  const handleSearch = () => {
    setQuery(localQuery);
    if (onSearch) {
      onSearch();
    } else {
      router.push('/results');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const inputHeight = variant === 'large' ? 'h-[48px]' : 'h-[40px]';
  const buttonHeight = variant === 'large' ? 'h-[48px]' : 'h-[40px]';
  const inputMaxWidth = variant === 'large' ? 'max-w-[600px]' : 'max-w-full';
  const inputTextSize = variant === 'large' ? 'text-base' : 'text-sm';
  const inputShadow = variant === 'large' ? 'shadow-md hover:shadow-lg' : 'shadow-sm';
  const containerJustify = variant === 'large' ? 'justify-center' : 'justify-start';

  return (
    <div className={`flex gap-2.5 items-center ${containerJustify} flex-nowrap`}>
      <input
        type="text"
        placeholder="例：プリウス 2020 東京"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`w-full ${inputMaxWidth} ${inputHeight} px-4 rounded-full border border-gray-200 outline-none focus:border-accent ${inputShadow} ${inputTextSize} min-w-0 transition-all`}
      />
      <button
        type="button"
        onClick={handleSearch}
        className={`${buttonHeight} px-[18px] rounded-full border-0 bg-accent text-white cursor-pointer font-extrabold whitespace-nowrap flex-shrink-0 hover:bg-accent/90 transition-colors`}
      >
        検索
      </button>
    </div>
  );
};

export default SearchBar;
