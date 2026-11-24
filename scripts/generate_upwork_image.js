const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML_FILE = path.join(__dirname, '..', 'upwork', 'banner_template.html');
const OUTPUT_IMAGE = path.join(__dirname, '..', 'upwork_catalog_cover.png');

async function main() {
  console.log('🎨 Generating High-Resolution Upwork Catalog Cover Image...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set viewport to 1280x720 with deviceScaleFactor: 2 for crisp 2560x1440 Retina quality
  await page.setViewport({
    width: 1280,
    height: 720,
    deviceScaleFactor: 2
  });

  await page.goto('file:///' + HTML_FILE.replace(/\\/g, '/'), {
    waitUntil: 'networkidle0'
  });

  // Short pause to ensure fonts, icons, and gradients are fully painted
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({
    path: OUTPUT_IMAGE,
    type: 'png'
  });

  await browser.close();

  const stats = fs.statSync(OUTPUT_IMAGE);
  console.log(`✅ SUCCESS! Upwork Catalog Cover created at: ${OUTPUT_IMAGE} (${(stats.size / 1024).toFixed(1)} KB)`);
}

main().catch(err => {
  console.error('❌ Error generating image:', err);
  process.exit(1);
});
