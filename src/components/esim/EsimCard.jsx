import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "../ui/Badge.jsx";
import { Card } from "../ui/Card.jsx";
import { statusMeta, formatDate } from "../../utils/orderData.js";
import { getOrderAccess } from "../../utils/orderStorage.js";
import { selectAllProducts } from "../../store/slices/productsSlice.js";
import "./EsimCard.css";

export function EsimCard({ order }) {
  const { t } = useTranslation();
  const [label, tone] = statusMeta(order.status);
  const token = getOrderAccess(order.orderId)?.token;

  const products = useSelector(selectAllProducts);
  const product = products.find((p) => p.productId === order.productId);

  return (
    <Link
      to={`/my-esims/${encodeURIComponent(order.orderId)}${token ? `?token=${encodeURIComponent(token)}` : ""}`}
      className="esim-card"
    >
      <Card hoverable className="esim-card-inner">
        <div className="esim-card-head">
          <span className="esim-card-order-id">{order.orderId}</span>
          <Badge tone={tone}>{label}</Badge>
        </div>
        <strong className="esim-card-product">
          {product?.title || order.productId}
        </strong>
        <span className="esim-card-date">{formatDate(order.createdAt)}</span>
        <span className="esim-card-open">
          {t("my_esims.button")} <ArrowRight size={14} />
        </span>
      </Card>
    </Link>
  );
}
