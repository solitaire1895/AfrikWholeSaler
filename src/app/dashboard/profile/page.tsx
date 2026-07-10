"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Shield,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { currentCustomer } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "documents" | "security">(
    "profile"
  );

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "addresses" as const, label: "Addresses", icon: MapPin },
    { id: "documents" as const, label: "Documents", icon: FileText },
    { id: "security" as const, label: "Security", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">
          Profile & Settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your account information, addresses, and documents.
        </p>
      </div>

      {/* Verification Banner */}
      <div className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border border-success/20 bg-success/5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-5 w-5 text-success" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary">
            Account Verified
          </p>
          <p className="text-xs text-text-secondary">
            Your business documents have been verified. You have full access to
            all features.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-brand text-brand"
                : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="p-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-primary text-white text-2xl font-bold mx-auto mb-4">
              {currentCustomer.firstName[0]}
              {currentCustomer.lastName[0]}
            </div>
            <h3 className="text-lg font-bold text-navy">
              {currentCustomer.firstName} {currentCustomer.lastName}
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              {currentCustomer.company}
            </p>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
              <CheckCircle className="h-3 w-3" />
              {currentCustomer.verificationStatus}
            </div>
            <p className="mt-4 text-xs text-text-disabled">
              Member since{" "}
              {new Date(currentCustomer.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })}
            </p>
          </Card>

          {/* Profile Form */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-sm font-semibold text-navy mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
                  <input
                    type="text"
                    defaultValue={currentCustomer.firstName}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm text-text-primary focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
                  <input
                    type="text"
                    defaultValue={currentCustomer.lastName}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm text-text-primary focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
                  <input
                    type="email"
                    defaultValue={currentCustomer.email}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm text-text-primary focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
                  <input
                    type="tel"
                    defaultValue={currentCustomer.phone}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm text-text-primary focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Company Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
                  <input
                    type="text"
                    defaultValue={currentCustomer.company}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm text-text-primary focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover transition-colors">
                Save Changes
              </button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "addresses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-navy">Saved Addresses</h3>
            <button className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] border border-border px-4 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Add Address
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentCustomer.addresses.map((addr) => (
              <Card key={addr.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-brand-light text-brand">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-text-primary">
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary hover:text-error">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-text-secondary">
                  <p className="text-text-primary">{addr.street}</p>
                  <p>
                    {addr.city}, {addr.country}
                  </p>
                  <p>{addr.postalCode}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-navy">
                Business Documents
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Required for customs clearance and KYC verification.
              </p>
            </div>
            <button className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] border border-border px-4 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Upload Document
            </button>
          </div>
          <div className="space-y-3">
            {[
              {
                name: "Business Registration Certificate",
                status: "Verified",
                date: "Uploaded Mar 15, 2024",
              },
              {
                name: "Tax Identification Document",
                status: "Verified",
                date: "Uploaded Mar 15, 2024",
              },
              {
                name: "Import License",
                status: "Pending Review",
                date: "Uploaded Jun 18, 2024",
              },
            ].map((doc) => (
              <Card key={doc.name} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-surface-secondary">
                    <FileText className="h-5 w-5 text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {doc.name}
                    </p>
                    <p className="text-xs text-text-secondary">{doc.date}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
                      doc.status === "Verified"
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-warning/10 text-warning border-warning/20"
                    )}
                  >
                    {doc.status === "Verified" ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {doc.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-4 max-w-2xl">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-navy mb-4">
              Change Password
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary focus:border-brand focus:outline-none"
                />
              </div>
              <div className="flex justify-end">
                <button className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover transition-colors">
                  Update Password
                </button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-navy">
                  Two-Factor Authentication
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Add an extra layer of security to your account.
                </p>
              </div>
              <button className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] border border-border px-4 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors">
                Enable 2FA
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-navy">
                  Notification Preferences
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Manage how you receive order and quote updates.
                </p>
              </div>
              <button className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] border border-border px-4 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors">
                Manage
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}