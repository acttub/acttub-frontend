export default function Home() {
  return (
    <main className="flex min-h-svh flex-1 items-center bg-background px-6 py-12">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            Frontend foundation
          </p>
          <h1 className="text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
            Acttub frontend
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui,
            TanStack Query, React Hook Form, Zod, Zustand, and Vitest are ready.
          </p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 text-card-foreground">
            <dt className="text-sm text-muted-foreground">Framework</dt>
            <dd className="mt-2 text-lg font-medium">Next.js App Router</dd>
          </div>
          <div className="rounded-lg border bg-card p-4 text-card-foreground">
            <dt className="text-sm text-muted-foreground">UI</dt>
            <dd className="mt-2 text-lg font-medium">Tailwind + shadcn/ui</dd>
          </div>
          <div className="rounded-lg border bg-card p-4 text-card-foreground">
            <dt className="text-sm text-muted-foreground">Quality</dt>
            <dd className="mt-2 text-lg font-medium">ESLint + Vitest</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
