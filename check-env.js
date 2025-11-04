#!/usr/bin/env node
/**
 * Quick script to check if required environment variables are set
 */

const requiredVars = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  BROWSERBASE_API_KEY: process.env.BROWSERBASE_API_KEY,
  BROWSERBASE_PROJECT_ID: process.env.BROWSERBASE_PROJECT_ID,
};

console.log('Environment Variables Check:\n');
console.log('='.repeat(50));

let allSet = true;

for (const [key, value] of Object.entries(requiredVars)) {
  const isSet = !!value;
  const status = isSet ? '✅ SET' : '❌ NOT SET';
  const preview = isSet ? value.substring(0, 10) + '...' : '';
  
  console.log(`${key}: ${status} ${preview}`);
  
  if (!isSet && key === 'OPENAI_API_KEY') {
    console.log('   ⚠️  Required for CUA mode (Phase 4a)');
  }
  
  if (!isSet) {
    allSet = false;
  }
}

console.log('='.repeat(50));

if (!allSet) {
  console.log('\n💡 To set environment variables:');
  console.log('   1. Create a .env file in the project root:');
  console.log('      OPENAI_API_KEY=sk-...');
  console.log('      BROWSERBASE_API_KEY=...');
  console.log('      BROWSERBASE_PROJECT_ID=...');
  console.log('\n   2. Or export in your shell:');
  console.log('      export OPENAI_API_KEY=sk-...');
  console.log('\n   3. Bun should auto-load .env files');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
  process.exit(0);
}

