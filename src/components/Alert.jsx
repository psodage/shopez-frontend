import React from 'react';

const styles = {
  error:
    'border-red-500/20 bg-red-500/10 text-red-700 ring-1 ring-red-500/20 dark:text-red-200',
  success:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-200',
  info:
    'border-sky-500/20 bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-200',
};

const Alert = ({ variant = 'info', children }) => {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles[variant]}`}>
      {children}
    </div>
  );
};

export default Alert;

