"use client";

import { useState } from "react";
import { Search, Mail, Phone, MapPin, CheckCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { currentCustomer } from "@/lib/data";
import { cn } from "@/lib/utils";

const mockCustomers = [
  { ...currentCustomer, totalOrders: 12, totalSpent: 45200, country: "Senegal" },
  {
    id: "cust-2",
    firstName: "Amadou",
    lastName: "Diallo",
    email: "amadou@techstore.sn",
    phone: "+221 77 123 4567",
    company: "TechStore Dakar",
    country: "Senegal",
    verificationStatus: "Verified" as const,
    createdAt: "2024-01-20T10:00:00Z",
    totalOrders: 8,
    totalSpent: 24500,
  },
  {
    id: "cust-3",
    firstName: "Fatima",
    lastName: "Okoye",
    email: "fatima@okoyeimports.ng",
    phone: "+234 80 555 1234",
    company: "Okoye Imports Ltd",
    country: "Nigeria",
    verificationStatus: "Pending" as const,
    createdAt: "2024-06-05T14:30:00Z",
    totalOrders: 2,
    totalSpent: 5200,
  },
  {
    id: "cust-4",
    firstName: "James",
    lastName: "Mwangi",
    email: "james@mwangitrading.ke",
    phone: "+254 71 234 5678",
    company: "Mwangi Trading Co",
    country: "Kenya",
    verificationStatus: "Verified" as const,
    createdAt: "2023-11-15T09:00:00Z",
    totalOrders: 15,
    totalSpent: 67800,
  },
  {
    id: "cust-5",
    firstName: "Grace",
    lastName: "Asante",
    email: "grace@asantegoods.gh",
    phone: "+233 24 567 8901",
    company: "Asante Goods",
    country: "Ghana",
    verificationStatus: "Verified" as const,
    createdAt: "2024-03-22T11:45:00Z",
    totalOrders: 5,
    totalSpent: 12300,
  },
];

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = mockCustomers.filter((c) => {
    if (statusFilter !== "All" && c.verificationStatus !== statusFilter)
      return false;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage customer accounts and verification status.
        </p>
      </div>

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
        </select>
      </div>

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
                    : "bg-warning/10 text-warning border-warning/20"
                )}
              >
                {customer.verificationStatus === "Verified" ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
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
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-text-disabled" />
                <span>{customer.country}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-xs text-text-secondary">Orders</p>
                <p className="text-sm font-bold text-navy">
                  {customer.totalOrders}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-secondary">Total Spent</p>
                <p className="text-sm font-bold text-navy">
                  ${customer.totalSpent.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}