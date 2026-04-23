# Contributing

## Workflow

- Create focused branches for each task.
- Keep commits small and descriptive.
- Prefer feature branches such as `feat/product-detail` or
  `chore/docs-refresh`.

Recommended commit prefixes:

- `feat:`
- `fix:`
- `chore:`
- `refactor:`
- `docs:`

## Development Commands

Run from the repository root:

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

Useful targeted commands:

```bash
npm --prefix frontend run lint
npm --prefix frontend run typecheck
npm --prefix backend run lint
npm --prefix backend run typecheck
npm --prefix backend run test
```

## Quality Expectations

Before opening a PR or creating a release-ready commit:

1. Run `npm run lint`
2. Run `npm run typecheck`
3. Run `npm run test`
4. Run `npm run build` when the change affects app behavior or routing

## Code Style

- Use the existing shadcn/ui-first component system on the frontend.
- Reuse shared components before introducing new one-off UI patterns.
- Keep route entry files thin and move page logic into `src/features`.
- Prefer behavior-based docs and code organization over dumping everything into
  a single file.

## Documentation

Update docs when a change affects:

- routes
- scripts
- setup steps
- API behavior
- architecture decisions

See:

- [README.md](./README.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [docs/SETUP.md](./docs/SETUP.md)
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- [docs/API.md](./docs/API.md)
- [docs/ROADMAP.md](./docs/ROADMAP.md)
