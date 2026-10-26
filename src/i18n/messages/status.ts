import { defineMessages } from "../define";

/**
 * Status labels. Keys cover both database values (snake_case) and the
 * display values used by the app types (e.g. "Quality Check").
 */
export const status = defineMessages({
  en: {
    order: {
      pending: "Pending", confirmed: "Confirmed", processing: "Sourcing", quality_check: "Quality check",
      shipped: "Shipped", in_transit: "In transit", delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded",
      Pending: "Pending", Confirmed: "Confirmed", Sourcing: "Sourcing", "Quality Check": "Quality check",
      Shipped: "Shipped", "In Customs": "In customs", Delivered: "Delivered", Cancelled: "Cancelled",
    },
    payment: { pending: "Unpaid", partial: "Partially paid", paid: "Paid", refunded: "Refunded", failed: "Payment failed" },
    shipment: {
      preparing: "Preparing", packed: "Packed", dispatched: "Dispatched", in_transit: "In transit", customs: "In customs",
      out_for_delivery: "Out for delivery", delivered: "Delivered", exception: "Problem",
      Preparing: "Preparing", Packed: "Packed", Dispatched: "Dispatched", "In Transit": "In transit", Customs: "In customs",
      "In Customs": "In customs", "Out for Delivery": "Out for delivery", Delivered: "Delivered", Exception: "Problem",
    },
    quote: {
      draft: "Draft", submitted: "Submitted", under_review: "Under review", quoted: "Quoted", accepted: "Accepted",
      rejected: "Rejected", expired: "Expired",
      Draft: "Draft", Submitted: "Submitted", "Under Review": "Under review", Quoted: "Quoted", Accepted: "Accepted",
      Rejected: "Rejected", Expired: "Expired",
    },
  },
  fr: {
    order: {
      pending: "En attente", confirmed: "Confirmée", processing: "En sourcing", quality_check: "Contrôle qualité",
      shipped: "Expédiée", in_transit: "En transit", delivered: "Livrée", cancelled: "Annulée", refunded: "Remboursée",
      Pending: "En attente", Confirmed: "Confirmée", Sourcing: "En sourcing", "Quality Check": "Contrôle qualité",
      Shipped: "Expédiée", "In Customs": "En douane", Delivered: "Livrée", Cancelled: "Annulée",
    },
    payment: { pending: "Non payée", partial: "Payée en partie", paid: "Payée", refunded: "Remboursée", failed: "Paiement échoué" },
    shipment: {
      preparing: "En préparation", packed: "Emballé", dispatched: "Expédié", in_transit: "En transit", customs: "En douane",
      out_for_delivery: "En cours de livraison", delivered: "Livré", exception: "Incident",
      Preparing: "En préparation", Packed: "Emballé", Dispatched: "Expédié", "In Transit": "En transit", Customs: "En douane",
      "In Customs": "En douane", "Out for Delivery": "En cours de livraison", Delivered: "Livré", Exception: "Incident",
    },
    quote: {
      draft: "Brouillon", submitted: "Envoyée", under_review: "En cours d'examen", quoted: "Devis envoyé", accepted: "Acceptée",
      rejected: "Refusée", expired: "Expirée",
      Draft: "Brouillon", Submitted: "Envoyée", "Under Review": "En cours d'examen", Quoted: "Devis envoyé", Accepted: "Acceptée",
      Rejected: "Refusée", Expired: "Expirée",
    },
  },
  es: {
    order: {
      pending: "Pendiente", confirmed: "Confirmado", processing: "En abastecimiento", quality_check: "Control de calidad",
      shipped: "Enviado", in_transit: "En tránsito", delivered: "Entregado", cancelled: "Cancelado", refunded: "Reembolsado",
      Pending: "Pendiente", Confirmed: "Confirmado", Sourcing: "En abastecimiento", "Quality Check": "Control de calidad",
      Shipped: "Enviado", "In Customs": "En aduana", Delivered: "Entregado", Cancelled: "Cancelado",
    },
    payment: { pending: "Sin pagar", partial: "Pagado en parte", paid: "Pagado", refunded: "Reembolsado", failed: "Pago fallido" },
    shipment: {
      preparing: "En preparación", packed: "Embalado", dispatched: "Despachado", in_transit: "En tránsito", customs: "En aduana",
      out_for_delivery: "En reparto", delivered: "Entregado", exception: "Incidencia",
      Preparing: "En preparación", Packed: "Embalado", Dispatched: "Despachado", "In Transit": "En tránsito", Customs: "En aduana",
      "In Customs": "En aduana", "Out for Delivery": "En reparto", Delivered: "Entregado", Exception: "Incidencia",
    },
    quote: {
      draft: "Borrador", submitted: "Enviada", under_review: "En revisión", quoted: "Presupuestada", accepted: "Aceptada",
      rejected: "Rechazada", expired: "Caducada",
      Draft: "Borrador", Submitted: "Enviada", "Under Review": "En revisión", Quoted: "Presupuestada", Accepted: "Aceptada",
      Rejected: "Rechazada", Expired: "Caducada",
    },
  },
  zh: {
    order: {
      pending: "待处理", confirmed: "已确认", processing: "采购中", quality_check: "质检中",
      shipped: "已发货", in_transit: "运输中", delivered: "已送达", cancelled: "已取消", refunded: "已退款",
      Pending: "待处理", Confirmed: "已确认", Sourcing: "采购中", "Quality Check": "质检中",
      Shipped: "已发货", "In Customs": "清关中", Delivered: "已送达", Cancelled: "已取消",
    },
    payment: { pending: "未付款", partial: "部分付款", paid: "已付款", refunded: "已退款", failed: "付款失败" },
    shipment: {
      preparing: "备货中", packed: "已打包", dispatched: "已发出", in_transit: "运输中", customs: "清关中",
      out_for_delivery: "派送中", delivered: "已送达", exception: "异常",
      Preparing: "备货中", Packed: "已打包", Dispatched: "已发出", "In Transit": "运输中", Customs: "清关中",
      "In Customs": "清关中", "Out for Delivery": "派送中", Delivered: "已送达", Exception: "异常",
    },
    quote: {
      draft: "草稿", submitted: "已提交", under_review: "审核中", quoted: "已报价", accepted: "已接受",
      rejected: "已拒绝", expired: "已过期",
      Draft: "草稿", Submitted: "已提交", "Under Review": "审核中", Quoted: "已报价", Accepted: "已接受",
      Rejected: "已拒绝", Expired: "已过期",
    },
  },
});
