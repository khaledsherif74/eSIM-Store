import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  ExternalLink,
  PackageSearch,
  RefreshCw,
} from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import { EsimCard } from "../components/esim/EsimCard.jsx";
import { ordersApi } from "../services/ordersApi.js";
import { loadStoredOrders } from "../utils/orderStorage.js";
import { useProducts } from "../hooks/useProducts.js";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../services/apiClient";
import "./MyEsimsPage.css";

export function MyEsimsPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [saved, setSaved] = useState(() => loadStoredOrders());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useProducts();

  async function load() {
    setLoading(true);
    try {
      if (user) {
        const response = await apiClient.get("/api/orders/me");
        setOrders(response.orders || []);
      } else {
        const refs = loadStoredOrders();
        setSaved(refs);
        const results = await Promise.all(
          refs.map(async (ref) => {
            try {
              return await ordersApi.getOrder(ref.id, ref.token);
            } catch {
              return null;
            }
          }),
        );
        setOrders(results.filter(Boolean));
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="container my-esims-page">
        <div className="my-esims-header">
          <div>
            <span className="eyebrow">{t("my_esims.eyebrow")}</span>
            <h1>{t("my_esims.title")}</h1>
          </div>
        </div>
        <div className="my-esims-grid">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="card" className="esim-card-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container my-esims-page">
      <div className="my-esims-header">
        <div>
          <span className="eyebrow">{t("my_esims.eyebrow")}</span>
          <h1>{t("my_esims.title")}</h1>
          <p>{user ? t("my_esims.account_note") : t("my_esims.guest_note")}</p>
        </div>
        <Button
          variant="secondary"
          icon={<RefreshCw size={16} />}
          onClick={load}
        >
          {t("my_esims.refresh")}
        </Button>
      </div>

      {orders.length ? (
        <section>
          <div className="my-esims-section-head">
            <h2>{t("my_esims.your_esims")}</h2>
            <span>{orders.length}</span>
          </div>
          <div className="my-esims-grid">
            {orders.map((o) => (
              <EsimCard key={o.orderId} order={o} />
            ))}
          </div>
        </section>
      ) : (
        <div className="my-esims-empty">
          <PackageSearch size={34} />
          <h2>{t("my_esims.no_esims")}</h2>
          <p>{t("my_esims.no_esims_note")}</p>
          <div className="my-esims-empty-actions">
            <Link to="/">
              <Button>
                {t("my_esims.browse_plans")} <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/installation">
              <Button variant="secondary">
                {t("my_esims.installation_guide")} <ExternalLink size={16} />
              </Button>
            </Link>
          </div>
          {!user && saved.length > 0 && (
            <small>{t("my_esims.guest_fallback_note")}</small>
          )}
        </div>
      )}
    </div>
  );
}
