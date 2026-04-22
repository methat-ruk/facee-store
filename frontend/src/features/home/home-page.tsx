import { BrandMark } from '@/components/brand-mark';
import { apiConfig } from '@/config/api';
import { appEnv } from '@/lib/env';

const stackItems = [
  'Next.js App Router',
  'NestJS API',
  'Zod validation',
  'Axios service layer',
  'Zustand state',
  'Prisma + PostgreSQL',
];

const setupItems = [
  'src/app, src/components, src/features, src/lib, src/services, src/store, src/schemas',
  'NestJS API structure under src/api with config and common layers',
  'Quality scripts for lint, lint:fix, typecheck, format, and project-wide check',
  'Health endpoint, security middleware, CORS, rate limiting, and environment parsing',
];

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-10 lg:px-12">
      <section className="grid flex-1 items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          <span className="inline-flex rounded-full border border-border bg-white/70 px-4 py-2 text-sm font-medium text-muted shadow-sm backdrop-blur">
            Full-stack skincare commerce starter
          </span>

          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Facee is ready for storefront, admin, and API development.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted">
              This setup gives the project a clean foundation for building a
              portfolio-ready skincare store with a polished frontend,
              structured backend, validation, state management, and deployment
              support.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {stackItems.map((item) => (
              <span
                key={item}
                className="rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-[0_24px_80px_rgba(132,83,60,0.12)] backdrop-blur">
          <div className="flex flex-col items-start gap-6">
            <BrandMark priority />
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted">
                Environment
              </p>
              <div className="space-y-2 rounded-2xl bg-white/80 p-4 text-sm text-muted">
                <p>
                  <span className="font-semibold text-foreground">
                    App URL:
                  </span>{' '}
                  {appEnv.appUrl}
                </p>
                <p>
                  <span className="font-semibold text-foreground">
                    API URL:
                  </span>{' '}
                  {appEnv.apiUrl}
                </p>
                <p>
                  <span className="font-semibold text-foreground">
                    Health Endpoint:
                  </span>{' '}
                  {apiConfig.endpoints.health}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted">
                Setup Highlights
              </p>
              <ul className="space-y-3 text-sm leading-7 text-muted">
                {setupItems.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
