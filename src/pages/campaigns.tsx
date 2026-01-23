import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/common/Footer';

// キャンペーンデータ（ダミー）
const CAMPAIGNS = [
  {
    id: '1',
    dealer: 'カーセンター東京',
    title: '新春セール開催中！',
    description: '全車両10万円値引き',
    endDate: '2025年1月31日まで',
  },
  {
    id: '2',
    dealer: 'マツダオート大阪',
    title: '決算セール実施中',
    description: 'SUV特別価格',
    endDate: '2025年3月31日まで',
  },
  {
    id: '3',
    dealer: 'トヨタ福岡中央',
    title: '春の大感謝祭',
    description: 'ミニバン限定キャンペーン',
    endDate: '2025年4月30日まで',
  },
  {
    id: '4',
    dealer: 'ホンダカーズ名古屋',
    title: '週末限定フェア',
    description: '下取り強化中',
    endDate: '2025年2月28日まで',
  },
  {
    id: '5',
    dealer: 'スズキ販売札幌',
    title: '軽自動車祭り',
    description: '低燃費車特集',
    endDate: '2025年3月15日まで',
  },
  {
    id: '6',
    dealer: 'ダイハツ広島中央',
    title: '春の新生活応援',
    description: '初めての車購入サポート',
    endDate: '2025年4月15日まで',
  },
];

export default function CampaignsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/results?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="px-4 md:px-6 py-3 flex items-center gap-3 md:gap-6">
          <Link href="/" className="flex items-center gap-2 cursor-pointer flex-shrink-0">
            <Image
              src="/readdy-logo.png"
              alt="中古車速報"
              width={40}
              height={40}
              className="h-7 md:h-8 w-auto"
            />
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="flex items-center border border-gray-300 rounded-full px-3 md:px-4 py-1.5 md:py-2 hover:shadow-md transition-shadow bg-white">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mr-2 md:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="車種、メーカー、地域で検索"
                className="flex-1 outline-none text-xs md:text-sm text-gray-700"
              />
            </div>
          </form>

          <Link
            href="/login"
            className="hidden md:block px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors whitespace-nowrap cursor-pointer"
          >
            ログイン
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 w-full">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-medium text-gray-800 mb-2 flex items-center gap-2 md:gap-3">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 23c-1.1 0-1.99-.89-1.99-1.99h3.98c0 1.1-.89 1.99-1.99 1.99zm7-2.01H5v-2l1-1v-5.8c0-3.25 1.82-5.95 5-6.67V4c0-.83.67-1.5 1.5-1.5S14 3.17 14 4v.52c3.18.72 5 3.42 5 6.68v5.8l1 1v2z"/>
            </svg>
            キャンペーン情報
          </h1>
          <p className="text-sm md:text-base text-gray-600">全国の中古車販売店で開催中のキャンペーンをチェック</p>
        </div>

        {/* Campaign Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          {CAMPAIGNS.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer border border-gray-200"
            >
              <div className="w-full h-48 md:h-56 overflow-hidden bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-sm">キャンペーン画像</span>
              </div>
              <div className="p-4 md:p-6">
                <div className="text-xs md:text-sm text-gray-500 mb-2">{campaign.dealer}</div>
                <h3 className="text-base md:text-lg font-medium text-gray-800 mb-3">{campaign.title}</h3>
                <p className="text-sm md:text-base text-gray-600 mb-4">{campaign.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs md:text-sm text-red-600 font-medium">{campaign.endDate}</div>
                  <button className="px-3 md:px-4 py-1.5 md:py-2 bg-teal-600 text-white text-xs md:text-sm rounded-full hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer">
                    詳細を見る
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ad Space Section */}
        <section className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 md:p-8 border border-teal-100">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl md:text-2xl font-medium text-gray-800 mb-3 md:mb-4">
              広告枠のご案内
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-6">
              中古車速報では、販売店様向けの広告枠をご用意しております。<br className="hidden md:block" />
              キャンペーン情報を掲載して、より多くのお客様にアピールしませんか？
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="font-medium text-sm md:text-base text-gray-800 mb-2">高い露出</h3>
                <p className="text-xs md:text-sm text-gray-600">トップページと検索結果ページに表示</p>
              </div>
              <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-medium text-sm md:text-base text-gray-800 mb-2">ターゲット配信</h3>
                <p className="text-xs md:text-sm text-gray-600">地域や車種に応じた配信が可能</p>
              </div>
              <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-sm md:text-base text-gray-800 mb-2">効果測定</h3>
                <p className="text-xs md:text-sm text-gray-600">クリック数や表示回数を確認</p>
              </div>
            </div>
            <Link
              href="/login"
              className="inline-block px-6 md:px-8 py-2.5 md:py-3 bg-teal-600 text-white text-sm md:text-base rounded-full hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              広告掲載を始める
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
