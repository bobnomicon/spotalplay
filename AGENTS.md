# Repository Guidelines

## Project Structure & Module Organization

Source files live in `src/`. The main CLI flow is in `src/index.ts`, the OAuth callback server is `src/server.ts`, and Spotify API concerns are split across `src/auth.ts`, `src/albums.ts`, and `src/playlists.ts`. Shared types and helpers live in `src/types.ts`, `src/utils.ts`, `src/input.ts`, and `src/envs.ts`. Environment setup is documented in `.env.example`. There is no dedicated `tests/` directory yet.

## Build, Test, and Development Commands

Use Bun for all local work.

- `bun install` installs dependencies.
- `bun run server` starts the local callback server on the redirect URI used during Spotify auth.
- `bun run start` runs the CLI that reads input, authorizes the user, fetches liked albums, and creates playlists.
- `bunx tsc --noEmit` performs a strict TypeScript type check using `tsconfig.json`.
- `bun test` is the expected test command when tests are added.

Run `bun run server` in one terminal and `bun run start` in another during manual testing.

## Coding Style & Naming Conventions

This repository uses TypeScript with `strict` mode enabled. Follow the existing style: 2-space indentation, semicolons, single quotes, and small focused modules under `src/`. Use `camelCase` for variables and functions, `PascalCase` for types, and descriptive filenames such as `playlists.ts` or `albums.ts`. Prefer Bun-native workflows over Node-specific tooling.

## Testing Guidelines

There are currently no committed automated tests. When adding coverage, use Bun’s test runner with files named `*.test.ts` placed alongside the module under test or in a small `tests/` directory. Prioritize coverage for pagination logic, playlist splitting, and auth/error handling. Before opening a PR, at minimum run the app manually with `.env` values populated and run `bunx tsc --noEmit`.

## Commit & Pull Request Guidelines

Recent commits use short, imperative summaries such as `Remove a couple nested ifs so is cleaner` and `Update readme with more details`. Keep commits focused and descriptive. PRs should include:

- a brief summary of behavior changes,
- any Spotify auth or `.env` setup impacts,
- manual verification steps,
- screenshots or terminal output only when they clarify a user-facing flow.

## Security & Configuration Tips

Do not commit real Spotify credentials. Copy `.env.example` to `.env`, keep `SPOTIFY_REDIRECT_URI` aligned with your Spotify app settings, and treat access tokens as local-only secrets.
