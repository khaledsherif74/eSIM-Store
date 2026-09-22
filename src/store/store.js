import { configureStore } from "@reduxjs/toolkit";
import productsReducer from "./slices/productsSlice.js";
import countriesReducer from "./slices/countriesSlice.js";
import tripReducer from "./slices/tripSlice.js";
import checkoutReducer from "./slices/checkoutSlice.js";

export const store = configureStore({
  reducer: {
    products: productsReducer,
    countries: countriesReducer,
    trip: tripReducer,
    checkout: checkoutReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: { warnAfter: 100 },
      immutableCheck: { warnAfter: 100 },
    }),
});
