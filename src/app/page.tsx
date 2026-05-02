import { SignInButton } from '@/components/sign-in-button'

export default function LandingPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-zinc-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          Cognitive Load Balancer
        </h1>
        <p className="mt-3 text-lg text-zinc-500">
          A study workspace that adapts to your energy level.
        </p>
      </div>
      <SignInButton />
    </div>
  )
}
