import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ordersApi } from "../services/ordersApi.js";
import { OrderStatusPanel } from "../components/checkout/OrderStatusPanel.jsx";
import { rememberOrder } from "../utils/orderStorage.js";
import { Button } from "../components/ui/Button.jsx";
import "./OrderStatusPage.css";

const TERMINAL = [
  "Completed",
  "AuthReleased",
  "PaymentFailed",
  "PaymentSetupFailed",
  "CaptureFailed",
  "FulfillmentFailedVoidFailed",
  "FulfillmentFailedRefundFailed",
  "Refunded",
  "Cancelled",
];

export function OrderStatusPage() {
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [gaveUp, setGaveUp] = useState(false);
  const attempts = useRef(0);
  const token =
    params.get("token") || sessionStorage.getItem("esim_pending_token");
  const localOrderParam = params.get("local_order") || params.get("localOrder");
  const paymobOrderParam = params.get("order");
  const storedOrderId = sessionStorage.getItem("esim_pending_order");
  const initialOrderId =
    localOrderParam ||
    (paymobOrderParam?.startsWith("local_") ? paymobOrderParam : null) ||
    storedOrderId;
  const [orderId, setOrderId] = useState(initialOrderId);

  useEffect(() => {
    if (orderId) sessionStorage.setItem("esim_pending_order", orderId);
    if (token) sessionStorage.setItem("esim_pending_token", token);
  }, [orderId, token]);

  useEffect(() => {
    const hasPaymobFields =
      params.has("success") || params.has("hmac") || params.has("id");
    if (!hasPaymobFields) return;
    const paymobFields = Object.fromEntries(params.entries());
    ordersApi.confirmPayment(paymobFields).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!token) return undefined;

    async function tick() {
      try {
        let resolvedOrderId = orderId;

        if (!resolvedOrderId) {
          const resolved = await ordersApi.resolveOrder(token);
          if (cancelled) return;
          resolvedOrderId = resolved.orderId;
          setOrderId(resolvedOrderId);
          sessionStorage.setItem("esim_pending_order", resolvedOrderId);
        }

        const result = await ordersApi.getOrder(resolvedOrderId, token);
        if (cancelled) return;

        setOrder(result);
        setError(null);
        rememberOrder(resolvedOrderId, token);

        if (TERMINAL.includes(result.status)) {
          sessionStorage.removeItem("esim_pending_order");
          sessionStorage.removeItem("esim_pending_token");
          return;
        }

        if (attempts.current >= 40) {
          setGaveUp(true);
          return;
        }

        attempts.current += 1;
        window.setTimeout(tick, 3000);
      } catch (e) {
        if (cancelled) return;

        if (attempts.current >= 5) {
          setError(e.message || "Unable to load the order status.");
          setGaveUp(true);
          return;
        }

        attempts.current += 1;
        window.setTimeout(tick, 3000);
      }
    }

    tick();
    return () => {
      cancelled = true;
    };
  }, [orderId, token]);

  if (!token) {
    return (
      <div className="container order-status-page">
        <h1>Order status</h1>
        <p>
          This link is missing the secure order access token, so it can't be
          matched to an order. Open the link from your confirmation email
          instead — that's the only reliable way back to an order.
        </p>
        <Link to="/">
          <Button>Browse plans</Button>
        </Link>
      </div>
    );
  }

  const status = gaveUp ? "PollingGaveUp" : order?.status || "PendingPayment";

  return (
    <div className="container order-status-page">
      <h1>Order status</h1>
      <OrderStatusPanel orderId={orderId} status={status} />

      {error && (
        <p className="muted">
          We are still unable to read the latest status automatically.
        </p>
      )}

      {!gaveUp && !TERMINAL.includes(order?.status) && (
        <p className="muted order-status-background-note">
          Payment confirmation and eSIM activation are being checked in the
          background. You do not need to keep refreshing this page.
        </p>
      )}

      {order?.status === "Completed" && (
        <div className="order-status-actions">
          <Link
            to={`/my-esims/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`}
          >
            <Button>View your eSIM</Button>
          </Link>
          <Link to="/installation">
            <Button variant="secondary">Installation guide</Button>
          </Link>
        </div>
      )}

      {gaveUp && (
        <div className="order-status-actions">
          <Link
            to={`/my-esims/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`}
          >
            <Button>Open order</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
