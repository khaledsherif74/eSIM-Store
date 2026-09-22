import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { countriesApi } from "../../services/countriesApi.js";

export const fetchCountries = createAsyncThunk(
  "countries/fetchAll",
  async () => {
    return countriesApi.getCountries();
  },
);

const countriesSlice = createSlice({
  name: "countries",
  initialState: {
    items: [],
    regions: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCountries.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.countries;
        state.regions = action.payload.regions;
      })
      .addCase(fetchCountries.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export default countriesSlice.reducer;

export const selectAllCountries = (state) => state.countries.items;
export const selectAllRegions = (state) => state.countries.regions;
export const selectCountriesStatus = (state) => state.countries.status;
export const selectCountriesError = (state) => state.countries.error;
