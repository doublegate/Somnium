# Somnium Server Deployment Guide

Complete guide for deploying Somnium v2.0 backend services in production.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Cloud Platform Guides](#cloud-platform-guides)
6. [Environment Configuration](#environment-configuration)
7. [Security Considerations](#security-considerations)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Somnium v2.0 consists of two backend services:

1. **API Server** (`api-server.js`) - Express REST API
   - Port: 3000 (default)
   - Features: Authentication, cloud saves, social sharing
   - Protocol: HTTP/HTTPS

2. **Multiplayer Server** (`multiplayer-server.js`) - WebSocket Server
   - Port: 8080 (default)
   - Features: Real-time multiplayer, chat, session management
   - Protocol: WebSocket (ws/wss)

Both servers can run independently or together on the same machine.

---

## Prerequisites

### System Requirements

- **Node.js**: v18.x or v20.x (required)
- **npm**: v8.x or higher
- **RAM**: Minimum 512MB (1GB+ recommended)
- **Disk**: 100MB for code + storage for user data
- **Network**: Open ports 3000 and 8080 (or configured ports)

### For Production

- SSL Certificate (for HTTPS/WSS)
- Domain name (optional but recommended)
- Reverse proxy (Nginx or Apache)
- Process manager (PM2 recommended)

---

## Local Development Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

This installs:
- `express` (^4.18.2) - Web framework
- `cors` (^2.8.5) - Cross-origin resource sharing
- `ws` (^8.14.2) - WebSocket library
- `dotenv` (^16.3.1) - Environment variable management

### 2. Configure Environment

Create `.env` file in `server/` directory:

```env
# Server Ports
PORT=3000
MULTIPLAYER_PORT=8080

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=another-secret-key-for-sessions

# CORS (for development)
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:8080

# File Storage
STORAGE_PATH=./storage

# Logging
LOG_LEVEL=info
```

### 3. Create Storage Directories

```bash
mkdir -p storage/users storage/saves storage/shared
```

### 4. Run Development Servers

```bash
# Run both servers concurrently
npm run start:all

# Or run individually
npm run start              # API server only
npm run start:multiplayer  # Multiplayer server only

# Development mode with auto-reload (requires nodemon)
npm run dev
```

### 5. Verify Setup

**API Server** - Test endpoint:
```bash
curl http://localhost:3000/api/health
```

**Multiplayer Server** - Check WebSocket:
```bash
# Using wscat (install with: npm install -g wscat)
wscat -c ws://localhost:8080
```

---

## Production Deployment

### Option 1: PM2 Process Manager (Recommended)

PM2 keeps servers running, auto-restarts on crashes, and provides monitoring.

#### Install PM2

```bash
npm install -g pm2
```

#### Create PM2 Ecosystem File

Create `ecosystem.config.js` in `server/`:

```javascript
module.exports = {
  apps: [
    {
      name: 'somnium-api',
      script: './api-server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true
    },
    {
      name: 'somnium-multiplayer',
      script: './multiplayer-server.js',
      instances: 1,  // WebSocket requires sticky sessions
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        MULTIPLAYER_PORT: 8080
      },
      error_file: './logs/multiplayer-error.log',
      out_file: './logs/multiplayer-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
```

#### Start Services

```bash
# Create logs directory
mkdir -p logs

# Start all services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

#### PM2 Commands

```bash
# Status
pm2 status
pm2 monit

# Logs
pm2 logs
pm2 logs somnium-api
pm2 logs somnium-multiplayer

# Restart
pm2 restart all
pm2 restart somnium-api

# Stop
pm2 stop all
pm2 delete all
```

### Option 2: systemd Service (Linux)

#### Create Service Files

**API Server** (`/etc/systemd/system/somnium-api.service`):

```ini
[Unit]
Description=Somnium API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/somnium/server
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node /var/www/somnium/server/api-server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=somnium-api

[Install]
WantedBy=multi-user.target
```

**Multiplayer Server** (`/etc/systemd/system/somnium-multiplayer.service`):

```ini
[Unit]
Description=Somnium Multiplayer Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/somnium/server
Environment=NODE_ENV=production
Environment=MULTIPLAYER_PORT=8080
ExecStart=/usr/bin/node /var/www/somnium/server/multiplayer-server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=somnium-multiplayer

[Install]
WantedBy=multi-user.target
```

#### Enable and Start Services

```bash
sudo systemctl daemon-reload
sudo systemctl enable somnium-api somnium-multiplayer
sudo systemctl start somnium-api somnium-multiplayer

# Check status
sudo systemctl status somnium-api
sudo systemctl status somnium-multiplayer

# View logs
sudo journalctl -u somnium-api -f
sudo journalctl -u somnium-multiplayer -f
```

### Option 3: Docker Deployment

#### Create Dockerfile

Create `server/Dockerfile`:

```dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create storage directory
RUN mkdir -p storage/users storage/saves storage/shared

# Expose ports
EXPOSE 3000 8080

# Start services
CMD ["npm", "run", "start:all"]
```

#### Create docker-compose.yml

```yaml
version: '3.8'

services:
  somnium-servers:
    build: ./server
    ports:
      - "3000:3000"
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MULTIPLAYER_PORT=8080
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./server/storage:/usr/src/app/storage
      - ./server/logs:/usr/src/app/logs
    restart: unless-stopped
    networks:
      - somnium-network

networks:
  somnium-network:
    driver: bridge
```

#### Deploy with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Cloud Platform Guides

### Heroku Deployment

#### 1. Create Heroku Apps

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create apps
heroku create somnium-api
heroku create somnium-multiplayer
```

#### 2. Configure Buildpacks

```bash
# Both apps use Node.js
heroku buildpacks:set heroku/nodejs -a somnium-api
heroku buildpacks:set heroku/nodejs -a somnium-multiplayer
```

#### 3. Set Environment Variables

```bash
# API Server
heroku config:set NODE_ENV=production -a somnium-api
heroku config:set JWT_SECRET=your-secret-key -a somnium-api

# Multiplayer Server
heroku config:set NODE_ENV=production -a somnium-multiplayer
```

#### 4. Create Procfile

```
# Procfile for API
web: node api-server.js

# Procfile for Multiplayer
web: node multiplayer-server.js
```

#### 5. Deploy

```bash
git push heroku main
```

### AWS EC2 Deployment

#### 1. Launch EC2 Instance

- AMI: Ubuntu 22.04 LTS
- Instance Type: t3.micro or larger
- Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000, 8080

#### 2. Connect and Setup

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install nginx -y

# Install PM2
sudo npm install -g pm2
```

#### 3. Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/doublegate/Somnium.git
cd Somnium/server

# Install dependencies
sudo npm ci --only=production

# Configure environment
sudo nano .env

# Start with PM2
sudo pm2 start ecosystem.config.js
sudo pm2 save
sudo pm2 startup
```

#### 4. Configure Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/somnium

server {
    listen 80;
    server_name your-domain.com;

    # API Server
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket Server
    location /multiplayer/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # Static files (game)
    location / {
        root /var/www/Somnium;
        index index.html;
        try_files $uri $uri/ =404;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/somnium /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### DigitalOcean App Platform

#### 1. Create App Spec

Create `app.yaml`:

```yaml
name: somnium
services:
  - name: api
    source_dir: server
    build_command: npm install
    run_command: node api-server.js
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        value: ${JWT_SECRET}
        type: SECRET
    http_port: 3000

  - name: multiplayer
    source_dir: server
    build_command: npm install
    run_command: node multiplayer-server.js
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
    http_port: 8080

static_sites:
  - name: game
    source_dir: /
    github:
      repo: doublegate/Somnium
      branch: main
      deploy_on_push: true
```

#### 2. Deploy

```bash
doctl apps create --spec app.yaml
```

---

## Environment Configuration

### Complete `.env` Template

```env
# ========================================
# Somnium Server Configuration
# ========================================

# --- Server Ports ---
PORT=3000
MULTIPLAYER_PORT=8080

# --- Security ---
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-jwt-secret-key-min-32-chars
SESSION_SECRET=your-session-secret-key-min-32-chars

# --- CORS Configuration ---
# Comma-separated list of allowed origins
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# --- File Storage ---
# Directory for user data, saves, shared worlds
STORAGE_PATH=./storage

# --- Database (Optional - Future Enhancement) ---
# DATABASE_URL=postgresql://user:pass@localhost:5432/somnium

# --- Redis (Optional - For Session Storage) ---
# REDIS_URL=redis://localhost:6379

# --- Logging ---
# Levels: error, warn, info, debug
LOG_LEVEL=info
LOG_FILE=./logs/server.log

# --- Rate Limiting ---
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# --- WebSocket Configuration ---
WS_HEARTBEAT_INTERVAL=30000  # 30 seconds
WS_HEARTBEAT_TIMEOUT=5000    # 5 seconds

# --- Session Configuration ---
SESSION_MAX_AGE=86400000     # 24 hours

# --- File Upload Limits ---
MAX_SAVE_SIZE_MB=10
MAX_WORLD_SIZE_MB=5
```

### Generating Secure Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate session secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Security Considerations

### 1. SSL/TLS Configuration

**Using Let's Encrypt with Nginx:**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 2. Firewall Configuration

```bash
# UFW (Ubuntu Firewall)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 3. Environment Variables

- **Never commit `.env` file to Git**
- Use environment-specific configurations
- Rotate secrets regularly
- Use secret management tools (AWS Secrets Manager, HashiCorp Vault)

### 4. Rate Limiting

Already implemented in `api-server.js`:
- 100 requests per 15 minutes per IP
- Protects against brute force and DoS attacks

### 5. CORS Configuration

Update `ALLOWED_ORIGINS` to only include your production domains:

```env
ALLOWED_ORIGINS=https://your-domain.com
```

### 6. Authentication Best Practices

- JWT tokens expire after 24 hours
- Passwords hashed with SHA-256 (consider upgrading to bcrypt)
- Implement password strength requirements
- Add account lockout after failed attempts

---

## Monitoring and Maintenance

### Health Checks

Both servers respond to health check requests:

```bash
# API Server
curl http://localhost:3000/health

# Multiplayer Server (via WebSocket)
# Returns 200 OK for HTTP requests
curl http://localhost:8080/health
```

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Resource usage
pm2 status

# Detailed info
pm2 info somnium-api
```

### Log Rotation

Configure logrotate for PM2 logs:

```bash
# /etc/logrotate.d/pm2

/home/ubuntu/.pm2/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Backup Strategy

```bash
# Backup user data
tar -czf backup-$(date +%Y%m%d).tar.gz storage/

# Restore
tar -xzf backup-20250618.tar.gz
```

### Database Migrations (Future)

When adding database support:

```bash
# Run migrations
npm run migrate

# Rollback
npm run migrate:rollback
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port
lsof -i :3000
lsof -i :8080

# Kill process
kill -9 <PID>
```

#### 2. EACCES Permission Denied (Port < 1024)

Use ports > 1024 or run with sudo (not recommended), or use authbind:

```bash
sudo apt install authbind
authbind --deep npm start
```

#### 3. WebSocket Connection Failed

Check firewall rules:

```bash
sudo ufw status
sudo ufw allow 8080/tcp
```

Verify WebSocket upgrade headers in Nginx:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "Upgrade";
```

#### 4. CORS Errors

Update `ALLOWED_ORIGINS` in `.env`:

```env
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

#### 5. Out of Memory

Increase Node.js heap size:

```javascript
// In ecosystem.config.js
node_args: '--max-old-space-size=2048'
```

#### 6. PM2 Not Starting on Boot

```bash
pm2 save
pm2 startup
# Run the command PM2 outputs
```

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

View detailed logs:

```bash
pm2 logs --lines 100
```

### Performance Tuning

#### Node.js Cluster Mode (API Server)

Already configured in PM2 ecosystem:

```javascript
instances: 2,
exec_mode: 'cluster'
```

#### WebSocket Scaling

For multiple instances, use Redis adapter:

```bash
npm install ioredis
```

Update `multiplayer-server.js` to use Redis for pub/sub between instances.

---

## Additional Resources

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [WebSocket Security](https://owasp.org/www-community/vulnerabilities/Web_Socket_Security)
- [Let's Encrypt Certbot](https://certbot.eff.org/)

---

## Support

For issues or questions:
- **GitHub Issues**: https://github.com/doublegate/Somnium/issues
- **Documentation**: https://github.com/doublegate/Somnium/tree/main/docs

---

**Last Updated**: June 18, 2025
**Version**: 2.0.0
