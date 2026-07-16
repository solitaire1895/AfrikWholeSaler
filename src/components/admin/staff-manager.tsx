"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, Plus, Mail, Edit2, X, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createStaffMember, updateStaffMember, updateUserRole } from "@/app/actions/crud";

interface StaffMember {
  id: string;
  userId: string;
  employeeId: string | null;
  department: string;
  position: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  hireDate: string | null;
  isActive: boolean;
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

const departments = ["Sales", "Support", "Warehouse", "Logistics", "Operations", "Management"];

interface StaffManagerProps {
  staff: StaffMember[];
}

export function StaffManager({ staff }: StaffManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  function openAddForm() {
    setEditingStaff(null);
    setShowForm(true);
    setError(null);
  }

  function openEditForm(member: StaffMember) {
    setEditingStaff(member);
    setShowForm(true);
    setError(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingStaff(null);
    setError(null);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (editingStaff) {
        const result = await updateStaffMember(editingStaff.id, {
          department: formData.get("department") as string,
          position: formData.get("position") as string,
          employeeId: formData.get("employeeId") as string,
          isActive: formData.get("isActive") === "on",
        });
        if (result.success) {
          closeForm();
          window.location.reload();
        } else {
          setError(result.error || "Failed to update staff member");
        }
      } else {
        const result = await createStaffMember({
          userId: formData.get("userId") as string,
          employeeId: formData.get("employeeId") as string || undefined,
          department: formData.get("department") as string,
          position: formData.get("position") as string || undefined,
          hireDate: formData.get("hireDate") as string || undefined,
          role: formData.get("role") as string || undefined,
        });
        if (result.success) {
          closeForm();
          window.location.reload();
        } else {
          setError(result.error || "Failed to add staff member");
        }
      }
    });
  }

  function toggleActive(member: StaffMember) {
    startTransition(async () => {
      const result = await updateStaffMember(member.id, { isActive: !member.isActive });
      if (!result.success) {
        setError(result.error || "Failed to update staff status");
      } else {
        window.location.reload();
      }
    });
  }

  function handleRoleChange(member: StaffMember, newRole: string) {
    startTransition(async () => {
      const result = await updateUserRole(member.userId, newRole);
      if (!result.success) {
        setError(result.error || "Failed to update role");
      } else {
        window.location.reload();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Staff & Roles</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage team members and their permissions.
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Staff Member
        </button>
      </div>

      {error && (
        <div className="rounded-[var(--radius-sm)] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {staff.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <Card key={member.id} hover className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-white font-semibold text-sm">
                    {member.firstName[0]}
                    {member.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="text-xs text-text-secondary flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", roleColors[member.role] || "bg-surface-secondary text-text-secondary border-border")}>
                  <ShieldCheck className="h-3 w-3" />
                  {roleLabels[member.role] || member.role}
                </span>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", member.isActive ? "bg-success/10 text-success" : "bg-surface-secondary text-text-secondary")}>
                  {member.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-text-secondary mb-1">Change Role</label>
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member, e.target.value)}
                  disabled={isPending}
                  className="w-full h-8 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-xs focus:border-brand focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-text-secondary space-y-1 mb-3">
                <p>Department: <span className="font-medium text-text-primary">{member.department}</span></p>
                {member.position && <p>Position: <span className="font-medium text-text-primary">{member.position}</span></p>}
                {member.employeeId && <p>Employee ID: <span className="font-medium text-text-primary">{member.employeeId}</span></p>}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  onClick={() => toggleActive(member)}
                  disabled={isPending}
                  className="text-xs font-medium text-text-secondary hover:text-brand disabled:opacity-50"
                >
                  {member.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => openEditForm(member)}
                  disabled={isPending}
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary hover:text-brand disabled:opacity-50"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <ShieldCheck className="h-10 w-10 text-text-disabled mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No staff members found. Add your first team member to get started.</p>
        </Card>
      )}

      {/* Staff Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-navy">
                {editingStaff ? "Edit Staff Member" : "Add Staff Member"}
              </h2>
              <button
                onClick={closeForm}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
              {!editingStaff && (
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">User ID (from auth.users)</label>
                  <input
                    type="text"
                    name="userId"
                    required
                    placeholder="Enter the user's UUID"
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                  <p className="text-xs text-text-disabled mt-1">The user must already have a profile in the system.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Department</label>
                  <select
                    name="department"
                    defaultValue={editingStaff?.department || ""}
                    required
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer"
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Position</label>
                  <input
                    type="text"
                    name="position"
                    defaultValue={editingStaff?.position || ""}
                    placeholder="e.g. Senior Sales Agent"
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Employee ID (optional)</label>
                  <input
                    type="text"
                    name="employeeId"
                    defaultValue={editingStaff?.employeeId || ""}
                    placeholder="e.g. EMP-001"
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                {!editingStaff && (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Hire Date</label>
                    <input
                      type="date"
                      name="hireDate"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Role</label>
                <select
                  name="role"
                  defaultValue={editingStaff?.role || "sales_rep"}
                  className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer"
                >
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {editingStaff && (
                <div>
                  <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={editingStaff.isActive}
                      className="h-4 w-4 rounded border-border"
                    />
                    Active
                  </label>
                </div>
              )}

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
                  {isPending ? "Saving..." : editingStaff ? "Update Staff Member" : "Add Staff Member"}
                  {!editingStaff && <UserPlus className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}