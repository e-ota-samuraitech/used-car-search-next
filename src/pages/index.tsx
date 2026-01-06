import Layout from '@/components/common/Layout';
import SearchBar from '@/components/results/SearchBar';

export default function TopPage() {
  return (
    <Layout>
      <main>
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="py-7 px-3 text-center">
            <div className="text-lg font-extrabold mb-4">中古車を検索</div>
            <div className="max-w-[720px] mx-auto">
              <SearchBar />
            </div>
          </div>

          <div className="p-3">
            <div className="border border-dashed border-gray-200 rounded-[14px] p-4 text-muted text-sm bg-white">
              条件を入力して検索してください。
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
