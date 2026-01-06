import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/common/Layout';

export default function TermsPage() {
  const router = useRouter();

  return (
    <Layout>
      <main>
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="text-xs text-muted px-3 pt-2.5">
            <Link href="/" className="underline underline-offset-2">トップ</Link> / 利用規約
          </div>
          <div className="p-3">
            <div className="border border-gray-200 rounded-[14px] p-3 bg-white m-3">
              <h1 className="m-0 mb-1.5 text-base font-extrabold">利用規約</h1>
              <div className="text-xs text-muted">ここに利用規約本文を配置します。</div>
              <div className="mt-3 flex gap-2 flex-wrap items-center">
                <button 
                  className="inline-flex items-center justify-center gap-2 text-xs h-[34px] px-3 rounded-full border border-gray-200 bg-white cursor-pointer whitespace-nowrap"
                  onClick={() => router.back()} 
                  type="button"
                >
                  戻る
                </button>
                <Link 
                  className="inline-flex items-center justify-center gap-2 text-xs h-[34px] px-3 rounded-full border-0 bg-accent text-white cursor-pointer whitespace-nowrap font-extrabold"
                  href="/results"
                >
                  検索結果へ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
