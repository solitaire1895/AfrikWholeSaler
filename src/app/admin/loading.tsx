import { getT } from "@/i18n/server";

export default async function Loading() {
  const t = await getT();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-sm text-text-secondary">{t.common.loading}</p>
      </div>
    </div>
  );
}
