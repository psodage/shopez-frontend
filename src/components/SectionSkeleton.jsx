import React from 'react';

export const ProductGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60"
        >
          <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800/70">
            <div className="h-full w-full animate-pulse bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-800/80" />
          </div>
          <div className="space-y-2 px-3 py-3">
            <div className="h-3 w-3/4 rounded-full bg-slate-200 animate-pulse dark:bg-slate-800/80" />
            <div className="h-3 w-1/2 rounded-full bg-slate-200 animate-pulse dark:bg-slate-900/80" />
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="h-3 w-1/3 rounded-full bg-slate-200 animate-pulse dark:bg-slate-800/80" />
              <div className="h-7 w-16 rounded-xl bg-slate-200 animate-pulse dark:bg-slate-900/80" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const CategorySkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60"
        >
          <div className="h-12 w-12 rounded-full bg-slate-200 animate-pulse dark:bg-slate-800/80" />
          <div className="mt-2 h-3 w-16 rounded-full bg-slate-200 animate-pulse dark:bg-slate-800/80" />
        </div>
      ))}
    </div>
  );
};

