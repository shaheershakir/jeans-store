import { AuthFormSkeleton } from '@/components/skeletons/StorefrontSkeletons'

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <AuthFormSkeleton />
    </div>
  )
}
