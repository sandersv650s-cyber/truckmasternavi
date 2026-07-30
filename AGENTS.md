# Repository guidelines

TruckMate Connect is maintained as a standalone application.

- Use `demo/functionele-demo` for ongoing migration and demo work.
- Keep GitHub as the source of truth.
- Do not add platform-specific build or runtime dependencies without a clear technical reason.
- Run `npm run check` before merging changes into `main`.
- Never commit secrets or real API keys. Use `.env.local` for local development and hosting environment variables for deployments.
- Treat `src/routeTree.gen.ts` as generated output; regenerate it through the TanStack tooling rather than editing it manually.
