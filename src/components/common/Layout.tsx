import { ReactNode } from 'react';
import Topbar from '@/components/common/Topbar';
import Footer from '@/components/common/Footer';
import Filters from '@/components/filters/Filters';

interface LayoutProps {
  children: ReactNode;
  showFilters?: boolean;
}

const Layout = ({ children, showFilters = true }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar />
      <div className="max-w-[1200px] mx-auto p-3.5 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3.5 w-full flex-1 min-h-[calc(100vh-120px)]">
        {children}
        {showFilters && <Filters />}
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
