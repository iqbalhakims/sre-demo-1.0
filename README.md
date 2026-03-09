# sre-demo — Notes App on Kubernetes

A 3-tier Notes application used as a Kubernetes proof-of-concept. It demonstrates a full-stack deployment (frontend → backend → database) running inside a dedicated namespace with proper resource management, health probes, and persistent storage.

## Architecture

```
Browser
  │
  ▼
┌─────────────────────────────────┐
│  Frontend (React + Vite)        │  Deployment, 2 replicas
│  Served by Nginx on port 80     │
│  Proxies /api/* → backend-svc   │
└────────────┬────────────────────┘
             │ HTTP /api/*
             ▼
┌─────────────────────────────────┐
│  Backend (Express + TypeScript) │  Deployment, 2 replicas
│  Listens on port 3000           │
│  REST API + DB health check     │
└────────────┬────────────────────┘
             │ TCP 5432
             ▼
┌─────────────────────────────────┐
│  Database (PostgreSQL 16)       │  StatefulSet, 1 replica
│  PVC: 1 Gi (ReadWriteOnce)      │
└─────────────────────────────────┘
```

All workloads run in the `notes-app` namespace.

## Repository Layout

```
sre-demo/
├── frontend/               # React 18 + Vite + TypeScript
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── types.ts
│   │   └── components/
│   │       ├── NoteForm.tsx
│   │       ├── NoteList.tsx
│   │       ├── HealthBadge.tsx
│   │       └── ArchInfo.tsx
│   ├── nginx.conf          # Nginx config — proxies /api to backend-svc
│   └── Dockerfile
├── backend/                # Express + TypeScript + pg
│   ├── src/server.ts       # REST API server
│   └── Dockerfile
└── k8s/                    # Kubernetes manifests
    ├── namespace.yaml
    ├── database/
    │   ├── secret.yaml     # Postgres credentials
    │   ├── pvc.yaml        # 1 Gi persistent volume claim
    │   ├── statefulset.yaml
    │   └── service.yaml
    ├── backend/
    │   ├── configmap.yaml  # DB_HOST, DB_PORT, DB_NAME, PORT
    │   ├── deployment.yaml
    │   └── service.yaml
    └── frontend/
        ├── deployment.yaml
        └── service.yaml
```

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Returns `{ status, db }` — used by liveness/readiness probes |
| GET | `/api/notes` | List all notes (newest first) |
| POST | `/api/notes` | Create a note — body: `{ "content": "..." }` |
| DELETE | `/api/notes/:id` | Delete a note by ID |

## Prerequisites

- Docker
- A running Kubernetes cluster (e.g. minikube, kind, or a cloud provider)
- `kubectl` configured to target the cluster

## Getting Started

### 1. Build & push images

```bash
# Backend
docker build -t <your-registry>/notes-backend:latest ./backend
docker push <your-registry>/notes-backend:latest

# Frontend
docker build -t <your-registry>/notes-frontend:latest ./frontend
docker push <your-registry>/notes-frontend:latest
```

Update the `image:` fields in [k8s/backend/deployment.yaml](k8s/backend/deployment.yaml) and [k8s/frontend/deployment.yaml](k8s/frontend/deployment.yaml) with your registry paths.

### 2. Update the database secret

Edit [k8s/database/secret.yaml](k8s/database/secret.yaml) and replace the placeholder password before applying:

```yaml
stringData:
  POSTGRES_DB:       notesdb
  POSTGRES_USER:     notesuser
  POSTGRES_PASSWORD: <your-strong-password>   # change this
```

### 3. Apply manifests

```bash
kubectl apply -f k8s/namespace.yaml

# Database first — backend depends on it
kubectl apply -f k8s/database/

# Backend
kubectl apply -f k8s/backend/

# Frontend
kubectl apply -f k8s/frontend/
```

### 4. Verify

```bash
kubectl get all -n notes-app
```

All pods should reach `Running` / `Ready` status.

### 5. Access the app

Depending on how your cluster exposes services, use port-forwarding for local access:

```bash
kubectl port-forward svc/frontend-svc 8080:80 -n notes-app
```

Then open `http://localhost:8080` in your browser.

## Local Development (without Kubernetes)

### Backend

```bash
cd backend
npm install
# Requires a local Postgres instance
DB_HOST=localhost DB_USER=postgres DB_PASSWORD=postgres npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> The Vite dev server proxies `/api` requests — update `vite.config.ts` if your backend runs on a different port.

## Kubernetes Resource Summary

| Component | Kind | Replicas | CPU Request/Limit | Memory Request/Limit |
|-----------|------|----------|-------------------|----------------------|
| frontend | Deployment | 2 | 20m / 100m | 32Mi / 128Mi |
| backend | Deployment | 2 | 50m / 200m | 64Mi / 256Mi |
| postgres | StatefulSet | 1 | 100m / 500m | 128Mi / 512Mi |

## Health Probes

- **Frontend** — readiness: `GET /` on port 80
- **Backend** — readiness & liveness: `GET /api/health` on port 3000 (also verifies DB connectivity)
- **Postgres** — readiness & liveness: `pg_isready -U notesuser -d notesdb`
