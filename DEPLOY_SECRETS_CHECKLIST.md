# Deploy quick-fill checklist (branch: `prod`)

## 1) GitHub Secrets (Repository -> Settings -> Secrets and variables -> Actions)

Required:

- `DEPLOY_HOST` — server IP/domain  
  Example: `1.2.3.4`
- `DEPLOY_PORT` — SSH port  
  Example: `22`
- `DEPLOY_USER` — SSH user  
  Example: `deploy`
- `DEPLOY_SSH_KEY` — private SSH key (full content, with BEGIN/END lines)
- `DEPLOY_PATH` — absolute path where compose files are stored  
  Example: `/opt/casehub`
- `REGISTRY_USER` — container registry user (GHCR/DockerHub)
- `REGISTRY_TOKEN` — token/password for pulling images

---

## 2) Server `.env` (file: `${DEPLOY_PATH}/.env`)

Minimal required for current compose:

```env
# app images
FRONTEND_IMAGE=ghcr.io/your-org/frontend:prod
AUTHSERVICE_IMAGE=ghcr.io/your-org/authservice:prod
AMLSERVICE_IMAGE=ghcr.io/your-org/amlservice:prod
USERSERVICE_IMAGE=ghcr.io/your-org/userservice:prod
CASESSERVICE_IMAGE=ghcr.io/your-org/casesservice:prod
ADMINSERVICE_IMAGE=ghcr.io/your-org/adminservice:prod
PAYMENTSERVICE_IMAGE=ghcr.io/your-org/paymentservice:prod

# rustfs / s3
RUSTFS_ACCESS_KEY=change_me
RUSTFS_SECRET_KEY=change_me
S3_BUCKET=casehub
S3_PUBLIC_URL=https://files.your-domain.com

# optional but recommended
FRONTEND_URL=https://your-frontend-domain.com
VITE_API_BASE_URL=https://your-domain.com/api
MONGO_EXPRESS_USER=admin
MONGO_EXPRESS_PASSWORD=strong_password
GRAFANA_USER=admin
GRAFANA_PASSWORD=strong_password
GRAFANA_ROOT_URL=https://your-domain.com
GRAFANA_TARGET_ID=f47ac10b-58cc-4372-a567-0e02b2c3d479
```

---

## 3) SSH key quick setup

On local machine:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy"
```

- Public key (`.pub`) -> add to server: `~/.ssh/authorized_keys` for `DEPLOY_USER`
- Private key (without `.pub`) -> GitHub Secret `DEPLOY_SSH_KEY`

---

## 4) One-time server check

```bash
cd /opt/casehub
docker login ghcr.io -u "<REGISTRY_USER>" -p "<REGISTRY_TOKEN>"
docker compose pull
docker compose up -d --remove-orphans
docker compose ps
```

If this works manually, GitHub Actions deploy will work too.
