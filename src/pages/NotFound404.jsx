import React, { useEffect } from 'react';

const NotFound404 = () => {
  useEffect(() => {
    document.title = 'Page Not Found | ShopEZ';
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f3f4f6] px-4 dark:bg-slate-950">
      <main className="flex flex-col items-center justify-center text-center">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-slate-600 dark:text-slate-400">
          OOPS! PAGE NOT FOUND
        </p>

        <h1 className="mb-4 text-8xl font-black tracking-tight text-slate-900 dark:text-white sm:text-9xl">
          404
        </h1>

        <p className="max-w-md text-sm font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400 sm:text-base">
          WE ARE SORRY, BUT THE PAGE YOU REQUESTED WAS NOT FOUND
        </p>
      </main>
    </div>
  );
};

export default NotFound404;
