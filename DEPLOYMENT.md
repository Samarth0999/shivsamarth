# 🚀 Deployment Guide — ShivSamarth Motor Driving School

This application is packaged as a unified, production-ready full-stack Node.js + React web application. The Express server serves both the REST API (`/api/*`) and the compiled Vite React Single Page Application (`/*`).

---

## 📋 System Requirements
* **Node.js**: v18.0.0 or later (LTS v20 recommended)
* **npm**: v9.0.0 or later

---

## ⚡ Quick Production Start (Local / Self-Hosted)

```bash
# 1. Install root and client dependencies
npm install

# 2. Build production frontend bundle
npm run build

# 3. Start unified production server
npm start
```
The application will be live at `http://localhost:5000`.

---

## 🌐 Cloud Deployment Options

### Option 1: Render.com (Recommended for Free/Low-Cost Cloud Hosting)
1. Create a **New Web Service** and connect your GitHub repository.
2. Configure settings:
   * **Environment**: `Node`
   * **Node Version**: `20`
   * **Build Command**: `npm run build`
   * **Start Command**: `npm start`
3. Add Environment Variables:
   * `NODE_ENV` = `production`
   * `JWT_SECRET` = *(Generate a secure random string)*
4. *(Optional for Persistence)*:
   * Add a Persistent Disk mounted at `/data` (e.g. 1 GB).
   * Add env var: `DB_PATH` = `/data/driving_school.sqlite`.

---

### Option 2: Railway.app
1. Click **New Project** → **Deploy from GitHub repo**.
2. Railway detects the Node.js project and `Dockerfile` or `package.json` automatically.
3. In Service Settings, configure variables:
   * `NODE_ENV` = `production`
   * `PORT` = `5000` (or Railway's `$PORT`)
   * `JWT_SECRET` = *(Your secret)*
4. Add a Volume mounted at `/app/data` to persist the SQLite database.

---

### Option 3: Docker & Docker Compose
A multi-stage `Dockerfile` and `docker-compose.yml` are included in the repository.

```bash
# Build and run container in detached mode
docker compose up -d --build

# View container logs
docker compose logs -f

# Stop container
docker compose down
```
The database is stored in a Docker named volume `driving_school_data`, ensuring zero data loss across container restarts and updates.

---

### Option 4: Linux VPS (Ubuntu / Debian with PM2 & Nginx)

#### 1. Server Setup
```bash
# Update system & install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# Install PM2 process manager
sudo npm install -g pm2
```

#### 2. Deploy Project
```bash
# Clone and enter project
git clone <your-repo-url> /var/www/driving-school
cd /var/www/driving-school

# Set up environment variables
cp .env.example .env
nano .env

# Install and build
npm install
npm run build

# Start with PM2
pm2 start server/index.js --name "driving-school"
pm2 save
pm2 startup
```

#### 3. Nginx Reverse Proxy Config (`/etc/nginx/sites-available/driving-school`)
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/driving-school /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Optional: Add free SSL with Certbot
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 🔒 Production Security Checklist
- [x] Set a unique, high-entropy `JWT_SECRET` in environment variables.
- [x] Verify SQLite WAL mode enabled for high-concurrency read/writes.
- [x] Automatic database schema and initial branch seed initialization.
- [x] Graceful process termination (`SIGTERM` / `SIGINT`) closing active database locks.
- [x] SPA client routing fallback configured on non-API routes.
