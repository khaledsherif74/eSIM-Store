import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ordersApi } from "../../services/ordersApi.js";

export const submitCheckout = createAsyncThunk(
  "checkout/submit",
  async ({
    productId,
    productCategory,
    customerName,
    customerEmail,
    paymentMethod,
  }) => {
    return ordersApi.startCheckout({
      productId,
      productCategory,
      customerName,
      customerEmail,
      paymentMethod,
    });
  },
);

export const fetchOrderStatus = createAsyncThunk(
  "checkout/fetchOrderStatus",
  async (orderId) => {
    return ordersApi.getOrder(orderId);
  },
);

const checkoutSlice = createSlice({
  name: "checkout",
  initialState: {
    submitting: false,
    error: null,
    currentOrderId: null,
    orderStatus: null,
  },
  reducers: {
    setCurrentOrderId: (state, action) => {
      state.currentOrderId = action.payload;
    },
    resetCheckout: (state) => {
      state.submitting = false;
      state.error = null;
      state.currentOrderId = null;
      state.orderStatus = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitCheckout.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitCheckout.fulfilled, (state, action) => {
        state.submitting = false;
        state.currentOrderId = action.payload.orderId;
      })
      .addCase(submitCheckout.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.error.message;
      })
      .addCase(fetchOrderStatus.fulfilled, (state, action) => {
        state.orderStatus = action.payload;
      });
  },
});

export const { setCurrentOrderId, resetCheckout } = checkoutSlice.actions;
export default checkoutSlice.reducer;

export const selectCheckout = (state) => state.checkout;
