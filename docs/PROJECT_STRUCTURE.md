# Project structure — Deal Car Rental / ديل لتأجير السيارات

Monorepo based on [BookCars](https://github.com/aelassas/bookcars). Paths below are relative to the repository root.

## Applications

| Path | Role |
|------|------|
| `frontend/` | Customer web (Vite + React + MUI) |
| `admin/` | Supplier & fleet admin (React) |
| `backend/` | REST API (Node.js + MongoDB) |
| `mobile/` | Customer app (Expo / React Native) |

## Shared packages

| Path | Role |
|------|------|
| `packages/bookcars-types/` | Shared TypeScript types |
| `packages/bookcars-helper/` | Shared helpers |
| `packages/currency-converter/` | Currency conversion |
| `packages/disable-react-devtools/` | DevTools guard |
| `packages/reactjs-social-login/` | Social login widget |

## Configuration & ops

| Path | Role |
|------|------|
| `docker-compose.yml` | Production-style stack (frontend nginx on host port **13080** → container 80) |
| `docker-compose.dev.yml` | Dev stack with hot reload |
| `__config/` | Internal config helpers |
| `__scripts/` | Automation (i18n, release helpers) |
| `__services/` | Auxiliary service definitions |
| `locales/` | Translation exports / JSON workflows (`README.txt`) |

## Quality & CI

| Path | Role |
|------|------|
| `.github/workflows/` | Build, test, and CI pipelines |
| `eslint.config.js` | Root ESLint |
| `pre-commit.js` / `.husky/` | Git hooks |

## Root metadata

| File | Role |
|------|------|
| `README.md` | Project overview & quick links |
| `LICENSE` | MIT (see file for upstream attribution) |
| `package.json` | Root scripts (`i18n:*`, `lint`, etc.) |

Do not rename `frontend/`, `backend/`, `admin/`, or `packages/` without updating all `Dockerfile` paths and `docker-compose` build contexts.
