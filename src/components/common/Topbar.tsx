import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

const Topbar = () => {
  const router = useRouter();
  const isTopPage = router.pathname === '/';

  // トップページ: readdy風シンプルヘッダー（ロゴ左 + ログイン右）
  if (isTopPage) {
    return (
      <header className="px-4 md:px-6 py-4 flex items-center justify-between bg-white">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/readdy-logo.png"
            alt="中古車速報"
            width={40}
            height={40}
            className="h-8 md:h-10 w-auto"
          />
        </Link>
        <Link
          href="/login"
          className="px-4 md:px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors whitespace-nowrap"
        >
          ログイン
        </Link>
      </header>
    );
  }

  // その他のページ: 従来のヘッダー
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/readdy-logo.png"
            alt="中古車速報"
            width={40}
            height={40}
            className="h-8 md:h-10 w-auto"
          />
          <span className="font-medium text-gray-800 text-sm md:text-base hidden sm:inline">
            中古車速報
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
