import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-slate-200/80 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3 max-w-sm">
        <Link
            to="/"
            className="group inline-flex items-center text-2xl transition-colors"
          >
            <span className="font-extrabold tracking-tighter">
              <span className="bg-gradient-to-r from-primary-300 via-primary-400 to-primary-500 bg-clip-text text-transparent group-hover:from-primary-200 group-hover:via-primary-300 group-hover:to-primary-400">Shop</span>
              <span className="text-slate-900 dark:text-white">EZ</span>
            </span>
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A modern, minimal shopping experience with hand‑picked products and
            trustworthy delivery.
          </p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-6 text-sm sm:grid-cols-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Quick links
            </h3>
            <ul className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <Link to="/products" className="hover:text-primary-300">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary-300">
                  About
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-primary-300">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Contact
            </h3>
            <ul className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
              <li>support@shopez.app</li>
              <li>+1 (555) 000‑1234</li>
              <li>Mon–Sun, 24/7</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Follow
            </h3>
            <div className="mt-3 flex gap-3 text-slate-600 dark:text-slate-300">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300/80 bg-white hover:border-primary-400 hover:text-primary-500 dark:border-slate-700/80 dark:bg-slate-900/80 dark:hover:text-primary-300"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300/80 bg-white hover:border-primary-400 hover:text-primary-500 dark:border-slate-700/80 dark:bg-slate-900/80 dark:hover:text-primary-300"
              >
                <span className="sr-only">Instagram</span>
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="4" y="4" width="16" height="16" rx="5" />
                  <circle cx="12" cy="12" r="3.5" />
                  <circle cx="17" cy="7" r="0.7" />
                </svg>
              </button>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300/80 bg-white hover:border-primary-400 hover:text-primary-500 dark:border-slate-700/80 dark:bg-slate-900/80 dark:hover:text-primary-300"
              >
                <span className="sr-only">Facebook</span>
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M14 8h2V4h-2a4 4 0 0 0-4 4v3H8v4h2v5h4v-5h2v-4h-2V8a1 1 0 0 1 1-1Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/80 dark:border-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-xs text-slate-500 dark:text-slate-500">
          <p>© {new Date().getFullYear()} ShopEZ. All rights reserved.</p>
          <p className="hidden sm:inline">
            Built with React, Node, and MongoDB.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

