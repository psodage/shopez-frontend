import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProfileSidebar from '../components/ProfileSidebar';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import {
  changePassword,
  clearProfileMessages,
  fetchProfile,
  updateProfile,
} from '../redux/userProfileSlice';

const ProfileEdit = () => {
  const dispatch = useDispatch();
  const { userInfo, loading, error, success } = useSelector(
    (s) => s.userProfile
  );

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!userInfo) {
      dispatch(fetchProfile());
    } else {
      setName(userInfo.name || '');
      setPhone(userInfo.phone || '');
      setProfileImage(userInfo.profileImage || '');
    }
  }, [dispatch, userInfo]);

  useEffect(() => {
    if (success || error) {
      const timeout = setTimeout(() => {
        dispatch(clearProfileMessages());
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [dispatch, success, error]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    dispatch(
      updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        profileImage: profileImage.trim(),
      })
    );
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }
    dispatch(
      changePassword({
        currentPassword,
        newPassword,
      })
    );
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 space-y-6">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Edit profile
        </h1>
        <div className="grid gap-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
          <ProfileSidebar />

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
            {error && <Alert variant="error">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            {!userInfo && loading && (
              <div className="flex min-h-[180px] items-center justify-center">
                <Spinner className="h-6 w-6" />
              </div>
            )}

            {userInfo && (
              <div className="grid gap-6 lg:grid-cols-2">
                <form
                  onSubmit={handleProfileSubmit}
                  className="space-y-3 text-xs"
                >
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Profile details
                  </h2>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userInfo.email}
                      readOnly
                      className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                      Profile image URL
                    </label>
                    <input
                      type="url"
                      value={profileImage}
                      onChange={(e) => setProfileImage(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                    />
                    <p className="text-[0.65rem] text-slate-500 dark:text-slate-500">
                      Use an image URL for now. Cloud storage integration can be
                      wired here later.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-primary-400 disabled:opacity-60"
                  >
                    {loading && <Spinner className="h-4 w-4" />}
                    Save changes
                  </button>
                </form>

                <form
                  onSubmit={handlePasswordSubmit}
                  className="space-y-3 text-xs"
                >
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Change password
                  </h2>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                      Current password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                      New password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    {loading && <Spinner className="h-4 w-4" />}
                    Update password
                  </button>
                </form>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfileEdit;

