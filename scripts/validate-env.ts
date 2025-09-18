#!/usr/bin/env tsx

import { validateExternalServices } from '@/lib/env'

async function main() {
  try {
    console.log('🔍 Validating environment configuration...')

    // Environment variables are validated when importing env.ts
    console.log('✅ Environment variables validated successfully')

    console.log('🔍 Validating external services...')
    const result = await validateExternalServices()

    console.log('✅ External services validation completed')
    console.log(`📊 Status: ${result.status}`)
    console.log(`⏰ Timestamp: ${result.timestamp}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Environment validation failed:')
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}