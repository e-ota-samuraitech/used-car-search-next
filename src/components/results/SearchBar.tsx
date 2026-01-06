import { useState, KeyboardEvent } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '@/context/AppContext';

interface SearchBarProps {
  onSearch?: () => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
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

  return (
    <div className="flex gap-2.5 items-center justify-center flex-nowrap">
      <input
        type="text"
        placeholder="例：プリウス 2020 東京"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full max-w-[620px] h-[46px] px-4 rounded-full border border-gray-200 outline-none shadow-sm text-[15px] min-w-0"
      />
      <button 
        type="button" 
        onClick={handleSearch}
        className="h-[46px] px-[18px] rounded-full border-0 bg-accent text-white cursor-pointer font-extrabold whitespace-nowrap flex-shrink-0"
      >
        検索
      </button>
    </div>
  );
};

export default SearchBar;
