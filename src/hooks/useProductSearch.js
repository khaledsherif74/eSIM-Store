import { useEffect, useRef, useState } from "react";
import { productsApi } from "../services/productsApi.js";

export function useProductSearch(params) {
  const [state, setState] = useState({
    products: [],
    total: 0,
    page: 1,
    limit: params.limit || 24,
    isLoading: true,
    error: null,
  });
  const requestIdRef = useRef(0);
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    productsApi
      .searchProducts(params)
      .then((data) => {
        if (requestIdRef.current !== requestId) return;
        setState({
          products: data.products || [],
          total: data.total || 0,
          page: data.page || 1,
          limit: data.limit || params.limit || 24,
          isLoading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (requestIdRef.current !== requestId) return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Failed to load plans",
        }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  const totalPages = Math.max(1, Math.ceil(state.total / (state.limit || 1)));
  return { ...state, totalPages };
}
