import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-teal-600 text-white py-6 md:py-8 px-4 md:px-6 mt-auto">
      <div className="max-w-6xl mx-auto">
        {/* Links Grid - 4 columns (readdy準拠) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6">
          {/* サービス */}
          <div>
            <h3 className="font-medium mb-3 text-sm md:text-base">サービス</h3>
            <ul className="space-y-2 text-xs md:text-sm">
              <li>
                <Link href="/cars/" className="hover:underline cursor-pointer">
                  中古車検索
                </Link>
              </li>
              <li>
                <Link href="/campaigns" className="hover:underline cursor-pointer">
                  キャンペーン情報
                </Link>
              </li>
              <li>
                <Link href="/dealers" className="hover:underline cursor-pointer">
                  販売店一覧
                </Link>
              </li>
            </ul>
          </div>

          {/* 販売店の方へ */}
          <div>
            <h3 className="font-medium mb-3 text-sm md:text-base">販売店の方へ</h3>
            <ul className="space-y-2 text-xs md:text-sm">
              <li>
                <Link href="/login" className="hover:underline cursor-pointer">
                  ログイン
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:underline cursor-pointer">
                  新規登録
                </Link>
              </li>
              <li>
                <Link href="/ad-info" className="hover:underline cursor-pointer">
                  広告掲載について
                </Link>
              </li>
            </ul>
          </div>

          {/* サポート */}
          <div>
            <h3 className="font-medium mb-3 text-sm md:text-base">サポート</h3>
            <ul className="space-y-2 text-xs md:text-sm">
              <li>
                <Link href="/help" className="hover:underline cursor-pointer">
                  ヘルプ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:underline cursor-pointer">
                  お問い合わせ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:underline cursor-pointer">
                  利用規約
                </Link>
              </li>
            </ul>
          </div>

          {/* 会社情報 */}
          <div>
            <h3 className="font-medium mb-3 text-sm md:text-base">会社情報</h3>
            <ul className="space-y-2 text-xs md:text-sm">
              <li>
                <Link href="/about" className="hover:underline cursor-pointer">
                  会社概要
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:underline cursor-pointer">
                  プライバシーポリシー
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-teal-500 pt-4 md:pt-6 text-center text-xs md:text-sm">
          <p>© {new Date().getFullYear()} 中古車速報. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
