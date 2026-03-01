import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProfileSidebar from '../components/ProfileSidebar';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import {
  addAddress,
  clearProfileMessages,
  deleteAddress,
  fetchProfile,
  updateAddress,
} from '../redux/userProfileSlice';

const emptyAddress = {
  fullName: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  pincode: '',
  country: '',
  isDefault: false,
};

const ProfileAddress = () => {
  const dispatch = useDispatch();
  const { userInfo, loading, error, success } = useSelector(
    (s) => s.userProfile
  );

  const [form, setForm] = useState(emptyAddress);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!userInfo) {
      dispatch(fetchProfile());
    }
  }, [dispatch, userInfo]);

  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => dispatch(clearProfileMessages()), 2500);
      return () => clearTimeout(t);
    }
  }, [dispatch, success, error]);

  const resetForm = () => {
    setForm(emptyAddress);
    setEditingId(null);
  };

  const handleEdit = (address) => {
    setEditingId(address._id);
    setForm({
      fullName: address.fullName || '',
      phone: address.phone || '',
      address1: address.address1 || '',
      address2: address.address2 || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      country: address.country || '',
      isDefault: Boolean(address.isDefault),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.address1 || !payload.city || !payload.state || !payload.pincode || !payload.country) {
      alert('Please fill all required address fields.');
      return;
    }
    if (editingId) {
      dispatch(updateAddress({ id: editingId, data: payload }));
    } else {
      dispatch(addAddress(payload));
    }
    resetForm();
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this address?')) return;
    dispatch(deleteAddress(id));
  };

  const addresses = userInfo?.addresses || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 space-y-6">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Addresses
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

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {editingId ? 'Edit address' : 'Add new address'}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, fullName: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                      Address line 1
                    </label>
                    <input
                      type="text"
                      value={form.address1}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, address1: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                      Address line 2
                    </label>
                    <input
                      type="text"
                      value={form.address2}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, address2: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                      City
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, city: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                      State
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, state: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={form.pincode}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, pincode: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.7rem] font-medium text-slate-700 dark:text-slate-300">
                      Country
                    </label>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, country: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isDefault}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          isDefault: e.target.checked,
                        }))
                      }
                      className="h-3.5 w-3.5 accent-primary-500"
                    />
                    <span>Set as default address</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="text-[0.7rem] text-slate-500 hover:text-primary-700 dark:text-slate-400 dark:hover:text-primary-300"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-primary-400 disabled:opacity-60"
                    >
                      {loading && <Spinner className="h-4 w-4" />}
                      {editingId ? 'Update address' : 'Add address'}
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-3 text-xs">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Saved addresses
                </h2>
                {addresses.length === 0 && (
                  <p className="text-slate-500 dark:text-slate-400">
                    You have no saved addresses yet.
                  </p>
                )}
                {addresses.map((addr) => (
                  <article
                    key={addr._id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <div className="text-xs text-slate-700 dark:text-slate-200">
                      <p className="font-semibold">
                        {addr.fullName || userInfo?.name}
                        {addr.isDefault && (
                          <span className="ml-2 rounded-full bg-primary-500/15 px-2 py-0.5 text-[0.65rem] font-medium text-primary-300">
                            Default
                          </span>
                        )}
                      </p>
                      {addr.phone && (
                        <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                          {addr.phone}
                        </p>
                      )}
                      <p className="mt-1">
                        {addr.address1}
                        {addr.address2 ? `, ${addr.address2}` : ''}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        {addr.city}, {addr.state} {addr.pincode}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">{addr.country}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(addr)}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[0.7rem] font-medium text-slate-700 hover:border-primary-400/70 hover:text-primary-700 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:text-primary-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(addr._id)}
                        className="rounded-lg border border-red-500/60 bg-red-500/10 px-2 py-1 text-[0.7rem] font-medium text-red-700 hover:bg-red-500/20 dark:text-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfileAddress;

