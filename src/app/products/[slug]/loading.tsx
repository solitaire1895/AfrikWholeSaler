export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image skeleton */}
        <div className="aspect-square rounded-[var(--radius-card)] bg-surface-secondary animate-pulse" />

        {/* Content skeleton */}
        <div className="space-y-4">
          {/* Category & rating */}
          <div className="flex items-center gap-3">
            <div className="h-4 w-24 rounded bg-surface-secondary animate-pulse" />
            <div className="h-4 w-16 rounded bg-surface-secondary animate-pulse" />
          </div>

          {/* Title */}
          <div className="h-8 w-3/4 rounded bg-surface-secondary animate-pulse" />

          {/* Price */}
          <div className="space-y-2">
            <div className="h-6 w-32 rounded bg-surface-secondary animate-pulse" />
            <div className="h-4 w-48 rounded bg-surface-secondary animate-pulse" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-surface-secondary animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-surface-secondary animate-pulse" />
            <div className="h-4 w-4/6 rounded bg-surface-secondary animate-pulse" />
          </div>

          {/* Specs */}
          <div className="space-y-2 pt-4">
            <div className="h-5 w-20 rounded bg-surface-secondary animate-pulse" />
            <div className="h-4 w-full rounded bg-surface-secondary animate-pulse" />
            <div className="h-4 w-full rounded bg-surface-secondary animate-pulse" />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <div className="h-10 w-32 rounded-[var(--radius-button)] bg-surface-secondary animate-pulse" />
            <div className="h-10 w-32 rounded-[var(--radius-button)] bg-surface-secondary animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
