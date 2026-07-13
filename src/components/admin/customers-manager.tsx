"use client";

import { useState, useTransition } from "react";
import { Search, Mail, Phone, MapPin, CheckCircle, Clock, XCircle, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { updateCustomerVerification } from "@/app/actions/crud";
import type { Customer } from "@/types";

interface CustomersManagerProps {
  customers: Customer[];
}

export function CustomersManager({ customers }: CustomersManagerProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const filtered = customers.filter((c) => {
    if (statusFilter !== "All" && c.verificationStatus !== statusFilter) return false;
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
    setPendingAction(`${customerId}-${status}`);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage customer accounts and verification status.
        </p>
      </div>

      {error && (
        <div className="rounded-[var(--radius-sm)] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
          <input
            type="text"
            placeholder="Search customers..."
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
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer) => (
            <Card key={customer.id} hover className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-white font-semibold text-sm shrink-0">
                  {customer.firstName[0]}
                  {customer.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary truncate">
                    {customer.firstName} {customer.lastName}
                  </h3>
                  <p className="text-xs text-text-secondary truncate">
                    {customer.company}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold shrink-0",
                    customer.verificationStatus === "Verified"
                      ? "bg-success/10 text-success border-success/20"
                      : customer.verificationStatus === "Pending"
                        ? "bg-warning/10 text-warning border-warning/20"
                        : "bg-surface-secondary text-text-secondary border-border"
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
              </div>

              <div className="space-y-2 text-xs text-text-secondary">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-text-disabled" />
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-text-disabled" />
                  <span>{customer.phone || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-text-disabled" />
                  <span>{customer.addresses[0]?.country || "—"}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-secondary">Member Since</p>
                  <p className="text-sm font-bold text-navy">
                    {new Date(customer.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {customer.verificationStatus !== "Verified" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleVerification(customer.id, "verified")}
                    disabled={isPending && pendingAction === `${customer.id}-verified`}
                    className="flex-1 flex h-8 items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-success px-3 text-xs font-semibold text-white hover:bg-success/90 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Verify
                  </button>
                  {customer.verificationStatus === "Pending" && (
                    <button
                      onClick={() => handleVerification(customer.id, "rejected")}
                      disabled={isPending && pendingAction === `${customer.id}-rejected`}
                      className="flex h-8 items-center justify-center gap-1.5 rounded-[var(--radius-button)] border border-error/20 px-3 text-xs font-medium text-error hover:bg-error/5 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Users className="h-10 w-10 text-text-disabled mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No customers found.</p>
        </Card>
      )}
    </div>
  );
}