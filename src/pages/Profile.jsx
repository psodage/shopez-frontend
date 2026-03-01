import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProfileSidebar from '../components/ProfileSidebar';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import { fetchProfile } from '../redux/userProfileSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const { userInfo, loading, error } = useSelector((s) => s.userProfile);

  useEffect(() => {
    if (!userInfo) {
      dispatch(fetchProfile());
    }
  }, [dispatch, userInfo]);

  const memberSince = userInfo?.createdAt
    ? new Date(userInfo.createdAt).toLocaleDateString()
    : '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 space-y-6">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Account
        </h1>
        <div className="grid gap-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
          <ProfileSidebar />

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
            {error && <Alert variant="error">{error}</Alert>}
            {loading && (
              <div className="flex min-h-[180px] items-center justify-center">
                <Spinner className="h-6 w-6" />
              </div>
            )}
            {!loading && userInfo && (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-primary-700 ring-2 ring-primary-500/40 dark:bg-slate-900 dark:text-primary-300">
                    {userInfo.profileImage ? (
                      <img
                        src={userInfo.profileImage}
                        alt={userInfo.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      (userInfo.name || 'S')[0]?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      {userInfo.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Member since {memberSince || '—'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="text-slate-500 dark:text-slate-500">Email</p>
                    <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                      {userInfo.email}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="text-slate-500 dark:text-slate-500">Phone</p>
                    <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                      {userInfo.phone || 'Not added'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="text-slate-500 dark:text-slate-500">Total orders</p>
                    <p className="mt-1 text-sm font-semibold text-primary-700 dark:text-primary-300">
                      {userInfo.totalOrders ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="text-slate-500 dark:text-slate-500">Total spent</p>
                    <p className="mt-1 text-sm font-semibold text-primary-700 dark:text-primary-300">
                      ₹{Number(userInfo.totalSpent || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;

