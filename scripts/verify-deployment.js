#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Runs comprehensive checks after deployment to ensure everything is working
 */

const https = require('https');
const { performance } = require('perf_hooks');

const BASE_URL = process.env.BASE_URL || 'https://hayah-ai.com';
const TIMEOUT = 30000; // 30 seconds

class DeploymentVerifier {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  async verify() {
    console.log(`🚀 Starting deployment verification for: ${this.baseUrl}`);
    console.log('=' .repeat(60));

    try {
      // Core functionality tests
      await this.checkHealthEndpoint();
      await this.checkHomepage();
      await this.checkAPIEndpoints();
      await this.checkStaticAssets();
      await this.checkSecurityHeaders();
      await this.checkPerformance();
      await this.checkAccessibility();

      // Report results
      this.generateReport();

      // Exit with appropriate code
      process.exit(this.failed > 0 ? 1 : 0);

    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      process.exit(1);
    }
  }

  async checkHealthEndpoint() {
    const testName = 'Health Check Endpoint';
    console.log(`🔍 Testing: ${testName}`);

    try {
      const response = await this.makeRequest('/api/health');
      const data = JSON.parse(response.body);

      if (response.statusCode === 200 && data.status === 'healthy') {
        this.recordSuccess(testName, 'Health endpoint responding correctly');
      } else {
        this.recordFailure(testName, `Unhealthy response: ${data.status}`);
      }

      // Check specific health components
      if (data.checks) {
        for (const [component, check] of Object.entries(data.checks)) {
          if (check.status !== 'healthy') {
            this.recordFailure(testName, `${component} is unhealthy: ${check.error || 'Unknown error'}`);
          }
        }
      }

    } catch (error) {
      this.recordFailure(testName, error.message);
    }
  }

  async checkHomepage() {
    const testName = 'Homepage Load';
    console.log(`🔍 Testing: ${testName}`);

    try {
      const start = performance.now();
      const response = await this.makeRequest('/');
      const loadTime = performance.now() - start;

      if (response.statusCode === 200) {
        this.recordSuccess(testName, `Homepage loaded in ${loadTime.toFixed(2)}ms`);

        // Check for essential content
        if (response.body.includes('Hayah AI')) {
          this.recordSuccess(testName, 'Brand name found on homepage');
        } else {
          this.recordFailure(testName, 'Brand name not found on homepage');
        }

        // Check for critical CSS
        if (response.body.includes('<style') || response.body.includes('stylesheet')) {
          this.recordSuccess(testName, 'Stylesheets detected');
        } else {
          this.recordFailure(testName, 'No stylesheets detected');
        }

      } else {
        this.recordFailure(testName, `HTTP ${response.statusCode}`);
      }

    } catch (error) {
      this.recordFailure(testName, error.message);
    }
  }

