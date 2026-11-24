const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML_FILE = path.join(__dirname, '..', 'upwork', 'banner_4x3_template.html');
const OUTPUT_4X3_1600 = path.join(__dirname, '..', 'upwork_catalog_cover_4x3.png');
const OUTPUT_4X3_1200 = path.join(__dirname, '..', 'upwork_catalog_cover_1200x900.png');

async function main() {
  console.log('🎨 Generating Official Upwork 4:3 Ratio Cover Images...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set viewport to exact 1600x1200 (4:3 aspect ratio)
  await page.setViewport({
    width: 1600,
    height: 1200,
    deviceScaleFactor: 1
  });

  await page.goto('file:///' + HTML_FILE.replace(/\\/g, '/'), {
    waitUntil: 'networkidle0'
  });

  await new Promise(r => setTimeout(r, 1200));

  // 1. Capture 1600x1200 (High-Res 4:3)
  await page.screenshot({
    path: OUTPUT_4X3_1600,
    type: 'png'
  });
  console.log(`✅ 1600x1200 image created at: ${OUTPUT_4X3_1600}`);

  // 2. Set viewport to 1200x900 (Upwork's Recommended Standard 4:3)
  await page.setViewport({
    width: 1200,
    height: 900,
    deviceScaleFactor: 1
  });
  
  // Scale body to fit 1200x900
  await page.evaluate(() => {
    document.body.style.transform = 'scale(0.75)';
    document.body.style.transformOrigin = 'top left';
    document.body.style.width = '1600px';
    document.body.style.height = '1200px';
  });

  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({
    path: OUTPUT_4X3_1200,
    type: 'png'
  });
  console.log(`✅ 1200x900 image created at: ${OUTPUT_4X3_1200}`);

  await browser.close();
  console.log('🎉 Finished rendering 4:3 Upwork Project Catalog covers!');
}

main().catch(err => {
  console.error('❌ Error generating 4:3 images:', err);
  process.exit(1);
});
