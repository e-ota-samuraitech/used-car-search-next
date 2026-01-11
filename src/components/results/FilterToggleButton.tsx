interface FilterToggleButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

const FilterToggleButton = ({ onClick, isOpen }: FilterToggleButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="lg:hidden h-[38px] px-4 rounded-full border border-gray-200 bg-white cursor-pointer flex items-center gap-2 hover:bg-gray-50 transition-colors"
      type="button"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        />
      </svg>
      <span className="text-sm font-medium">絞り込み検索</span>
    </button>
  );
};

export default FilterToggleButton;
