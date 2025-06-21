const { chromium } = require('playwright');
const { spawn } = require('child_process');

(async () => {
  const server = spawn('npm', ['start'], { stdio: 'inherit' });

  await new Promise(r => setTimeout(r, 3000));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  await browser.close();

  server.kill();

  if (errors.some(e => e.includes('maxVertexTextures'))) {
    console.error('Found maxVertexTextures error:', errors);
    process.exit(1);
  } else {
    console.log('No maxVertexTextures error detected.');
  }
})();
