import React from 'react';

const ProductDetailSkeleton = () => {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="aspect-square w-full rounded-3xl bg-slate-200 animate-pulse border border-slate-200 dark:bg-slate-900/70 dark:border-slate-800" />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-slate-200 animate-pulse border border-slate-200 dark:bg-slate-900/70 dark:border-slate-800"
            />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-5 w-2/3 rounded-full bg-slate-200 animate-pulse dark:bg-slate-900/70" />
        <div className="h-4 w-1/3 rounded-full bg-slate-200 animate-pulse dark:bg-slate-900/70" />
        <div className="h-10 w-1/2 rounded-2xl bg-slate-200 animate-pulse dark:bg-slate-900/70" />
        <div className="h-16 w-full rounded-2xl bg-slate-200 animate-pulse dark:bg-slate-900/70" />
        <div className="h-10 w-full rounded-2xl bg-slate-200 animate-pulse dark:bg-slate-900/70" />
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;

