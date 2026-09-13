export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-10 rounded-xl bg-muted/40" />
        <div className="h-8 w-64 rounded-lg bg-muted/40" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="h-28 rounded-xl bg-white shadow-sm" />
        <div className="h-28 rounded-xl bg-white shadow-sm" />
      </div>
      <div className="space-y-3">
        <div className="h-40 rounded-xl bg-white shadow-sm" />
        <div className="h-24 rounded-xl bg-white shadow-sm" />
      </div>
    </div>
  );
}