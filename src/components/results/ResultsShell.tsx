import type { ReactNode } from 'react';

interface ResultsShellProps {
  left: ReactNode;
  children: ReactNode;
  right?: ReactNode;
}

export default function ResultsShell({ left, children, right }: ResultsShellProps) {
  const hasLeft = !!left;
  const hasRight = !!right;

  const lgGridCols = hasLeft && hasRight
    ? 'lg:grid-cols-[320px_1fr_320px]'
    : hasLeft && !hasRight
      ? 'lg:grid-cols-[320px_1fr]'
      : !hasLeft && hasRight
        ? 'lg:grid-cols-[1fr_320px]'
        : '';

  return (
    <div className="w-full">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-4 md:py-6">
        <div className={`flex flex-col gap-4 lg:grid ${lgGridCols} lg:gap-6`}>
          {hasLeft ? (
            <aside className="hidden lg:block">
              {left}
            </aside>
          ) : null}

          <div className="min-w-0">
            {children}
          </div>

          {hasRight ? (
            <aside className="hidden lg:block">
              {right}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
