import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/common/Layout';
import { useApp } from '@/context/AppContext';
import { yen } from '@/utils/helpers';

export default function ThanksPage() {
  const router = useRouter();
  const { estimate, findCar, results, runSearch } = useApp();
  const car = estimate ? findCar(estimate.carId) : null;

  const handleGoResults = () => {
    if (!results.length) {
      runSearch();
    }
    router.push('/results');
  };

  return (
    <Layout>
      <main>
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="text-xs text-muted px-3 pt-2.5">
            <Link href="/" className="underline underline-offset-2">トップ</Link> / Thanks
          </div>

          <div className="py-[18px] px-3 text-center">
            <h2 className="m-0 mb-2 text-lg font-extrabold">お申し込みを受け付けました</h2>
            <div className="text-xs text-muted">店舗からの連絡をお待ちください</div>
          </div>

          <div className="p-3">
            <div className="border border-gray-200 rounded-[14px] p-3 bg-white m-3">
              <div className="font-extrabold mb-1.5">申し込み内容</div>

              {estimate && car ? (
                <>
                  <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
                    <div className="text-muted">車両</div>
                    <div>{car.maker} {car.model}（{car.year}）</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
                    <div className="text-muted">価格</div>
                    <div>¥{yen(car.priceYen)}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
                    <div className="text-muted">地域</div>
                    <div>{car.region}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
                    <div className="text-muted">都道府県</div>
                    <div>{car.pref}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
                    <div className="text-muted">市区町村</div>
                    <div>{car.city}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
                    <div className="text-muted">お名前</div>
                    <div>{estimate.name}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
                    <div className="text-muted">メール</div>
                    <div>{estimate.email}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
                    <div className="text-muted">電話</div>
                    <div>{estimate.tel || '未入力'}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
                    <div className="text-muted">連絡方法</div>
                    <div>{estimate.contact}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5">
                    <div className="text-muted">備考</div>
                    <div>{estimate.note || 'なし'}</div>
                  </div>
                </>
              ) : (
                <div className="border border-dashed border-gray-200 rounded-[14px] p-4 text-muted text-sm bg-white">
                  申し込み情報がありません。
                </div>
              )}

              <div className="mt-3 flex gap-2 flex-wrap items-center">
                <button
                  className="inline-flex items-center justify-center gap-2 text-xs h-[34px] px-3 rounded-full border border-gray-200 bg-white cursor-pointer whitespace-nowrap"
                  onClick={() => router.push('/')}
                  type="button"
                >
                  トップへ
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 text-xs h-[34px] px-3 rounded-full border-0 bg-accent text-white cursor-pointer whitespace-nowrap font-extrabold"
                  onClick={handleGoResults}
                  type="button"
                >
                  検索結果へ
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
