import { Skeleton } from '@/components/atoms/ui/skeleton';

export default function AuthedLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <Skeleton className="h-10 w-1/3" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
