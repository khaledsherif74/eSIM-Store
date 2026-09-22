import { createSlice } from "@reduxjs/toolkit";

const tripSlice = createSlice({
  name: "trip",
  initialState: {
    destinations: [],
  },
  reducers: {
    addDestination: (state, action) => {
      const dest = action.payload;
      if (!state.destinations.some((d) => d.id === dest.id)) {
        state.destinations.push(dest);
      }
    },
    removeDestination: (state, action) => {
      state.destinations = state.destinations.filter(
        (d) => d.id !== action.payload,
      );
    },
    moveDestination: (state, action) => {
      const { index, direction } = action.payload;
      const target = index + direction;
      if (target < 0 || target >= state.destinations.length) return;
      const list = state.destinations;
      [list[index], list[target]] = [list[target], list[index]];
    },
    clearTrip: (state) => {
      state.destinations = [];
    },
    setTrip: (state, action) => {
      state.destinations = action.payload;
    },
  },
});

export const {
  addDestination,
  removeDestination,
  moveDestination,
  clearTrip,
  setTrip,
} = tripSlice.actions;
export default tripSlice.reducer;

export const selectTripDestinations = (state) => state.trip.destinations;

export const selectTripCountryCodes = (state) =>
  state.trip.destinations
    .filter((d) => d.kind === "country")
    .map((d) => d.code);
export const selectTripRegionIds = (state) =>
  state.trip.destinations.filter((d) => d.kind === "region").map((d) => d.id);