  async checkAPIEndpoints() {
    const testName = 'API Endpoints';
    console.log(`🔍 Testing: ${testName}`);

    const endpoints = [
      { path: '/api/posts', method: 'GET', expectedStatus: 200 },
      { path: '/api/posts/invalid', method: 'GET', expectedStatus: 404 },
      { path: '/api/metrics', method: 'GET', expectedStatus: 401 }, // Should require auth
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint.path, endpoint.method);

        if (response.statusCode === endpoint.expectedStatus) {
          this.recordSuccess(testName, `${endpoint.method} ${endpoint.path} returned ${response.statusCode}`);
        } else {
          this.recordFailure(testName, `${endpoint.method} ${endpoint.path} returned ${response.statusCode}, expected ${endpoint.expectedStatus}`);
        }

      } catch (error) {
        this.recordFailure(testName, `${endpoint.method} ${endpoint.path} failed: ${error.message}`);
      }
    }
  }

  async checkStaticAssets() {
    const testName = 'Static Assets';
    console.log(`🔍 Testing: ${testName}`);

    const assets = [
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
    ];

    for (const asset of assets) {
      try {
        const response = await this.makeRequest(asset);

        if (response.statusCode === 200) {
          this.recordSuccess(testName, `${asset} accessible`);
        } else {
          this.recordFailure(testName, `${asset} returned ${response.statusCode}`);
        }

      } catch (error) {
        this.recordFailure(testName, `${asset} failed: ${error.message}`);
      }
    }
  }

  async checkSecurityHeaders() {
    const testName = 'Security Headers';
    console.log(`🔍 Testing: ${testName}`);

    try {
      const response = await this.makeRequest('/');
      const headers = response.headers;

      const requiredHeaders = {
        'x-frame-options': 'DENY',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'x-xss-protection': '1; mode=block',
      };

      for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
        const actualValue = headers[header] || headers[header.toLowerCase()];

        if (actualValue) {
          this.recordSuccess(testName, `${header} header present: ${actualValue}`);
        } else {
          this.recordFailure(testName, `Missing security header: ${header}`);
        }
      }

      // Check for HTTPS redirect
      if (this.baseUrl.startsWith('https://')) {
        const httpResponse = await this.makeRequest('/', 'GET', this.baseUrl.replace('https://', 'http://'));
        if (httpResponse.statusCode >= 300 && httpResponse.statusCode < 400) {
          this.recordSuccess(testName, 'HTTP to HTTPS redirect working');
        } else {
          this.recordFailure(testName, 'HTTP to HTTPS redirect not working');
        }
      }

    } catch (error) {
      this.recordFailure(testName, error.message);
    }
  }

  async checkPerformance() {
    const testName = 'Performance';
    console.log(`🔍 Testing: ${testName}`);

    try {
      const start = performance.now();
      const response = await this.makeRequest('/');
      const totalTime = performance.now() - start;

      // Performance thresholds
      if (totalTime < 2000) {
        this.recordSuccess(testName, `Fast load time: ${totalTime.toFixed(2)}ms`);
      } else if (totalTime < 5000) {
        this.recordSuccess(testName, `Acceptable load time: ${totalTime.toFixed(2)}ms`);
      } else {
        this.recordFailure(testName, `Slow load time: ${totalTime.toFixed(2)}ms`);
      }

      // Check response size
      const responseSize = Buffer.byteLength(response.body, 'utf8');
      if (responseSize < 500000) { // 500KB
        this.recordSuccess(testName, `Good response size: ${(responseSize / 1024).toFixed(2)}KB`);
      } else {
        this.recordFailure(testName, `Large response size: ${(responseSize / 1024).toFixed(2)}KB`);
      }

    } catch (error) {
      this.recordFailure(testName, error.message);
    }
  }

  async checkAccessibility() {
    const testName = 'Accessibility';
    console.log(`🔍 Testing: ${testName}`);

    try {
      const response = await this.makeRequest('/');

      // Basic accessibility checks
      const checks = [
        { pattern: /<html[^>]+lang=/i, message: 'HTML lang attribute present' },
        { pattern: /<title>/i, message: 'Page title present' },
        { pattern: /<meta[^>]+description/i, message: 'Meta description present' },
        { pattern: /<h1/i, message: 'H1 heading present' },
      ];

      for (const check of checks) {
        if (check.pattern.test(response.body)) {
          this.recordSuccess(testName, check.message);
        } else {
          this.recordFailure(testName, `Missing: ${check.message}`);
        }
      }

    } catch (error) {
      this.recordFailure(testName, error.message);
    }
  }

  async makeRequest(path, method = 'GET', baseUrl = this.baseUrl) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const options = {
        method,
        timeout: TIMEOUT,
        headers: {
          'User-Agent': 'Deployment-Verifier/1.0',
        },
      };

      const req = https.request(url, options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${TIMEOUT}ms`));
      });

      req.end();
    });
  }

  recordSuccess(testName, message) {
    console.log(`  ✅ ${message}`);
    this.results.push({ test: testName, status: 'PASS', message });
    this.passed++;
  }

  recordFailure(testName, message) {
    console.log(`  ❌ ${message}`);
    this.results.push({ test: testName, status: 'FAIL', message });
    this.failed++;
  }

  generateReport() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 DEPLOYMENT VERIFICATION REPORT');
    console.log('=' .repeat(60));

    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);

    if (this.failed > 0) {
      console.log('\n🚨 FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`  ❌ ${result.test}: ${result.message}`);
        });
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    if (this.failed === 0) {
      console.log('  🎉 All tests passed! Deployment looks healthy.');
    } else {
      console.log('  🔧 Fix the failing tests before considering deployment complete.');
      console.log('  📊 Review monitoring dashboards for ongoing issues.');
      console.log('  🚨 Set up alerts for critical components that failed.');
    }

    console.log('\n' + '=' .repeat(60));
  }
}

// Run verification
const verifier = new DeploymentVerifier(BASE_URL);
verifier.verify().catch(error => {
  console.error('Verification script failed:', error);
  process.exit(1);
});