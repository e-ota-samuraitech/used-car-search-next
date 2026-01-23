import Link from 'next/link';

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
];

export default function CampaignSidebar() {
  return (
    <>
      <h2 className="text-base font-medium text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 23c-1.1 0-1.99-.89-1.99-1.99h3.98c0 1.1-.89 1.99-1.99 1.99zm7-2.01H5v-2l1-1v-5.8c0-3.25 1.82-5.95 5-6.67V4c0-.83.67-1.5 1.5-1.5S14 3.17 14 4v.52c3.18.72 5 3.42 5 6.68v5.8l1 1v2z"/>
        </svg>
        キャンペーン情報
      </h2>

      <div className="space-y-4">
        {CAMPAIGNS.map((campaign) => (
          <Link
            key={campaign.id}
            href="/campaigns"
            className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow cursor-pointer block"
          >
            <div className="w-full h-32 overflow-hidden bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-sm">キャンペーン画像</span>
            </div>
            <div className="p-3">
              <div className="text-xs text-gray-500 mb-1">{campaign.dealer}</div>
              <h3 className="font-medium text-sm text-gray-800 mb-1">{campaign.title}</h3>
              <p className="text-xs text-gray-600 mb-2">{campaign.description}</p>
              <div className="text-xs text-red-600 font-medium">{campaign.endDate}</div>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/campaigns"
        className="w-full mt-4 px-4 py-2 bg-white border border-gray-300 text-sm text-gray-700 rounded hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer block text-center"
      >
        すべて見る
      </Link>
    </>
  );
}
