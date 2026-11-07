import { defineConfig,devices } from '@playwright/test';
if(!/^forja_test_[a-z0-9_]+$/.test(process.env.FORJA_TEST_SCHEMA||'')) throw new Error('Execute npm test para criar um schema Neon isolado.');
export default defineConfig({
  testDir:'./tests/neon',timeout:60000,workers:1,fullyParallel:false,
  expect:{timeout:20000},
  use:{baseURL:'http://127.0.0.1:5180',trace:'retain-on-failure'},
  webServer:{command:'node scripts/dev.mjs --port 5180 --strictPort',url:'http://127.0.0.1:5180',reuseExistingServer:false},
  projects:[{name:'chromium-mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}},{name:'webkit-mobile',use:{...devices['iPhone 13']}}],
});
