import React from 'react';
import { NavLink } from 'react-router-dom';

const ProfileSidebar = () => {
  const linkBase =
    'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors';

  return (
    <aside className="w-full space-y-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700 sm:w-56 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
      <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
        Account
      </p>
      <nav className="space-y-1">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? 'bg-primary-500/10 text-primary-700 dark:bg-primary-500/15 dark:text-primary-200'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
            }`
          }
        >
          <span>Profile overview</span>
        </NavLink>
        <NavLink
          to="/profile/edit"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? 'bg-primary-500/10 text-primary-700 dark:bg-primary-500/15 dark:text-primary-200'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
            }`
          }
        >
          <span>Edit profile</span>
        </NavLink>
        <NavLink
          to="/profile/address"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? 'bg-primary-500/10 text-primary-700 dark:bg-primary-500/15 dark:text-primary-200'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
            }`
          }
        >
          <span>Addresses</span>
        </NavLink>
        <NavLink
          to="/my-orders"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? 'bg-primary-500/10 text-primary-700 dark:bg-primary-500/15 dark:text-primary-200'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
            }`
          }
        >
          <span>My orders</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default ProfileSidebar;

