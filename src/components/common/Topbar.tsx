import { useRouter } from 'next/router';

const Topbar = () => {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-[1200px] mx-auto px-3.5 py-2.5 flex items-center gap-3 flex-wrap">
        <div 
          className="font-extrabold tracking-wide whitespace-nowrap cursor-pointer"
          onClick={() => router.push('/')}
        >
          中古車検索
        </div>
      </div>
    </div>
  );
};

export default Topbar;
