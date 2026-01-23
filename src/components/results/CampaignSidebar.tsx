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
    <div className="hidden lg:block w-80 border-l border-gray-200 p-6 bg-gray-50">
      <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-red-500" aria-hidden="true">🔥</span>
        キャンペーン情報
      </h2>

      <div className="space-y-4">
        {CAMPAIGNS.map((campaign) => (
          <Link
            key={campaign.id}
            href="/campaigns"
            className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow cursor-pointer block"
          >
            <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
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
    </div>
  );
}
