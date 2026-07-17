"use client";

import { useState, useTransition } from "react";
import {
  Search,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  Ban,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  updateCustomerVerification,
  updateUserRole,
  suspendUser,
  unsuspendUser,
  deleteUser,
} from "@/app/actions/crud";
import type { Customer } from "@/types";

interface CustomersManagerProps {
  customers: Customer[];
  currentUserRole: string;
  currentUserId: string;
}

const roleColors: Record<string, string> = {
  super_admin: "bg-navy/10 text-navy border-navy/20",
  admin: "bg-navy/10 text-navy border-navy/20",
  sales_rep: "bg-brand/10 text-brand border-brand/20",
  support_agent: "bg-success/10 text-success border-success/20",
  warehouse_staff: "bg-gold/10 text-gold border-gold/20",
  logistics_staff: "bg-gold/10 text-gold border-gold/20",
  operations_manager: "bg-info/10 text-info border-info/20",
  customer: "bg-surface-secondary text-text-secondary border-border",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  sales_rep: "Sales Agent",
  support_agent: "Customer Support",
  warehouse_staff: "Warehouse Staff",
  logistics_staff: "Logistics Coordinator",
  operations_manager: "Operations Manager",
  customer: "Customer",
};

const verificationColors: Record<string, string> = {
  Verified: "bg-success/10 text-success border-success/20",
  Pending: "bg-warning/10 text-warning border-warning/20",
  Unverified: "bg-surface-secondary text-text-secondary border-border",
};

