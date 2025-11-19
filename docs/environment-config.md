# Environment Variable Configuration Guide

Complete reference for configuring Somnium v2.0 backend servers through environment variables.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Required Variables](#required-variables)
3. [Optional Variables](#optional-variables)
4. [Security Best Practices](#security-best-practices)
5. [Environment-Specific Configurations](#environment-specific-configurations)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Copy Example File

```bash
cd server
cp .env.example .env
```

### 2. Generate Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate session secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Edit `.env` File

Open `.env` in your editor and update at minimum:
- `JWT_SECRET` - Use generated secret
- `SESSION_SECRET` - Use generated secret
- `ALLOWED_ORIGINS` - Your frontend URL(s)

### 4. Verify Configuration

```bash
# Start servers
npm run start:all

# Check logs for configuration errors
tail -f logs/server.log
```

---

## Required Variables

### Server Ports

#### `PORT`
- **Description**: HTTP port for Express REST API server
- **Default**: 3000
- **Valid Range**: 1-65535 (recommend > 1024 to avoid requiring root)
- **Example**: `PORT=3000`

#### `MULTIPLAYER_PORT`
- **Description**: WebSocket port for multiplayer server
- **Default**: 8080
- **Valid Range**: 1-65535 (recommend > 1024)
- **Example**: `MULTIPLAYER_PORT=8080`
- **Note**: Must be different from `PORT`

### Security

#### `JWT_SECRET`
- **Description**: Secret key for signing JSON Web Tokens
- **Required**: Yes
- **Minimum Length**: 32 characters
- **Recommended Length**: 64+ characters
- **Example**: `JWT_SECRET=a1b2c3d4e5f6...` (64 hex characters)
- **Security**: Must be cryptographically random, never commit to Git

**Generate secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### `SESSION_SECRET`
- **Description**: Secret key for session management
- **Required**: Yes
- **Minimum Length**: 32 characters
- **Recommended Length**: 64+ characters
- **Example**: `SESSION_SECRET=f6e5d4c3b2a1...` (64 hex characters)
- **Security**: Must be different from `JWT_SECRET`, rotate regularly

### CORS Configuration

#### `ALLOWED_ORIGINS`
- **Description**: Comma-separated list of allowed origins for CORS
- **Required**: Yes
- **Format**: `origin1,origin2,origin3`
- **Examples**:
  - Development: `http://localhost:8000,http://localhost:8080`
  - Production: `https://somnium.game,https://www.somnium.game`
  - Mixed: `https://somnium.game,http://localhost:8000`
- **Note**: Include protocol (http/https), no trailing slashes

---

## Optional Variables

### File Storage

#### `STORAGE_PATH`
- **Description**: Directory for user data and saves
- **Default**: `./storage`
- **Example**: `STORAGE_PATH=/var/lib/somnium/data`
- **Note**: Server needs read/write permissions

### Logging

#### `LOG_LEVEL`
- **Description**: Minimum log level to output
- **Default**: `info`
- **Valid Values**: `error`, `warn`, `info`, `debug`
- **Examples**:
  - Production: `LOG_LEVEL=warn`
  - Development: `LOG_LEVEL=debug`
  - Minimal: `LOG_LEVEL=error`

**Log Level Hierarchy**:
```
error < warn < info < debug
↑                          ↑
Least verbose    Most verbose
```

#### `LOG_FILE`
- **Description**: Path to log file (relative to server/)
- **Default**: `./logs/server.log`
- **Example**: `LOG_FILE=/var/log/somnium/server.log`
- **Note**: Directory must exist and be writable

### Rate Limiting

#### `RATE_LIMIT_WINDOW_MS`
- **Description**: Time window for rate limiting in milliseconds
- **Default**: 900000 (15 minutes)
- **Examples**:
  - 5 minutes: `300000`
  - 15 minutes: `900000`
  - 1 hour: `3600000`

#### `RATE_LIMIT_MAX_REQUESTS`
- **Description**: Maximum requests per IP per window
- **Default**: 100
- **Recommended**:
  - Strict: 50
  - Normal: 100
  - Lenient: 200
- **Note**: Prevents brute force attacks

### WebSocket Configuration

#### `WS_HEARTBEAT_INTERVAL`
- **Description**: Ping interval for WebSocket heartbeat (ms)
- **Default**: 30000 (30 seconds)
- **Recommended Range**: 15000-60000
- **Example**: `WS_HEARTBEAT_INTERVAL=30000`
- **Purpose**: Detect disconnected clients

#### `WS_HEARTBEAT_TIMEOUT`
- **Description**: Timeout waiting for pong response (ms)
- **Default**: 5000 (5 seconds)
- **Recommended Range**: 3000-10000
- **Example**: `WS_HEARTBEAT_TIMEOUT=5000`
- **Note**: Should be less than `WS_HEARTBEAT_INTERVAL`

### Session Configuration

#### `SESSION_MAX_AGE`
- **Description**: Session cookie maximum age (ms)
- **Default**: 86400000 (24 hours)
- **Examples**:
  - 1 hour: `3600000`
  - 24 hours: `86400000`
  - 7 days: `604800000`
  - 30 days: `2592000000`

### File Upload Limits

#### `MAX_SAVE_SIZE_MB`
- **Description**: Maximum save file size in megabytes
- **Default**: 10
- **Recommended Range**: 5-20
- **Example**: `MAX_SAVE_SIZE_MB=10`

#### `MAX_WORLD_SIZE_MB`
- **Description**: Maximum world file size in megabytes
- **Default**: 5
- **Recommended Range**: 3-10
- **Example**: `MAX_WORLD_SIZE_MB=5`

### Database (Optional)

#### `DATABASE_URL`
- **Description**: PostgreSQL connection URL
- **Format**: `postgresql://user:password@host:port/database`
- **Example**: `DATABASE_URL=postgresql://somnium:pass123@localhost:5432/somnium`
- **Note**: Currently not implemented, reserved for future use

#### `DATABASE_POOL_MIN`
- **Description**: Minimum database connection pool size
- **Default**: 2
- **Example**: `DATABASE_POOL_MIN=2`

#### `DATABASE_POOL_MAX`
- **Description**: Maximum database connection pool size
- **Default**: 10
- **Example**: `DATABASE_POOL_MAX=20`
- **Recommended**: Set based on expected load

### Redis (Optional)

#### `REDIS_URL`
- **Description**: Redis connection URL
- **Format**: `redis://host:port`
- **Example**: `REDIS_URL=redis://localhost:6379`
- **Use Case**: Distributed session storage, caching

#### `REDIS_PASSWORD`
- **Description**: Redis authentication password
- **Example**: `REDIS_PASSWORD=your-redis-password`

#### `REDIS_DB`
- **Description**: Redis database number (0-15)
- **Default**: 0
- **Example**: `REDIS_DB=0`

### Email (Optional)

#### `SMTP_HOST`
- **Description**: SMTP server hostname
- **Example**: `SMTP_HOST=smtp.gmail.com`

#### `SMTP_PORT`
- **Description**: SMTP server port
- **Common Values**:
  - 25 (standard, often blocked)
  - 587 (TLS/STARTTLS)
  - 465 (SSL)
- **Example**: `SMTP_PORT=587`

#### `SMTP_SECURE`
- **Description**: Use SSL/TLS
- **Values**: `true` or `false`
- **Example**: `SMTP_SECURE=false`
- **Note**: Use `false` for port 587 with STARTTLS

#### `SMTP_USER`
- **Description**: SMTP authentication username
- **Example**: `SMTP_USER=your-email@gmail.com`

#### `SMTP_PASS`
- **Description**: SMTP authentication password
- **Example**: `SMTP_PASS=your-app-specific-password`
- **Security**: Use app-specific passwords, not account password

#### `EMAIL_FROM`
- **Description**: Default "From" address for emails
- **Example**: `EMAIL_FROM=noreply@somnium.game`

### Cloud Storage (Optional)

#### AWS S3 Configuration

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
S3_BUCKET=somnium-saves
```

- **Purpose**: Store saves and worlds in S3 instead of local filesystem
- **Benefits**: Scalability, backups, multi-server support
- **Setup**: Create S3 bucket and IAM user with appropriate permissions

### Environment Mode

#### `NODE_ENV`
- **Description**: Node.js environment mode
- **Values**: `development`, `production`, `test`
- **Effects**:
  - Production: Enables optimizations, disables debug features
  - Development: Verbose logging, detailed errors
  - Test: Special configuration for testing
- **Examples**:
  - Development: `NODE_ENV=development`
  - Production: `NODE_ENV=production`

### SSL/TLS (Optional)

#### `SSL_KEY_PATH`
- **Description**: Path to SSL private key file
- **Example**: `SSL_KEY_PATH=/etc/letsencrypt/live/domain/privkey.pem`

#### `SSL_CERT_PATH`
- **Description**: Path to SSL certificate file
- **Example**: `SSL_CERT_PATH=/etc/letsencrypt/live/domain/fullchain.pem`

#### `FORCE_HTTPS`
- **Description**: Redirect HTTP to HTTPS
- **Values**: `true` or `false`
- **Example**: `FORCE_HTTPS=true`
- **Note**: Typically handled by reverse proxy (Nginx)

---

## Security Best Practices

### 1. Secret Generation

**Always use cryptographically secure random values:**

```bash
# Good: Cryptographic random bytes
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Bad: Predictable or weak secrets
JWT_SECRET=secret123
JWT_SECRET=my-app-name
```

### 2. Secret Storage

**Never commit secrets to version control:**

```bash
# .gitignore should include:
.env
.env.local
.env.production
*.key
*.pem
```

**Use secret management tools in production:**
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Secret Manager

### 3. Secret Rotation

**Rotate secrets regularly:**

1. Generate new secret
2. Update `.env` file
3. Restart servers
4. Old tokens become invalid (users must re-login)

**Recommended rotation schedule:**
- JWT_SECRET: Every 90 days
- SESSION_SECRET: Every 90 days
- Database passwords: Every 180 days

### 4. CORS Configuration

**Be specific with allowed origins:**

```env
# Good: Specific origins
ALLOWED_ORIGINS=https://somnium.game,https://www.somnium.game

# Bad: Wildcard (allows any origin)
ALLOWED_ORIGINS=*

# Bad: Including development origins in production
ALLOWED_ORIGINS=https://somnium.game,http://localhost:3000
```

### 5. Rate Limiting

**Adjust based on threat model:**

```env
# High security (login endpoints)
RATE_LIMIT_WINDOW_MS=900000  # 15 min
RATE_LIMIT_MAX_REQUESTS=5    # 5 attempts

# Normal API usage
RATE_LIMIT_WINDOW_MS=900000  # 15 min
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests

# Public read-only endpoints
RATE_LIMIT_WINDOW_MS=60000   # 1 min
RATE_LIMIT_MAX_REQUESTS=60   # 60 requests
```

---

## Environment-Specific Configurations

### Development

```env
NODE_ENV=development
PORT=3000
MULTIPLAYER_PORT=8080
JWT_SECRET=dev-secret-not-for-production
SESSION_SECRET=dev-session-secret-not-for-production
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:8080
LOG_LEVEL=debug
STORAGE_PATH=./storage
```

### Staging

```env
NODE_ENV=production
PORT=3000
MULTIPLAYER_PORT=8080
JWT_SECRET=<generated-secure-secret>
SESSION_SECRET=<generated-secure-secret>
ALLOWED_ORIGINS=https://staging.somnium.game
LOG_LEVEL=info
STORAGE_PATH=/var/lib/somnium/staging
RATE_LIMIT_MAX_REQUESTS=100
```

### Production

```env
NODE_ENV=production
PORT=3000
MULTIPLAYER_PORT=8080
JWT_SECRET=<generated-secure-secret>
SESSION_SECRET=<generated-secure-secret>
ALLOWED_ORIGINS=https://somnium.game,https://www.somnium.game
LOG_LEVEL=warn
STORAGE_PATH=/var/lib/somnium/production
RATE_LIMIT_MAX_REQUESTS=50
SESSION_MAX_AGE=604800000
WS_HEARTBEAT_INTERVAL=30000
```

### Docker

```env
NODE_ENV=production
PORT=3000
MULTIPLAYER_PORT=8080
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
STORAGE_PATH=/app/storage
LOG_FILE=/app/logs/server.log
```

**Note**: Use Docker secrets or environment variable substitution

---

## Troubleshooting

### Issue: "JWT_SECRET is required"

**Cause**: Missing or empty `JWT_SECRET` variable

**Solution**:
```bash
# Generate secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to .env
echo "JWT_SECRET=<generated-value>" >> .env
```

### Issue: "CORS error: Origin not allowed"

**Cause**: Frontend origin not in `ALLOWED_ORIGINS`

**Solution**:
```env
# Add frontend URL (include protocol, no trailing slash)
ALLOWED_ORIGINS=https://your-domain.com,http://localhost:8000
```

### Issue: "Port 3000 already in use"

**Cause**: Another process using the port

**Solution**:
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
echo "PORT=3001" >> .env
```

### Issue: "Cannot write to storage directory"

**Cause**: Insufficient permissions

**Solution**:
```bash
# Create directory
mkdir -p storage/users storage/saves storage/shared

# Fix permissions
chmod 755 storage
chmod 755 storage/*
```

### Issue: "Rate limit exceeded"

**Cause**: Too many requests from single IP

**Solution**:
```env
# Increase limits for development
RATE_LIMIT_MAX_REQUESTS=1000

# Or increase window
RATE_LIMIT_WINDOW_MS=3600000  # 1 hour
```

### Issue: "WebSocket connection timeout"

**Cause**: Heartbeat timing misconfigured or firewall blocking

**Solutions**:
```env
# Increase timeouts
WS_HEARTBEAT_INTERVAL=60000
WS_HEARTBEAT_TIMEOUT=10000

# Check firewall
sudo ufw allow 8080/tcp
```

### Issue: "Session expired immediately"

**Cause**: `SESSION_MAX_AGE` too low or system time incorrect

**Solutions**:
```env
# Increase session duration
SESSION_MAX_AGE=86400000  # 24 hours

# Check system time
date
```

---

## Validation Script

Create `server/validate-env.js` to check configuration:

```javascript
import dotenv from 'dotenv';
dotenv.config();

const required = ['JWT_SECRET', 'SESSION_SECRET', 'ALLOWED_ORIGINS'];
const warnings = [];

// Check required variables
required.forEach(key => {
  if (!process.env[key]) {
    console.error(`❌ Missing required: ${key}`);
    process.exit(1);
  }
});

// Validate JWT_SECRET length
if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

// Validate SESSION_SECRET length
if (process.env.SESSION_SECRET.length < 32) {
  console.error('❌ SESSION_SECRET must be at least 32 characters');
  process.exit(1);
}

// Check CORS origins format
if (process.env.ALLOWED_ORIGINS.includes('*')) {
  warnings.push('⚠️  ALLOWED_ORIGINS includes wildcard (*)');
}

// Check NODE_ENV
if (process.env.NODE_ENV === 'production' && process.env.LOG_LEVEL === 'debug') {
  warnings.push('⚠️  Production mode with debug logging');
}

// Print warnings
warnings.forEach(w => console.warn(w));

console.log('✅ Environment configuration valid');
```

**Run validation:**
```bash
node validate-env.js
```

---

## Additional Resources

- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [Node.js Environment Variables](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12-Factor App Config](https://12factor.net/config)

---

**Last Updated**: June 18, 2025
**Version**: 2.0.0
