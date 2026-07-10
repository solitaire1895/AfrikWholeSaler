import { Settings, Globe, CreditCard, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Configure platform-wide settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-brand" />
            <h3 className="text-sm font-semibold text-navy">General</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Platform Name</label>
              <input type="text" defaultValue="AfrikWholesaler" className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Support Email</label>
              <input type="email" defaultValue="support@afrikwholesaler.com" className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Default Currency</label>
              <select className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>XOF (CFA)</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-brand" />
            <h3 className="text-sm font-semibold text-navy">Regional</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Default Language</label>
              <select className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer">
                <option>English</option>
                <option>French</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Timezone</label>
              <select className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer">
                <option>Africa/Douala (GMT+1)</option>
                <option>Africa/Lagos (GMT+1)</option>
                <option>Africa/Nairobi (GMT+3)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Sourcing Region</label>
              <input type="text" defaultValue="China" className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-brand" />
            <h3 className="text-sm font-semibold text-navy">Payment</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Accepted Methods</label>
              <div className="flex flex-wrap gap-2">
                {["Bank Transfer", "Wire", "PayPal", "Stripe", "Mobile Money"].map((m) => (
                  <span key={m} className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-primary">{m}</span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Default Payment Terms</label>
              <select className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer">
                <option>50% deposit, 50% before shipping</option>
                <option>100% upfront</option>
                <option>30% deposit, 70% on delivery</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-brand" />
            <h3 className="text-sm font-semibold text-navy">Notifications</h3>
          </div>
          <div className="space-y-3">
            {[
              "New order alerts",
              "Quote request notifications",
              "Low stock warnings",
              "Shipment milestone updates",
              "Customer registration alerts",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-sm text-text-primary">{item}</span>
                <button className="relative h-6 w-11 rounded-full bg-brand transition-colors">
                  <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <button className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
}