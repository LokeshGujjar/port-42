# 🚀 Port42 Production Deployment Guide

This guide will help you deploy Port42 to production with all the enhancements and optimizations.

## 📋 Prerequisites

Before deploying Port42 to production, ensure you have:

### Required Software
- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Node.js** (v18+) and **npm** (v8+)
- **Git** for version control
- **SSL Certificate** (Let's Encrypt recommended)

### Required Services
- **MongoDB** (v6.0+) - Database
- **Redis** (v7.0+) - Caching and sessions
- **Domain Name** - For public access
- **Email Service** - For notifications (Gmail/SendGrid/etc.)

### Server Requirements
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 20GB minimum, 50GB recommended
- **CPU**: 2 cores minimum
- **OS**: Ubuntu 20.04+ or similar Linux distribution

## 🛠️ Installation Steps

### 1. Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/your-username/port-42.git
cd port-42

# Create production environment files
cp .env.production.example .env.production
cp frontend/.env.production.example frontend/.env.production
```

### 2. Configure Environment Variables

Edit `.env.production`:
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/port42_production

# Security (IMPORTANT: Change these!)
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters-long
SESSION_SECRET=your-super-secure-session-secret-minimum-32-characters

# Domain
CORS_ORIGIN=https://your-domain.com

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Edit `frontend/.env.production`:
```bash
# API endpoints
VITE_API_BASE_URL=https://api.your-domain.com
VITE_SOCKET_URL=https://api.your-domain.com

# Analytics (optional)
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
```

### 3. Deploy Using Docker Compose

```bash
# Set your domain (for SSL certificates)
export DOMAIN=your-domain.com

# Run the deployment script
./deploy.sh
```

The deployment script will:
- ✅ Create database backups
- ✅ Build optimized frontend
- ✅ Build Docker containers
- ✅ Configure SSL certificates
- ✅ Set up monitoring
- ✅ Health check verification

### 4. Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Build frontend
cd frontend
npm ci
npm run build
cd ..

# Build and start containers
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Check health
docker-compose -f docker-compose.prod.yml exec port42-app node backend/utils/healthcheck.js
```

## 🔧 Configuration

### SSL Certificates

#### Using Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy to project
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./docker/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./docker/ssl/
```

#### Using Custom Certificates
Place your certificates in `./docker/ssl/`:
- `fullchain.pem` - Full certificate chain
- `privkey.pem` - Private key

### Database Setup

The deployment automatically sets up MongoDB with:
- ✅ Authentication enabled
- ✅ Proper indexes for performance
- ✅ Automatic backups
- ✅ Data persistence

### Monitoring Setup

Access monitoring tools:
- **Application**: https://your-domain.com
- **Prometheus**: http://your-domain.com:9090
- **Logs**: http://your-domain.com:3100
- **Health Check**: https://your-domain.com/api/health

## 🎯 Performance Optimization

### Frontend Optimizations
- ✅ Code splitting and lazy loading
- ✅ Asset compression (Gzip/Brotli)
- ✅ Image optimization
- ✅ Service Worker for caching
- ✅ CDN integration ready

### Backend Optimizations
- ✅ Request compression
- ✅ Database connection pooling
- ✅ Redis caching
- ✅ Rate limiting
- ✅ Graceful shutdowns

### Database Optimizations
- ✅ Proper indexing on queries
- ✅ Connection pooling
- ✅ Query optimization
- ✅ Aggregation pipelines

## 🔒 Security Features

### Implemented Security
- ✅ JWT token authentication
- ✅ Password hashing (bcrypt)
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ MongoDB injection prevention
- ✅ XSS protection
- ✅ CSRF protection

### Security Checklist
- [ ] Change default passwords
- [ ] Configure firewall rules
- [ ] Enable fail2ban
- [ ] Set up SSL certificates
- [ ] Configure backup encryption
- [ ] Review environment variables
- [ ] Enable audit logging

## 📊 Monitoring and Logging

### Application Monitoring
```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f port42-app

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Monitor resource usage
docker stats
```

### Health Checks
```bash
# Manual health check
curl https://your-domain.com/api/health

# Container health check
docker-compose -f docker-compose.prod.yml exec port42-app node backend/utils/healthcheck.js
```

### Log Management
Logs are automatically rotated and stored in:
- Application logs: `./logs/port42.log`
- Nginx logs: `./logs/nginx/`
- Database logs: Stored in Docker volumes

## 🔄 Maintenance

### Regular Backups
```bash
# Create manual backup
./deploy.sh --backup-only

# Backups are stored in ./backups/
# Format: backup_YYYYMMDD_HHMMSS_db.archive
```

### Updates and Patches
```bash
# Pull latest changes
git pull origin main

# Deploy updates
./deploy.sh --no-backup  # Skip backup if not needed
```

### Database Maintenance
```bash
# Access MongoDB shell
docker-compose -f docker-compose.prod.yml exec port42-db mongo

# View database stats
db.stats()

# Compact collections (if needed)
db.runCommand({compact: 'resources'})
```

## 🚨 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs port42-app

# Check environment variables
docker-compose -f docker-compose.prod.yml exec port42-app env | grep PORT42
```

#### Database Connection Issues
```bash
# Check MongoDB logs
docker-compose -f docker-compose.prod.yml logs port42-db

# Test connection
docker-compose -f docker-compose.prod.yml exec port42-app node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(console.error);
"
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in ./docker/ssl/fullchain.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Check database performance
docker-compose -f docker-compose.prod.yml exec port42-db mongo --eval "db.serverStatus().metrics"

# Check Redis performance
docker-compose -f docker-compose.prod.yml exec port42-redis redis-cli info stats
```

### Emergency Procedures

#### Rollback Deployment
```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Restore from backup
mongorestore --archive=./backups/backup_YYYYMMDD_HHMMSS_db.archive

# Start previous version
git checkout previous-working-commit
./deploy.sh
```

#### Database Recovery
```bash
# Restore database from backup
docker-compose -f docker-compose.prod.yml exec -T port42-db mongorestore --archive < ./backups/backup_YYYYMMDD_HHMMSS_db.archive
```

## 📈 Scaling

### Horizontal Scaling
To scale Port42 across multiple servers:

1. **Database Clustering**: Set up MongoDB replica set
2. **Load Balancing**: Use nginx or cloud load balancer
3. **Session Storage**: Use Redis cluster for shared sessions
4. **File Storage**: Use cloud storage (AWS S3, etc.)

### Vertical Scaling
```bash
# Increase container resources
docker-compose -f docker-compose.prod.yml up -d --scale port42-app=3
```

## 🌐 Going Live Checklist

Before going live, ensure:

- [ ] **Domain configured** with proper DNS records
- [ ] **SSL certificates** installed and valid
- [ ] **Environment variables** set correctly
- [ ] **Database** properly secured and backed up
- [ ] **Monitoring** tools configured
- [ ] **Analytics** tracking set up
- [ ] **Email service** configured and tested
- [ ] **Error tracking** (Sentry) configured
- [ ] **CDN** configured for static assets
- [ ] **Backup strategy** implemented
- [ ] **Security headers** configured
- [ ] **Rate limiting** properly set
- [ ] **Health checks** responding correctly
- [ ] **Load testing** completed
- [ ] **Documentation** updated

## 🎉 Success!

If all checks pass, your Port42 platform is now live! 

**Access your platform at**: https://your-domain.com

### Next Steps
1. Set up automated backups
2. Configure monitoring alerts
3. Set up CI/CD pipeline
4. Plan scaling strategy
5. Monitor performance metrics

### Support
For issues or questions:
- Check logs: `docker-compose logs`
- Review health status: `/api/health`
- Monitor metrics: Prometheus dashboard
- Community support: GitHub Issues

---

**Made with ⚡ by the Port42 Team**
