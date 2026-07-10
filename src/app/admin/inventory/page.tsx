import { PackageCheck, AlertTriangle, TrendingDown, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { products } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function AdminInventoryPage() {
  const inStock = products.filter((p) => p.stockStatus === "In Stock").length;
  const lowStock = products.filter((p) => p.stockStatus === "Low Stock").length;
  const outOfStock = products.filter((p) => p.stockStatus === "Out of Stock").length;
  const preOrder = products.filter((p) => p.stockStatus === "Pre-Order").length;

  const stats = [
    { label: "In Stock", value: inStock, icon: PackageCheck, color: "text-success", bg: "bg-success/10" },
    { label: "Low Stock", value: lowStock, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
    { label: "Out of Stock", value: outOfStock, icon: TrendingDown, color: "text-error", bg: "bg-error/10" },
    { label: "Pre-Order", value: preOrder, icon: Package, color: "text-info", bg: "bg-info/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">Inventory</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Monitor stock levels and manage inventory across products.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] mb-3", stat.bg)}>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <p className="text-2xl font-bold text-navy">{stat.value}</p>
            <p className="text-xs text-text-secondary mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Stock Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">MOQ</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-surface-secondary/30">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-text-primary truncate max-w-[200px]">{product.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-secondary">{product.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      product.stockStatus === "In Stock" ? "bg-success/10 text-success" :
                      product.stockStatus === "Low Stock" ? "bg-warning/10 text-warning" :
                      product.stockStatus === "Out of Stock" ? "bg-error/10 text-error" :
                      "bg-info/10 text-info"
                    )}>
                      {product.stockStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-text-secondary">{product.moq}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-border px-3 text-xs font-medium text-text-primary hover:bg-surface-secondary">
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}