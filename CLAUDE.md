# Budget Tracking App

## Identity

This workstation is the Budget Tracking App for Formed's Licensing Budget, Roadmap, Content Review, public demo pages, and related internal planning workflows. Route here for all development, debugging, and deployment work on this app. Do not route here for Formed content strategy or email work.

## Communication

Matt does not have a formal technical background. Explain practical meaning first, then the technical reason when it helps him learn.

## Deployment Rule

Never deploy or push anything for this app to Vercel.

Always deploy production releases to Cloudflare Workers:

1. Run `npm run cf:build`.
2. Run `npm run cf:deploy`.
3. Verify `https://app.formedlicensing.workers.dev`.

Do not use Vercel CLI, Vercel MCP tools, Vercel project lookup, or Vercel aliases for this app unless Matt explicitly overrides this instruction in the same turn.

## Standard Verification

For ordinary code changes, use the relevant subset of:

- `npm test`
- `npm run lint`
- `npm run build`
- `git diff --check`
- Browser-visible verification for meaningful UI changes
- Live smoke checks after Cloudflare deploy:
  - `/login` returns 200
  - signed-out protected pages, such as `/content-review`, redirect to `/login`
  - relevant public demo pages return 200

## Working Rules

- Check `git status` before editing, committing, pushing, or deploying.
- Never deploy code that is not committed. Commit and push exactly what you deploy, so production never runs code that exists nowhere else. Before deploying, confirm the working tree is clean and that local `main` is not behind `origin/main`; if it is behind, inspect the upstream commits and merge them in rather than overwriting them.
- Keep releases narrowly scoped unless Matt explicitly asks to ship the whole tree.
- Do not revert unrelated user changes.
- Stage only intentional files unless Matt asks for everything.
- Keep private secrets private. Never summarize `.env`, `.env.local`, API keys, tokens, or credentials into memory.
- For Supabase schema changes, verify types/actions/schema together and run the relevant Supabase dry-run/push/query checks before deployment.
