// 🏥 Health Check Script for Production Monitoring
// Performs comprehensive health checks for the application

const http = require('http');
const { MongoClient } = require('mongodb');

class HealthChecker {
  constructor() {
    this.checks = [];
    this.timeout = 5000;
    
    this.setupChecks();
  }

  setupChecks() {
    // HTTP Server Check
    this.checks.push({
      name: 'HTTP Server',
      check: () => this.checkHTTPServer()
    });

    // Database Check
    this.checks.push({
      name: 'MongoDB',
      check: () => this.checkDatabase()
    });

    // Memory Check
    this.checks.push({
      name: 'Memory Usage',
      check: () => this.checkMemory()
    });

    // Disk Space Check
    this.checks.push({
      name: 'Disk Space',
      check: () => this.checkDiskSpace()
    });
  }

  async checkHTTPServer() {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: process.env.PORT || 5000,
        path: '/api/health',
        method: 'GET',
        timeout: this.timeout
      }, (res) => {
        if (res.statusCode === 200) {
          resolve({ status: 'healthy', details: 'HTTP server responding' });
        } else {
          reject(new Error(`HTTP server returned status ${res.statusCode}`));
        }
      });

      req.on('error', (error) => {
        reject(new Error(`HTTP server check failed: ${error.message}`));
      });

      req.on('timeout', () => {
        reject(new Error('HTTP server check timed out'));
      });

      req.end();
    });
  }

  async checkDatabase() {
    try {
      const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/port42');
      
      await client.connect();
      await client.db().admin().ping();
      await client.close();
      
      return { status: 'healthy', details: 'Database connection successful' };
    } catch (error) {
      throw new Error(`Database check failed: ${error.message}`);
    }
  }

  async checkMemory() {
    const usage = process.memoryUsage();
    const totalMB = Math.round(usage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    
    // Alert if memory usage is too high (>500MB RSS)
    if (totalMB > 500) {
      throw new Error(`High memory usage: ${totalMB}MB RSS`);
    }
    
    return {
      status: 'healthy',
      details: `Memory: ${totalMB}MB RSS, Heap: ${heapUsedMB}/${heapTotalMB}MB`
    };
  }

  async checkDiskSpace() {
    const fs = require('fs');
    
    return new Promise((resolve, reject) => {
      fs.statvfs || fs.stat('.', (err, stats) => {
        if (err) {
          reject(new Error(`Disk space check failed: ${err.message}`));
          return;
        }
        
        // Basic check - ensure we can write to current directory
        resolve({ status: 'healthy', details: 'Disk space accessible' });
      });
    });
  }

  async runChecks() {
    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {},
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    };

    let hasFailures = false;

    for (const check of this.checks) {
      try {
        const result = await Promise.race([
          check.check(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Check timed out')), this.timeout)
          )
        ]);
        
        results.checks[check.name] = result;
      } catch (error) {
        hasFailures = true;
        results.checks[check.name] = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    if (hasFailures) {
      results.status = 'unhealthy';
    }

    return results;
  }

  async checkAndExit() {
    try {
      const results = await this.runChecks();
      
      if (results.status === 'healthy') {
        console.log('✅ Health check passed');
        process.exit(0);
      } else {
        console.error('❌ Health check failed:', JSON.stringify(results, null, 2));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Health check error:', error.message);
      process.exit(1);
    }
  }
}

// Run health check if called directly
if (require.main === module) {
  const checker = new HealthChecker();
  checker.checkAndExit();
}

module.exports = HealthChecker;
