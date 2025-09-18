#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates all required environment variables and configurations
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  validate() {
    console.log('🔍 Validating environment configuration...\n');

    this.validateRequiredVariables();
    this.validateOptionalVariables();
    this.validateDatabaseConfig();
    this.validateAuthConfig();
    this.validateMonitoringConfig();
    this.validateDeploymentConfig();
    this.validateSecrets();
    this.validateFiles();

    this.generateReport();

    // Exit with error if there are critical issues
    process.exit(this.errors.length > 0 ? 1 : 0);
  }

  validateRequiredVariables() {
    console.log('📋 Checking required environment variables...');

    const required = {
      NODE_ENV: {
        description: 'Runtime environment',
        validValues: ['development', 'staging', 'production'],
      },
      DATABASE_URL: {
        description: 'PostgreSQL database connection string',
        pattern: /^postgresql:\/\/.*$/,
      },
      NEXTAUTH_SECRET: {
        description: 'NextAuth secret for JWT signing',
        minLength: 32,
      },
      NEXTAUTH_URL: {
        description: 'Application base URL',
        pattern: /^https?:\/\/.*$/,
      },
    };

    for (const [varName, config] of Object.entries(required)) {
      const value = process.env[varName];

      if (!value) {
        this.addError(`Missing required environment variable: ${varName}`, config.description);
        continue;
      }

      // Validate format
      if (config.pattern && !config.pattern.test(value)) {
        this.addError(`Invalid format for ${varName}`, `Expected pattern: ${config.pattern}`);
      }

      // Validate length
      if (config.minLength && value.length < config.minLength) {
        this.addError(`${varName} too short`, `Minimum length: ${config.minLength}, actual: ${value.length}`);
      }

      // Validate allowed values
      if (config.validValues && !config.validValues.includes(value)) {
        this.addError(`Invalid value for ${varName}`, `Must be one of: ${config.validValues.join(', ')}`);
      }

      this.addInfo(`✅ ${varName}: Present and valid`);
    }
  }

  validateOptionalVariables() {
    console.log('\n🔧 Checking optional configuration...');

    const optional = {
      SENTRY_DSN: {
        description: 'Sentry error tracking DSN',
        pattern: /^https:\/\/.*@.*\.ingest\.sentry\.io\/.*$/,
      },
      UPLOADTHING_SECRET: {
        description: 'UploadThing file upload secret',
        minLength: 10,
      },
      UPLOADTHING_APP_ID: {
        description: 'UploadThing application ID',
        minLength: 5,
      },
      SLACK_WEBHOOK_DB: {
        description: 'Slack webhook for database alerts',
        pattern: /^https:\/\/hooks\.slack\.com\/services\/.*$/,
      },
      SLACK_WEBHOOK_API: {
        description: 'Slack webhook for API alerts',
        pattern: /^https:\/\/hooks\.slack\.com\/services\/.*$/,
      },
      METRICS_ENDPOINT: {
        description: 'External metrics collection endpoint',
        pattern: /^https?:\/\/.*$/,
      },
    };

    for (const [varName, config] of Object.entries(optional)) {
      const value = process.env[varName];

      if (!value) {
        this.addWarning(`Optional variable not set: ${varName}`, config.description);
        continue;
      }

      // Validate format if present
      if (config.pattern && !config.pattern.test(value)) {
        this.addWarning(`Invalid format for ${varName}`, `Expected pattern: ${config.pattern}`);
      }

      if (config.minLength && value.length < config.minLength) {
        this.addWarning(`${varName} might be too short`, `Recommended minimum: ${config.minLength}`);
      }

      this.addInfo(`✅ ${varName}: Present and valid`);
    }
  }

  validateDatabaseConfig() {
    console.log('\n🗄️ Validating database configuration...');

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return;

    try {
      const url = new URL(dbUrl);

      // Check protocol
      if (url.protocol !== 'postgresql:') {
        this.addError('Invalid database protocol', `Expected 'postgresql:', got '${url.protocol}'`);
      }

      // Check host
      if (!url.hostname) {
        this.addError('Database hostname missing', 'DATABASE_URL must include hostname');
      }

      // Check database name
      if (!url.pathname || url.pathname === '/') {
        this.addError('Database name missing', 'DATABASE_URL must include database name');
      }

      // Production-specific checks
      if (process.env.NODE_ENV === 'production') {
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          this.addError('Production using localhost database', 'Use remote database in production');
        }

        if (!url.searchParams.get('sslmode') && !url.searchParams.get('ssl')) {
          this.addWarning('SSL not configured for database', 'Consider enabling SSL for production');
        }
      }

      this.addInfo('✅ Database URL format is valid');

    } catch (error) {
      this.addError('Invalid DATABASE_URL format', error.message);
    }
  }

  validateAuthConfig() {
    console.log('\n🔐 Validating authentication configuration...');

    const secret = process.env.NEXTAUTH_SECRET;
    const url = process.env.NEXTAUTH_URL;

    if (secret) {
      // Check secret strength
      if (secret.length < 32) {
        this.addError('NEXTAUTH_SECRET too weak', 'Use at least 32 characters');
      }

      // Check for common weak secrets
      const weakSecrets = ['secret', 'password', '123456', 'changeme'];
      if (weakSecrets.some(weak => secret.toLowerCase().includes(weak))) {
        this.addError('NEXTAUTH_SECRET appears weak', 'Avoid common words and patterns');
      }

      this.addInfo('✅ NEXTAUTH_SECRET appears strong');
    }

    if (url) {
      try {
        const authUrl = new URL(url);

        if (process.env.NODE_ENV === 'production' && authUrl.protocol !== 'https:') {
          this.addError('NEXTAUTH_URL not using HTTPS', 'Production must use HTTPS');
        }

        this.addInfo('✅ NEXTAUTH_URL format is valid');

      } catch (error) {
        this.addError('Invalid NEXTAUTH_URL format', error.message);
      }
    }

    // Check for OAuth providers
    const providers = ['GOOGLE_CLIENT_ID', 'GITHUB_CLIENT_ID', 'DISCORD_CLIENT_ID'];
    const configuredProviders = providers.filter(provider => process.env[provider]);

    if (configuredProviders.length === 0) {
      this.addWarning('No OAuth providers configured', 'Consider adding Google, GitHub, or Discord authentication');
    } else {
      this.addInfo(`✅ OAuth providers configured: ${configuredProviders.length}`);
    }
  }

  validateMonitoringConfig() {
    console.log('\n📊 Validating monitoring configuration...');

    // Sentry configuration
    if (process.env.SENTRY_DSN) {
      if (!process.env.SENTRY_DSN.includes('sentry.io')) {
        this.addWarning('Sentry DSN format might be invalid', 'Verify the DSN format');
      } else {
        this.addInfo('✅ Sentry error tracking configured');
      }
    } else {
      this.addWarning('Error tracking not configured', 'Consider adding Sentry for error monitoring');
    }

    // Alerting configuration
    const webhooks = ['SLACK_WEBHOOK_DB', 'SLACK_WEBHOOK_API', 'SLACK_WEBHOOK_AUTH'];
    const configuredWebhooks = webhooks.filter(webhook => process.env[webhook]);

    if (configuredWebhooks.length === 0 && process.env.NODE_ENV === 'production') {
      this.addWarning('No alert webhooks configured', 'Configure Slack webhooks for production monitoring');
    } else if (configuredWebhooks.length > 0) {
      this.addInfo(`✅ Alert webhooks configured: ${configuredWebhooks.length}`);
    }
  }

  validateDeploymentConfig() {
    console.log('\n🚀 Validating deployment configuration...');

    if (process.env.NODE_ENV === 'production') {
      // Vercel-specific checks
      if (process.env.VERCEL) {
        const requiredVercelVars = ['VERCEL_URL', 'VERCEL_ENV'];
        const missingVercelVars = requiredVercelVars.filter(varName => !process.env[varName]);

        if (missingVercelVars.length > 0) {
          this.addWarning('Missing Vercel variables', missingVercelVars.join(', '));
        } else {
          this.addInfo('✅ Vercel deployment variables present');
        }
      }

      // Check for development-specific variables in production
      const devVars = ['DATABASE_URL'];
      devVars.forEach(varName => {
        const value = process.env[varName];
        if (value && (value.includes('localhost') || value.includes('127.0.0.1'))) {
          this.addError(`Development value in production: ${varName}`, 'Use production values');
        }
      });
    }

    // Check NODE_ENV consistency
    if (process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV === 'production') {
      this.addWarning('NODE_ENV inconsistent with VERCEL_ENV', 'Verify environment configuration');
    }
  }

  validateSecrets() {
    console.log('\n🔒 Validating secrets security...');

    const secretVars = [
      'NEXTAUTH_SECRET',
      'DATABASE_URL',
      'SENTRY_DSN',
      'UPLOADTHING_SECRET',
    ];

    secretVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        // Check if secret might be exposed in version control
        if (value.length < 16) {
          this.addWarning(`${varName} might be too simple`, 'Use longer, more complex secrets');
        }

        // Check for obvious test values
        const testPatterns = ['test', 'demo', 'example', 'localhost'];
        if (testPatterns.some(pattern => value.toLowerCase().includes(pattern)) &&
            process.env.NODE_ENV === 'production') {
          this.addError(`${varName} appears to be a test value`, 'Use production secrets');
        }
      }
    });

    this.addInfo('✅ Secrets validation completed');
  }

  validateFiles() {
    console.log('\n📁 Validating configuration files...');

    const requiredFiles = [
      'package.json',
      'next.config.js',
      'tailwind.config.js',
      'tsconfig.json',
      'prisma/schema.prisma',
    ];

    const optionalFiles = [
      '.env.local',
      '.env.example',
      'docker-compose.yml',
      'lighthouserc.json',
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.addInfo(`✅ Required file present: ${file}`);
      } else {
        this.addError(`Missing required file: ${file}`, 'File is required for proper operation');
      }
    });

    optionalFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.addInfo(`✅ Optional file present: ${file}`);
      } else {
        this.addWarning(`Optional file missing: ${file}`, 'Consider adding for better development experience');
      }
    });
  }

  addError(title, description) {
    this.errors.push({ title, description });
    console.log(`❌ ${title}: ${description}`);
  }

  addWarning(title, description) {
    this.warnings.push({ title, description });
    console.log(`⚠️  ${title}: ${description}`);
  }

  addInfo(message) {
    this.info.push(message);
    // Don't log info messages during validation (too verbose)
  }

  generateReport() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 ENVIRONMENT VALIDATION REPORT');
    console.log('=' .repeat(60));

    console.log(`❌ Errors: ${this.errors.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`✅ Checks passed: ${this.info.length}`);

    if (this.errors.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES (must fix):');
      this.errors.forEach(error => {
        console.log(`  ❌ ${error.title}`);
        console.log(`     ${error.description}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (recommended fixes):');
      this.warnings.forEach(warning => {
        console.log(`  ⚠️  ${warning.title}`);
        console.log(`     ${warning.description}`);
      });
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('  🎉 Environment configuration looks perfect!');
    } else {
      if (this.errors.length > 0) {
        console.log('  🔧 Fix all errors before deploying to production');
      }
      if (this.warnings.length > 0) {
        console.log('  📋 Address warnings for improved security and monitoring');
      }
      console.log('  📚 Refer to documentation for configuration details');
    }

    console.log('\n' + '=' .repeat(60));
  }
}

// Run validation
const validator = new EnvironmentValidator();
validator.validate();