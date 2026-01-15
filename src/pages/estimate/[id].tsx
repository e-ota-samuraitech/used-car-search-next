import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/common/Layout';
import EstimateForm from '@/components/estimate/EstimateForm';
import { useApp } from '@/context/AppContext';

export default function EstimatePage() {
  const router = useRouter();
  const { id } = router.query;
  const { findCar } = useApp();
  
  const car = typeof id === 'string' ? findCar(id) : null;

  return (
    <Layout showFilters={false}>
      <main>
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="text-xs text-muted px-3 pt-2.5">
            <Link href="/" className="underline underline-offset-2">トップ</Link> /{' '}
            <Link href="/results" className="underline underline-offset-2">検索結果</Link> /{' '}
            <Link href={`/cars/d-${id}/`} className="underline underline-offset-2">車両詳細</Link> / 見積もり申し込み
          </div>
          <EstimateForm car={car} />
        </div>
      </main>
    </Layout>
  );
}
