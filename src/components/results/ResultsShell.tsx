import type { ReactNode } from 'react';

interface ResultsShellProps {
  left: ReactNode;
  children: ReactNode;
  right?: ReactNode;
}

export default function ResultsShell({ left, children, right }: ResultsShellProps) {
  const hasLeft = !!left;
  const hasRight = !!right;

  return (
    <div className="flex flex-col md:flex-row">
      {/* Left Sidebar - Filters */}
      {hasLeft && (
        <aside className="hidden md:block w-full md:w-64 border-b md:border-r md:border-b-0 border-gray-200 p-4 md:p-6 bg-white flex-shrink-0">
          {left}
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 px-4 md:px-6 py-4 md:py-6">
        <div className="max-w-5xl">
          {children}
        </div>
      </main>

      {/* Right Sidebar - Campaigns */}
      {hasRight && (
        <aside className="hidden lg:block w-80 border-l border-gray-200 p-6 bg-gray-50 flex-shrink-0">
          {right}
        </aside>
      )}
    </div>
  );
}
