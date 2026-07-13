"use client";

import { useState, useTransition } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  CheckCircle,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Shield,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { updateCustomerProfile, updateProfile } from "@/app/actions/crud";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types";

export function ProfileSettings({ customer }: { customer: Customer }) {
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "documents" | "security">(
    "profile"
  );
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formData, setFormData] = useState({
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    company: customer.company,
  });

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "addresses" as const, label: "Addresses", icon: MapPin },
    { id: "documents" as const, label: "Documents", icon: FileText },
    { id: "security" as const, label: "Security", icon: Shield },
  ];

  const handleSaveProfile = () => {
    setSaveStatus(null);
    startTransition(async () => {
      const [custResult, profResult] = await Promise.all([
        updateCustomerProfile(customer.id, {
          contactName: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          companyName: formData.company,
        }),
        updateProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      ]);
      if (custResult.success && profResult.success) {
        setSaveStatus({ type: "success", message: "Profile updated successfully." });
      } else {
        setSaveStatus({
          type: "error",
          message: custResult.error || profResult.error || "Failed to update profile.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">
          Profile & Settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your account information, addresses, and documents.
        </p>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border border-success/20 bg-success/5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-5 w-5 text-success" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary">
            Account {customer.verificationStatus}
          </p>
          <p className="text-xs text-text-secondary">
            Your business documents have been verified. You have full access to
            all features.
          </p>
        </div>
      </div>

      {saveStatus && (
        <div
          className={cn(
            "flex items-start gap-3 p-4 rounded-[var(--radius-md)] border",
            saveStatus.type === "success"
              ? "border-success/20 bg-success/5"
              : "border-error/20 bg-error/5"
          )}
        >
          {saveStatus.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-error shrink-0 mt-0.5" />
          )}
          <p className={cn("text-sm", saveStatus.type === "success" ? "text-success" : "text-error")}>
            {saveStatus.message}
          </p>
        </div>
      )}

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

      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-primary text-white text-2xl font-bold mx-auto mb-4">
              {customer.firstName[0]}
              {customer.lastName[0]}
            </div>
            <h3 className="text-lg font-bold text-navy">
              {customer.firstName} {customer.lastName}
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              {customer.company}
            </p>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
              <CheckCircle className="h-3 w-3" />
              {customer.verificationStatus}
            </div>
            <p className="mt-4 text-xs text-text-disabled">
              Member since{" "}
              {new Date(customer.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })}
            </p>
          </Card>

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
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm text-text-primary focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={isPending}
                className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? "Saving..." : "Save Changes"}
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
          {customer.addresses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customer.addresses.map((addr) => (
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
          ) : (
            <Card className="p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-secondary mx-auto mb-4">
                <MapPin className="h-8 w-8 text-text-disabled" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-1">No saved addresses</h3>
              <p className="text-text-secondary text-sm">
                Add a delivery address to speed up your quote requests.
              </p>
            </Card>
          )}
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
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-surface-secondary">
                  <FileText className="h-5 w-5 text-text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    No documents uploaded yet
                  </p>
                  <p className="text-xs text-text-secondary">
                    Upload your business registration, tax ID, and import license.
                  </p>
                </div>
              </div>
            </Card>
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