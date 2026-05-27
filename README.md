# Farmer Portal

Farmer Portal is a Next.js + TypeScript web application used to support farmer workflows such as authentication, farm listing, farm detail views, and profile navigation.

The app uses the Next.js App Router. In local development it can proxy backend APIs via `next.config.ts` rewrites. The production Docker image runs **`next start`** using Next’s **standalone** output (see `Dockerfile`).

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- ESLint
- Docker / Docker Compose
- Kubernetes manifests under `deploy/k8s/`
- GitLab CI (`.gitlab-ci.yml`) for build and deploy to EKS

## Project Structure

- `src/app/`: App Router pages, layouts, and route groups
- `src/components/`: reusable UI building blocks
- `src/screens/`: screen-level containers for major user flows
- `src/services/`: API clients and HTTP helpers
- `src/auth/`: auth state, context, and session utilities
- `deploy/k8s/`: Kubernetes `Deployment`, `Service`, and environment-specific `Ingress` (test / prod)
- `docker/`: legacy static-hosting nginx sample (not used by the current Node image)

## Prerequisites

- Node.js 22+
- npm 10+

## Environment Variables

Create an environment file (for example, `.env.local` in development) and define the variables below.

- **`NEXT_PUBLIC_API_BASE_URL`**
  - **Local `next dev`:** leave empty to use same-origin `/api` with Next rewrites to `DEV_PROXY_TARGET`.
  - **Production builds** (including the Docker image build): **required**, HTTPS only, and must be one of:
    - `https://backend.varahaag.com`
    - `https://backendtest.varahaag.com`
- **`NEXT_PUBLIC_GOOGLE_MAP_API_KEY`**
  - Browser-exposed Google Maps key (baked in at **image build** time for Docker; optional for local dev if you do not use map features).
- **`DEV_PROXY_TARGET`** (optional, local development only)
  - Backend base URL for Next rewrite proxy. Defaults to `http://localhost:8000`.

For **Docker Compose** builds, pass the same `NEXT_PUBLIC_*` values via a `.env` file next to `docker-compose.yml` or your shell; compose forwards them as `build.args` (see `docker-compose.yml`).

## Local Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev`: start local dev server
- `npm run build`: Next production build (emits `.next` and **standalone** output for Docker)
- `npm run start`: start the production server locally after `npm run build` (listens on `0.0.0.0`, default port **3000** unless `PORT` is set)
- `npm run lint`: run ESLint
- `npm run typecheck`: run TypeScript checks

## Docker

The image runs **`node server.js`** (Next **standalone**) on port **80** inside the container. **`GET /healthz`** is implemented in the app for health checks (replacing the old nginx-only probe).

Build manually (set API URL and optional map key):

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://backend.varahaag.com \
  --build-arg NEXT_PUBLIC_GOOGLE_MAP_API_KEY=your-browser-key \
  -t farmer-portal:local .
```

Run with Compose (defaults in `docker-compose.yml`; override with `.env` or env vars):

```bash
docker compose up --build
```

- Service name: **`web`**
- Host port: **`${WEB_PORT:-8080}`** → container **80**
- Image tag default: **`farmer-portal:local`**

## Kubernetes deployment

Manifests live under **`deploy/k8s/`**:

| File                | Purpose                                                                       |
| ------------------- | ----------------------------------------------------------------------------- |
| `deployment.yaml`   | Deployment (`farmer-portal`); image placeholder `DOCKER_IMAGE` replaced in CI |
| `service.yaml`      | ClusterIP, port 80 → pod port `http` (container **80**)                       |
| `test/ingress.yaml` | ALB ingress for test (e.g. host `farmer-portal-test.varaha.com`)              |
| `prod/ingress.yaml` | ALB ingress for production                                                    |

Apply to your namespace (example: `platform`):

```bash
kubectl apply -n platform -f deploy/k8s/deployment.yaml
kubectl apply -n platform -f deploy/k8s/service.yaml
kubectl apply -n platform -f deploy/k8s/test/ingress.yaml   # or prod/ingress.yaml
```

GitLab CI: **`development`** runs **validate** only; **`test`** builds the image and deploys to the test cluster; **`main`** builds and can deploy to production (manual deploy job), using the same `deployment.yaml` / `service.yaml` and the appropriate ingress file.

## Documentation

In addition to this README, two long-form docs live under `docs/`:

| Doc | What it covers | Audience |
| --- | --- | --- |
| [`docs/ARCHITECTURE_AND_SDLC.md`](docs/ARCHITECTURE_AND_SDLC.md) | End-to-end mental model: HTTPS, environments, frontend layering, auth, bootstrap, document gating, i18n, principles, build & deploy, security checklist, "how to add a new API" cookbook. | New engineers, product, ops. |
| [`docs/API_INTEGRATION.md`](docs/API_INTEGRATION.md) | The authoritative backend API contract: every endpoint the portal consumes, request/response shapes, status enums, sequence diagrams for every flow, and the list of "MUST ship" / "SHOULD ship" backend asks. | Backend engineers, integration. |

## Notes

- Do not put secrets in `NEXT_PUBLIC_*` variables; they ship in the client bundle.
