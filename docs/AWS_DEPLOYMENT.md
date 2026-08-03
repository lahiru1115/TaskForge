# TaskForge — AWS Deployment Guide

**Architecture:**
- **Backend** → EC2 t2.micro (Ubuntu) + nginx + PM2
- **Frontend** → AWS Amplify (GitHub auto-deploy, CDN)
- **Database** → MongoDB Atlas (already configured)

---

## Prerequisites

- AWS account with free tier active
- GitHub repo with the TaskForge code pushed to `main`
- MongoDB Atlas cluster (connection string ready)

---

## Phase 1 — EC2 Backend

### 1.1 Launch EC2 instance

- **AMI:** Ubuntu 22.04 LTS
- **Type:** t2.micro (free tier)
- **Security group inbound rules:**
  - Port 22 (SSH) — your IP only
  - Port 80 (HTTP) — 0.0.0.0/0
  - Port 443 (HTTPS) — 0.0.0.0/0 (for future SSL)

### 1.2 Connect and install dependencies

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 (process manager)
sudo npm install -g pm2

# nginx (reverse proxy)
sudo apt-get install -y nginx
```

### 1.3 Clone and build

```bash
git clone <your-github-repo-url> taskforge
cd taskforge/taskforge-backend

npm install
npm run build     # TypeScript → dist/server.js
```

### 1.4 Set environment variables

```bash
nano .env
```

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=<your Atlas connection string>
JWT_SECRET=<long cryptographically random string>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://<your-amplify-domain>.amplifyapp.com
```

> Port `3001` is internal — nginx proxies public port 80 → 3001.

### 1.5 Start with PM2

```bash
# From repo root
cd ~/taskforge
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup     # run the printed command to survive reboots
```

### 1.6 Configure nginx

```bash
sudo nano /etc/nginx/sites-available/taskforge
```

```nginx
server {
    listen 80;
    server_name <EC2_PUBLIC_IP>;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/taskforge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Backend live at: `http://<EC2_PUBLIC_IP>/api/...`

---

## Phase 2 — Amplify Frontend

### 2.1 Connect GitHub repo

1. AWS Console → **Amplify** → Create new app
2. Choose **GitHub** → authorise → select repo and `main` branch
3. Amplify detects `amplify.yml` automatically — confirm build settings

### 2.2 Set environment variable

Amplify Console → **Environment variables:**

```
VITE_API_URL = http://<EC2_PUBLIC_IP>
```

> Switch to HTTPS once SSL is configured on EC2.

### 2.3 Configure SPA routing

Amplify Console → **Rewrites and redirects** → Add rule:

| Source | Target | Type |
|--------|--------|------|
| `</^[^.]+$\|\.(?!(css\|gif\|ico\|jpg\|js\|png\|txt\|svg\|woff\|woff2\|ttf\|map\|json)$)([^.]+$)/>` | `/index.html` | 200 (Rewrite) |

This lets React Router handle all client-side routes.

### 2.4 Deploy

Click **Save and deploy** → app is published at `https://<name>.amplifyapp.com`

---

## Phase 3 — Wire CORS

Update `CLIENT_ORIGIN` in the backend `.env` on EC2:

```env
CLIENT_ORIGIN=https://<your-app>.amplifyapp.com
```

Restart: `pm2 restart taskforge-api`

---

## Verification

| Check | Expected |
|-------|----------|
| `http://<EC2_IP>/api/auth/me` in browser | `{"message":"Unauthorized"}` (not 502) |
| Visit Amplify URL | Login page loads, no console errors |
| Log in with demo credentials | Dashboard loads, tasks visible |
| Navigate directly to `<amplify-url>/tasks` | Page loads (not 404) |
| DevTools → Cookies | `tf_token` with HttpOnly flag present |
| Browser console | No CORS errors |

---

## Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@taskforge.com` | `admin123` | Admin |
| `jane@taskforge.com` | `user1234` | User |

Run `npm run seed` inside `taskforge-backend/` on EC2 to populate demo data.

---

## Optional: Free SSL with Certbot

Requires a custom domain pointed to the EC2 IP (A record):

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Then update `VITE_API_URL` in Amplify and `CLIENT_ORIGIN` in EC2 `.env` to use `https://`.

---

## Optional: Auto-deploy Backend on Push

Add `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy backend
on:
  push:
    branches: [main]
    paths: ['taskforge-backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: SSH and deploy
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd ~/taskforge
            git pull origin main
            cd taskforge-backend
            npm install
            npm run build
            pm2 restart taskforge-api
```

Add `EC2_HOST` and `EC2_SSH_KEY` as GitHub repo secrets.
