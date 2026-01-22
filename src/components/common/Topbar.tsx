import Link from 'next/link';

const Topbar = () => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent flex items-center justify-center">
            <span className="text-white text-sm md:text-base font-bold">車</span>
          </div>
          <span className="font-medium text-gray-800 text-sm md:text-base hidden sm:inline">
            中古車検索
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4 md:gap-6 text-xs md:text-sm text-gray-600">
          <Link href="/cars/" className="hover:text-accent transition-colors">
            検索
          </Link>
          <Link href="/contact" className="hover:text-accent transition-colors hidden sm:inline">
            お問い合わせ
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Topbar;
