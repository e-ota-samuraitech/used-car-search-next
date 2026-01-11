import Link from 'next/link';
import Layout from '@/components/common/Layout';

export default function ContactPage() {
  return (
    <Layout>
      <main>
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="text-xs text-muted px-3 pt-2.5">
            <Link href="/" className="underline underline-offset-2">トップ</Link> / お問い合わせ
          </div>
          <div className="p-3">
            <div className="border border-gray-200 rounded-[14px] p-3 bg-white m-3">
              <h1 className="m-0 mb-1.5 text-base font-extrabold">お問い合わせ</h1>
              <div className="text-xs text-muted">お問い合わせ先をここに配置します。</div>

              <div className="mt-3">
                <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
                  <div className="text-muted">メール</div>
                  <div>support@example.com</div>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5">
                  <div className="text-muted">受付時間</div>
                  <div>平日 10:00 - 18:00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