export function CustomersManager({
  customers,
  currentUserRole,
  currentUserId,
}: CustomersManagerProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const isAdmin = ["admin", "super_admin"].includes(currentUserRole);

  const filtered = customers.filter((c) => {
    if (statusFilter !== "All" && c.verificationStatus !== statusFilter)
      return false;
    if (roleFilter !== "All" && c.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function handleVerification(customerId: string, status: string) {
    setPendingAction(`${customerId}-verify-${status}`);
    startTransition(async () => {
      const result = await updateCustomerVerification(customerId, status);
      if (!result.success) {
        setError(result.error || "Failed to update verification status");
      } else {
        window.location.reload();
      }
      setPendingAction(null);
    });
  }

  function handleRoleChange(customer: Customer, newRole: string) {
    if (!customer.userId) {
      setError("This customer has no associated user account.");
      return;
    }
    const userId = customer.userId;
    if (userId === currentUserId) {
      setError("You cannot change your own role.");
      return;
    }
    setPendingAction(`${customer.id}-role-${newRole}`);
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (!result.success) {
        setError(result.error || "Failed to update role");
      } else {
        window.location.reload();
      }
      setPendingAction(null);
    });
  }

  function handleSuspend(customer: Customer) {
    if (!customer.userId) {
      setError("This customer has no associated user account.");
      return;
    }
    const userId = customer.userId;
    if (userId === currentUserId) {
      setError("You cannot suspend your own account.");
      return;
    }
    setPendingAction(`${customer.id}-suspend`);
    startTransition(async () => {
      const result = await suspendUser(userId);
      if (!result.success) {
        setError(result.error || "Failed to suspend user");
      } else {
        window.location.reload();
      }
      setPendingAction(null);
    });
  }

  function handleUnsuspend(customer: Customer) {
    if (!customer.userId) {
      setError("This customer has no associated user account.");
      return;
    }
    const userId = customer.userId;
    setPendingAction(`${customer.id}-unsuspend`);
    startTransition(async () => {
      const result = await unsuspendUser(userId);
      if (!result.success) {
        setError(result.error || "Failed to unsuspend user");
      } else {
        window.location.reload();
      }
      setPendingAction(null);
    });
  }

  function handleDelete(customer: Customer) {
    if (!customer.userId) {
      setError("This customer has no associated user account.");
      return;
    }
    const userId = customer.userId;
    if (userId === currentUserId) {
      setError("You cannot delete your own account.");
      return;
    }
    setPendingAction(`${customer.id}-delete`);
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (!result.success) {
        setError(result.error || "Failed to delete user");
      } else {
        setDeleteTarget(null);
        window.location.reload();
      }
      setPendingAction(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage customer accounts, roles, verification, and access.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-error/70 hover:text-error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Toolbar: Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
          <input
            type="text"
            placeholder="Search by name, email, or company..."
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
          <option value="Verified">Verified</option>
          <option value="Pending">Pending</option>
          <option value="Unverified">Unverified</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-11 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer"
        >
          <option value="All">All Roles</option>
          {Object.entries(roleLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3">
          <p className="text-xs text-text-secondary">Total Customers</p>
          <p className="text-lg font-bold text-navy">{customers.length}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3">
          <p className="text-xs text-text-secondary">Verified</p>
          <p className="text-lg font-bold text-success">
            {customers.filter((c) => c.verificationStatus === "Verified").length}
          </p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3">
          <p className="text-xs text-text-secondary">Pending</p>
          <p className="text-lg font-bold text-warning">
            {customers.filter((c) => c.verificationStatus === "Pending").length}
          </p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3">
          <p className="text-xs text-text-secondary">Suspended</p>
          <p className="text-lg font-bold text-error">
            {customers.filter((c) => !c.isActive).length}
          </p>
        </div>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface">
          <table className="w-full min-w-[1000px]">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Verification
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Orders
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Spent
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            {/* Table Body */}
            <tbody className="divide-y divide-border">
              {filtered.map((customer) => {
                const isSelf = customer.userId === currentUserId;
                const canManage = isAdmin && !isSelf;
                return (
                  <tr
                    key={customer.id}
                    className={cn(
                      "transition-colors hover:bg-surface-secondary/30",
                      !customer.isActive && "bg-error/5"
                    )}
                  >
                    {/* Customer Name + Email */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-white font-semibold text-xs shrink-0">
                          {customer.firstName[0] || "?"}
                          {customer.lastName[0] || ""}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-text-primary truncate">
                              {customer.firstName} {customer.lastName}
                            </p>
                            {isSelf && (
                              <span className="inline-flex items-center rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                                You
                              </span>
                            )}
                            {!customer.isActive && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-error/10 px-1.5 py-0.5 text-[10px] font-medium text-error">
                                <Ban className="h-2.5 w-2.5" />
                                Suspended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary truncate flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </p>
                          {customer.phone && (
                            <p className="text-xs text-text-disabled truncate flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-text-primary">
                        {customer.company}
                      </p>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-text-secondary">
                        <MapPin className="h-3 w-3 text-text-disabled" />
                        <span>{customer.country}</span>
                        {customer.city && (
                          <span className="text-text-disabled">
                            , {customer.city}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      {canManage ? (
                        <select
                          value={customer.role}
                          onChange={(e) =>
                            handleRoleChange(customer, e.target.value)
                          }
                          disabled={
                            isPending &&
                            pendingAction === `${customer.id}-role-${customer.role}`
                          }
                          className="h-8 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-xs font-medium focus:border-brand focus:outline-none cursor-pointer disabled:opacity-50"
                        >
                          {Object.entries(roleLabels).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
                            roleColors[customer.role] ||
                              "bg-surface-secondary text-text-secondary border-border"
                          )}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {roleLabels[customer.role] || customer.role}
                        </span>
                      )}
                    </td>

                    {/* Verification Status */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
                          verificationColors[customer.verificationStatus]
                        )}
                      >
                        {customer.verificationStatus === "Verified" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : customer.verificationStatus === "Pending" ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {customer.verificationStatus}
                      </span>
                    </td>

                    {/* Total Orders */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-text-primary">
                        {customer.totalOrders}
                      </p>
                    </td>

                    {/* Total Spent */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-text-primary">
                        ${customer.totalSpent.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </td>

                    {/* Joined Date */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-text-secondary">
                        {new Date(customer.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", year: "numeric" }
                        )}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Verify / Reject */}
                        {customer.verificationStatus !== "Verified" && (
                          <button
                            onClick={() =>
                              handleVerification(customer.id, "verified")
                            }
                            disabled={
                              isPending &&
                              pendingAction === `${customer.id}-verify-verified`
                            }
                            title="Verify customer"
                            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {customer.verificationStatus === "Pending" && (
                          <button
                            onClick={() =>
                              handleVerification(customer.id, "rejected")
                            }
                            disabled={
                              isPending &&
                              pendingAction === `${customer.id}-verify-rejected`
                            }
                            title="Reject verification"
                            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-warning hover:bg-warning/10 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}

                        {/* Suspend / Unsuspend */}
                        {canManage &&
                          (customer.isActive ? (
                            <button
                              onClick={() => handleSuspend(customer)}
                              disabled={
                                isPending &&
                                pendingAction === `${customer.id}-suspend`
                              }
                              title="Suspend user"
                              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnsuspend(customer)}
                              disabled={
                                isPending &&
                                pendingAction === `${customer.id}-unsuspend`
                              }
                              title="Unsuspend user"
                              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          ))}

                        {/* Delete */}
                        {canManage && (
                          <button
                            onClick={() => setDeleteTarget(customer)}
                            disabled={
                              isPending &&
                              pendingAction === `${customer.id}-delete`
                            }
                            title="Delete user"
                            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Users className="h-10 w-10 text-text-disabled mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            No customers found. Try adjusting your search or filters.
          </p>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10 shrink-0">
                <AlertTriangle className="h-6 w-6 text-error" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">Delete Customer</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Are you sure you want to permanently delete{" "}
                  <span className="font-semibold text-text-primary">
                    {deleteTarget.firstName} {deleteTarget.lastName}
                  </span>
                  ? This will remove their profile, customer record, and all
                  associated data. This action{" "}
                  <span className="font-semibold text-error">
                    cannot be undone
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="rounded-[var(--radius-sm)] border border-border bg-surface-secondary/50 p-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-white text-xs font-semibold">
                  {deleteTarget.firstName[0] || "?"}
                  {deleteTarget.lastName[0] || ""}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {deleteTarget.firstName} {deleteTarget.lastName}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {deleteTarget.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isPending}
                className="flex h-10 items-center rounded-[var(--radius-button)] border border-border px-4 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={isPending}
                className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-error px-4 text-sm font-semibold text-white hover:bg-error/90 transition-colors disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete Permanently"}
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}