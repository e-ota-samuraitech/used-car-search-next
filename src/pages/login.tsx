import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // ハリボテ: ログイン処理は行わない
    console.log('Login attempt:', { email, password });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-4 md:px-6 py-4 bg-white border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Image
            src="/readdy-logo.png"
            alt="中古車速報"
            width={40}
            height={40}
            className="h-8 md:h-10 w-auto"
          />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 md:px-6 py-8 md:py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-medium text-gray-800 mb-2">販売店ログイン</h1>
              <p className="text-sm md:text-base text-gray-600">中古車速報 管理画面</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@dealer.com"
                  className="w-full px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm md:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm md:text-base"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-teal-600 rounded cursor-pointer" />
                  <span className="text-gray-600">ログイン状態を保持</span>
                </label>
                <span className="text-teal-600 hover:underline cursor-pointer">
                  パスワードを忘れた
                </span>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2.5 md:py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer text-sm md:text-base"
              >
                ログイン
              </button>
            </form>

            <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-200 text-center">
              <p className="text-sm md:text-base text-gray-600 mb-4">
                まだアカウントをお持ちでない方
              </p>
              <button
                type="button"
                className="w-full px-4 py-2.5 md:py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer text-sm md:text-base"
              >
                新規登録
              </button>
            </div>

            <div className="mt-6 md:mt-8 space-y-3 md:space-y-4">
              <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
                <h3 className="font-medium text-sm md:text-base text-gray-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  販売店の方へ
                </h3>
                <p className="text-xs md:text-sm text-gray-600">
                  中古車速報に登録すると、車両情報の掲載やキャンペーン広告の出稿が可能になります。
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium text-sm md:text-base text-gray-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  お困りの方へ
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mb-3">
                  ログインに関するお問い合わせは、サポートセンターまでご連絡ください。
                </p>
                <Link
                  href="/contact"
                  className="text-xs md:text-sm text-teal-600 hover:underline cursor-pointer"
                >
                  お問い合わせはこちら →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 md:py-6 px-4 md:px-6">
        <div className="max-w-6xl mx-auto text-center text-xs md:text-sm text-gray-600">
          <p>© 2024 中古車速報. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
