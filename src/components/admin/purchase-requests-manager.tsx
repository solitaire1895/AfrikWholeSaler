"use client";

import { useState, useTransition } from "react";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Factory,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  createPurchaseRequest,
  updatePurchaseRequest,
  deletePurchaseRequest,
} from "@/app/actions/crud";
import type { PurchaseRequest } from "@/lib/queries";

interface PurchaseRequestsManagerProps {
  purchaseRequests: PurchaseRequest[];
}

const statusColors: Record<string, string> = {
  draft: "bg-surface-secondary text-text-secondary",
  sourcing: "bg-info/10 text-info",
  negotiating: "bg-warning/10 text-warning",
  ordered: "bg-brand/10 text-brand",
  received: "bg-success/10 text-success",
  cancelled: "bg-error/10 text-error",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sourcing: "Sourcing",
  negotiating: "Negotiating",
  ordered: "Ordered",
  received: "Received",
  cancelled: "Cancelled",
};

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "sourcing", label: "Sourcing" },
  { value: "negotiating", label: "Negotiating" },
  { value: "ordered", label: "Ordered" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
];

export function PurchaseRequestsManager({
  purchaseRequests: initialPRs,
}: PurchaseRequestsManagerProps) {
  const [purchaseRequests, setPurchaseRequests] = useState(initialPRs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingPR, setEditingPR] = useState<PurchaseRequest | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = purchaseRequests.filter((pr) => {
    if (statusFilter !== "All" && pr.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        pr.prNumber.toLowerCase().includes(q) ||
        pr.productName.toLowerCase().includes(q) ||
        (pr.factoryName?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  function openAddForm() {
    setEditingPR(null);
    setShowForm(true);
    setError(null);
  }

  function openEditForm(pr: PurchaseRequest) {
    setEditingPR(pr);
    setShowForm(true);
    setError(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingPR(null);
    setError(null);
  }

  function handleDelete(prId: string) {
    if (!confirm("Are you sure you want to delete this purchase request?")) return;
    startTransition(async () => {
      const result = await deletePurchaseRequest(prId);
      if (result.success) {
        setPurchaseRequests((prev) => prev.filter((p) => p.id !== prId));
      } else {
        setError(result.error || "Failed to delete purchase request");
      }
    });
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const input = {
        productName: formData.get("productName") as string,
        description: formData.get("description") as string || undefined,
        quantity: parseInt(formData.get("quantity") as string) || 1,
        targetUnitPrice: formData.get("targetUnitPrice")
          ? parseFloat(formData.get("targetUnitPrice") as string)
          : undefined,
        factoryName: formData.get("factoryName") as string || undefined,
        factoryContact: formData.get("factoryContact") as string || undefined,
        factoryQuotedPrice: formData.get("factoryQuotedPrice")
          ? parseFloat(formData.get("factoryQuotedPrice") as string)
          : undefined,
        status: formData.get("status") as string || "draft",
        notes: formData.get("notes") as string || undefined,
        adminNotes: formData.get("adminNotes") as string || undefined,
        expectedDeliveryDate: formData.get("expectedDeliveryDate") as string || undefined,
      };

      if (editingPR) {
        const result = await updatePurchaseRequest(editingPR.id, input);
        if (result.success) {
          closeForm();
          window.location.reload();
        } else {
          setError(result.error || "Failed to update purchase request");
        }
      } else {
        const result = await createPurchaseRequest(input);
        if (result.success) {
          closeForm();
          window.location.reload();
        } else {
          setError(result.error || "Failed to create purchase request");
        }
      }
    });
  }

  function handleStatusChange(prId: string, newStatus: string) {
    startTransition(async () => {
      const result = await updatePurchaseRequest(prId, { status: newStatus });
      if (result.success) {
        setPurchaseRequests((prev) =>
          prev.map((p) => (p.id === prId ? { ...p, status: newStatus } : p))
        );
      } else {
        setError(result.error || "Failed to update status");
      }
    });
  }

  // Summary stats
  const stats = {
    total: purchaseRequests.length,
    sourcing: purchaseRequests.filter((p) => p.status === "sourcing").length,
    negotiating: purchaseRequests.filter((p) => p.status === "negotiating").length,
    ordered: purchaseRequests.filter((p) => p.status === "ordered").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Purchase Requests</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Internal procurement tracking — bridge customer quotes to factory sourcing.
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Purchase Request
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-error/70 hover:text-error">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3">
          <p className="text-xs text-text-secondary">Total PRs</p>
          <p className="text-lg font-bold text-navy">{stats.total}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3">
          <p className="text-xs text-text-secondary">Sourcing</p>
          <p className="text-lg font-bold text-info">{stats.sourcing}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3">
          <p className="text-xs text-text-secondary">Negotiating</p>
          <p className="text-lg font-bold text-warning">{stats.negotiating}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3">
          <p className="text-xs text-text-secondary">Ordered</p>
          <p className="text-lg font-bold text-brand">{stats.ordered}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
          <input
            type="text"
            placeholder="Search by PR number, product, or factory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer"
        >
          <option value="All">All Statuses</option>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  PR Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Qty
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Target Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Factory
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Expected
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((pr) => (
                <tr
                  key={pr.id}
                  className="transition-colors hover:bg-surface-secondary/30"
                >
                  {/* PR Number */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-navy">{pr.prNumber}</p>
                    <p className="text-xs text-text-disabled">
                      {new Date(pr.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </td>

                  {/* Product */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-text-primary">
                      {pr.productName}
                    </p>
                    {pr.description && (
                      <p className="text-xs text-text-secondary truncate max-w-[200px]">
                        {pr.description}
                      </p>
                    )}
                  </td>

                  {/* Quantity */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-text-primary">
                      {pr.quantity.toLocaleString()}
                    </p>
                  </td>

                  {/* Target Price */}
                  <td className="px-4 py-3">
                    {pr.targetUnitPrice ? (
                      <p className="text-sm font-medium text-text-primary">
                        ${pr.targetUnitPrice.toFixed(2)}
                      </p>
                    ) : (
                      <span className="text-xs text-text-disabled">—</span>
                    )}
                    {pr.factoryQuotedPrice && (
                      <p className="text-xs text-success">
                        Factory: ${pr.factoryQuotedPrice.toFixed(2)}
                      </p>
                    )}
                  </td>

                  {/* Factory */}
                  <td className="px-4 py-3">
                    {pr.factoryName ? (
                      <div>
                        <p className="text-sm text-text-primary">{pr.factoryName}</p>
                        {pr.factoryContact && (
                          <p className="text-xs text-text-disabled">{pr.factoryContact}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-text-disabled">Not assigned</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <select
                      value={pr.status}
                      onChange={(e) => handleStatusChange(pr.id, e.target.value)}
                      disabled={isPending}
                      className="h-8 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-xs font-medium focus:border-brand focus:outline-none cursor-pointer disabled:opacity-50"
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Expected Delivery */}
                  <td className="px-4 py-3">
                    {pr.expectedDeliveryDate ? (
                      <p className="text-xs text-text-secondary">
                        {new Date(pr.expectedDeliveryDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    ) : (
                      <span className="text-xs text-text-disabled">TBD</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditForm(pr)}
                        disabled={isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary hover:text-brand disabled:opacity-50"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(pr.id)}
                        disabled={isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary hover:text-error disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Package className="h-10 w-10 text-text-disabled mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            No purchase requests found. Create your first PR to start tracking procurement.
          </p>
        </Card>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-navy">
                {editingPR ? "Edit Purchase Request" : "New Purchase Request"}
              </h2>
              <button
                onClick={closeForm}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
              {/* Product Name & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="productName"
                    defaultValue={editingPR?.productName || ""}
                    required
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    defaultValue={editingPR?.quantity || 1}
                    min={1}
                    required
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  name="description"
                  defaultValue={editingPR?.description || ""}
                  rows={2}
                  className="w-full rounded-[var(--radius-input)] border border-border bg-surface px-4 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Target Unit Price (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
                    <input
                      type="number"
                      name="targetUnitPrice"
                      defaultValue={editingPR?.targetUnitPrice || ""}
                      min={0}
                      step="0.01"
                      className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Factory Quoted Price (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
                    <input
                      type="number"
                      name="factoryQuotedPrice"
                      defaultValue={editingPR?.factoryQuotedPrice || ""}
                      min={0}
                      step="0.01"
                      className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Factory Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Factory Name
                  </label>
                  <div className="relative">
                    <Factory className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
                    <input
                      type="text"
                      name="factoryName"
                      defaultValue={editingPR?.factoryName || ""}
                      className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Factory Contact
                  </label>
                  <input
                    type="text"
                    name="factoryContact"
                    defaultValue={editingPR?.factoryContact || ""}
                    placeholder="Email, phone, or WeChat"
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              {/* Status & Expected Delivery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingPR?.status || "draft"}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer"
                  >
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Expected Delivery Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled pointer-events-none" />
                    <input
                      type="date"
                      name="expectedDeliveryDate"
                      defaultValue={
                        editingPR?.expectedDeliveryDate
                          ? editingPR.expectedDeliveryDate.split("T")[0]
                          : ""
                      }
                      className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Notes (customer-facing)
                </label>
                <textarea
                  name="notes"
                  defaultValue={editingPR?.notes || ""}
                  rows={2}
                  className="w-full rounded-[var(--radius-input)] border border-border bg-surface px-4 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Admin Notes (internal only)
                </label>
                <textarea
                  name="adminNotes"
                  defaultValue={editingPR?.adminNotes || ""}
                  rows={2}
                  className="w-full rounded-[var(--radius-input)] border border-border bg-surface px-4 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-10 items-center rounded-[var(--radius-button)] border border-border px-4 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving..." : editingPR ? "Update PR" : "Create PR"}
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}