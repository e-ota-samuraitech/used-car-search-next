import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-accent text-white py-6 md:py-8 px-4 md:px-6 mt-auto">
      <div className="max-w-6xl mx-auto">
        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-6">
          {/* サービス */}
          <div>
            <h3 className="font-medium mb-3 text-sm md:text-base">サービス</h3>
            <ul className="space-y-2 text-xs md:text-sm opacity-90">
              <li>
                <Link href="/cars/" className="hover:underline">
                  中古車検索
                </Link>
              </li>
            </ul>
          </div>

          {/* サポート */}
          <div>
            <h3 className="font-medium mb-3 text-sm md:text-base">サポート</h3>
            <ul className="space-y-2 text-xs md:text-sm opacity-90">
              <li>
                <Link href="/contact" className="hover:underline">
                  お問い合わせ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:underline">
                  利用規約
                </Link>
              </li>
            </ul>
          </div>

          {/* 会社情報 */}
          <div>
            <h3 className="font-medium mb-3 text-sm md:text-base">会社情報</h3>
            <ul className="space-y-2 text-xs md:text-sm opacity-90">
              <li>
                <Link href="/privacy" className="hover:underline">
                  プライバシーポリシー
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/20 pt-4 md:pt-6 text-center text-xs md:text-sm opacity-80">
          <p>© {new Date().getFullYear()} 中古車検索. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
