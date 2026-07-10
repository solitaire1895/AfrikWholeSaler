import { ShieldCheck, Plus, Mail, Edit2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const staffMembers = [
  { id: "staff-1", name: "Admin User", email: "admin@afrikwholesaler.com", role: "Super Admin", status: "Active", lastActive: "Now" },
  { id: "staff-2", name: "Aisha Bello", email: "aisha@afrikwholesaler.com", role: "Sales Agent", status: "Active", lastActive: "2h ago" },
  { id: "staff-3", name: "Chen Wei", email: "chen@afrikwholesaler.com", role: "Sourcing Manager", status: "Active", lastActive: "1d ago" },
  { id: "staff-4", name: "David Okafor", email: "david@afrikwholesaler.com", role: "Logistics Coordinator", status: "Active", lastActive: "30m ago" },
  { id: "staff-5", name: "Sarah Johnson", email: "sarah@afrikwholesaler.com", role: "Customer Support", status: "Inactive", lastActive: "5d ago" },
];

const roleColors: Record<string, string> = {
  "Super Admin": "bg-navy/10 text-navy border-navy/20",
  "Sales Agent": "bg-brand/10 text-brand border-brand/20",
  "Sourcing Manager": "bg-info/10 text-info border-info/20",
  "Logistics Coordinator": "bg-gold/10 text-gold border-gold/20",
  "Customer Support": "bg-success/10 text-success border-success/20",
};

export default function AdminStaffPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Staff & Roles</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage team members and their permissions.
          </p>
        </div>
        <button className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover transition-colors">
          <Plus className="h-4 w-4" />
          Add Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffMembers.map((member) => (
          <Card key={member.id} hover className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-white font-semibold text-sm">
                  {member.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{member.name}</h3>
                  <p className="text-xs text-text-secondary flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", roleColors[member.role])}>
                <ShieldCheck className="h-3 w-3" />
                {member.role}
              </span>
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", member.status === "Active" ? "bg-success/10 text-success" : "bg-surface-secondary text-text-secondary")}>
                {member.status}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-xs text-text-disabled">Last active: {member.lastActive}</span>
              <div className="flex gap-1">
                <button className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary hover:text-brand">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary hover:text-error">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}