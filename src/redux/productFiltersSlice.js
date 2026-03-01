import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  category: '',
  minPrice: '',
  maxPrice: '',
  rating: '',
  sort: 'latest',
  page: 1,
  infiniteScroll: false,
};

const productFiltersSlice = createSlice({
  name: 'productFilters',
  initialState,
  reducers: {
    setFilters(state, action) {
      return { ...state, ...action.payload };
    },
    resetFilters() {
      return initialState;
    },
  },
});

export const { setFilters, resetFilters } = productFiltersSlice.actions;

export default productFiltersSlice.reducer;

