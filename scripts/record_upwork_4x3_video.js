const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG_PATH = path.join(__dirname, '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
const HTML_FILE = path.join(__dirname, '..', 'upwork', 'banner_4x3_animated.html');
const FRAMES_DIR = path.join(__dirname, '..', 'temp_4x3_frames');
const OUTPUT_MP4 = path.join(__dirname, '..', 'upwork_catalog_video_4x3.mp4');

async function main() {
  console.log('🚀 Starting Official Upwork 4:3 Video Generator...');

  if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
  }

  // Clear previous frames
  for (const f of fs.readdirSync(FRAMES_DIR)) {
    fs.unlinkSync(path.join(FRAMES_DIR, f));
  }

  console.log('📱 Launching Chrome compositor in 1200x900 (4:3)...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars']
  });

  const page = await browser.newPage();
  
  // Set viewport to exact Upwork 4:3 default: 1200 x 900
  await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 });
  await page.goto('file:///' + HTML_FILE.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  // Scale body to fit 1200x900 viewport seamlessly
  await page.evaluate(() => {
    document.body.style.transform = 'scale(0.75)';
    document.body.style.transformOrigin = 'top left';
    document.body.style.width = '1600px';
    document.body.style.height = '1200px';
  });

  let frameCount = 0;

  async function captureFrames(count = 1) {
    for (let i = 0; i < count; i++) {
      frameCount++;
      const framePath = path.join(FRAMES_DIR, `frame_${String(frameCount).padStart(5, '0')}.png`);
      await page.screenshot({ path: framePath, type: 'png' });
    }
  }

  console.log('🎬 Recording 4:3 Upwork Catalog Showcase Video...');

  // Helper to highlight a card
  async function highlightCard(cardId) {
    await page.evaluate((id) => {
      document.querySelectorAll('.glass-card').forEach(c => c.classList.remove('active-glow'));
      if (id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('active-glow');
      }
    }, cardId);
  }

  // Helper to update clock
  async function setClock(timeStr) {
    await page.evaluate((t) => {
      const clock = document.getElementById('status-bar-clock');
      if (clock) clock.textContent = t;
    }, timeStr);
  }

  // Start with 11:41 and initial frame pause
  await setClock('11:41');
  await captureFrames(8);

  const steps = [
    {
      sender: "customer",
      time: "11:42 AM",
      text: "Hi! Can I see your lunch menu please? Looking to order for delivery.",
      card: null
    },
    {
      sender: "bot",
      time: "11:42 AM",
      text: "Hello! Welcome to *Bistro Gourmet - American Craft Kitchen* 🍔🍕\n\n🍔 *Artisan Burgers*:\n• *The Classic Bacon Cheeseburger* - $13.99\n• *Smoky Texas BBQ Brisket Burger* - $16.50\n• *Loaded Truffle Parmesan Fries* - $7.50\n\n🛵 *Flat Delivery Fee*: $3.99\n\nWhat can I get started for you?",
      card: "card-dual-number"
    },
    {
      sender: "customer",
      time: "11:44 AM",
      text: "I'll take 2 Classic Bacon Cheeseburgers and 1 Loaded Truffle Parmesan Fries please.",
      card: "card-gpt-memory"
    },
    {
      sender: "bot",
      time: "11:44 AM",
      text: "Fantastic choice! 🍔🍟 Could you please provide your full *Delivery Address*?",
      card: null
    },
    {
      sender: "customer",
      time: "11:45 AM",
      text: "742 Evergreen Terrace, Springfield, OR 97477. Leave on the porch table.",
      card: null
    },
    {
      sender: "bot",
      time: "11:45 AM",
      text: "📋 *ORDER SUMMARY*\n• 2x Bacon Cheeseburgers ($27.98)\n• 1x Loaded Truffle Fries ($7.50)\n• Flat Delivery Fee: $3.99\n------------------------\n💵 *Total Bill*: *$39.47*\n\nShall I confirm this order for kitchen dispatch?",
      card: "card-supabase"
    },
    {
      sender: "customer",
      time: "11:46 AM",
      text: "Yes, please confirm the order!",
      card: null
    },
    {
      sender: "bot",
      time: "11:46 AM",
      text: "🎉 *Order Confirmed!*\n🆔 *Order ID*: *#ORD-8492*\n⏱️ *Estimated Delivery*: 30-35 mins\nDispatched to Kitchen Staff (WhatsApp B) 👨‍🍳",
      card: "card-push-alerts"
    },
    {
      sender: "customer",
      time: "12:02 PM",
      text: "Hey, where is my order right now?",
      card: "card-status-tracking"
    },
    {
      sender: "bot",
      time: "12:02 PM",
      text: "👨‍🍳 *Live Kitchen Update*:\nYour order *#ORD-8492* has finished cooking on the grill and is packed in thermal bags! ETA: ~12 mins.",
      card: "card-kds-dashboard"
    },
    {
      sender: "bot",
      time: "12:10 PM",
      text: "🛵 *Driver Out for Delivery*:\nDriver Mike is on his way to 742 Evergreen Terrace! Please keep phone handy.",
      card: "card-kds-dashboard"
    }
  ];

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const cleanTime = s.time.replace(/ [AP]M/i, '').trim();

    await setClock(cleanTime);
    if (s.card) await highlightCard(s.card);

    if (s.sender === 'bot') {
      // Show typing indicator
      await page.evaluate(() => {
        document.getElementById('typing-indicator').classList.remove('hidden');
        document.getElementById('bot-status-text').textContent = "typing...";
        const stream = document.getElementById('chat-stream');
        stream.scrollTop = stream.scrollHeight;
      });
      await captureFrames(6);

      // Add message
      await page.evaluate((m) => {
        document.getElementById('typing-indicator').classList.add('hidden');
        document.getElementById('bot-status-text').textContent = "Official Business • online";
        const list = document.getElementById('messages-list');
        list.appendChild(createBubble(m));
        const stream = document.getElementById('chat-stream');
        stream.scrollTop = stream.scrollHeight;
      }, s);

      await captureFrames(10);
    } else {
      // Customer message
      await page.evaluate((m) => {
        const list = document.getElementById('messages-list');
        list.appendChild(createBubble(m));
        const stream = document.getElementById('chat-stream');
        stream.scrollTop = stream.scrollHeight;
      }, s);

      await captureFrames(8);
    }
  }

  // Hold final full showcase frame for 24 frames (~3 seconds)
  await highlightCard('card-kds-dashboard');
  await captureFrames(24);

  await browser.close();
  console.log(`📸 Captured ${frameCount} frames total.`);

  console.log('🎞️ Compiling 4:3 video with FFmpeg...');
  if (fs.existsSync(OUTPUT_MP4)) {
    fs.unlinkSync(OUTPUT_MP4);
  }

  const ffmpegArgs = [
    '-y',
    '-framerate', '8',
    '-i', path.join(FRAMES_DIR, 'frame_%05d.png'),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '18',
    '-movflags', '+faststart',
    OUTPUT_MP4
  ];

  execFileSync(FFMPEG_PATH, ffmpegArgs, { stdio: 'inherit' });

  // Clean up frames
  console.log('🧹 Cleaning up intermediate frames...');
  for (const f of fs.readdirSync(FRAMES_DIR)) {
    fs.unlinkSync(path.join(FRAMES_DIR, f));
  }
  fs.rmdirSync(FRAMES_DIR);

  const stats = fs.statSync(OUTPUT_MP4);
  console.log(`✅ SUCCESS! Upwork 4:3 Video created at: ${OUTPUT_MP4} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
}

main().catch(err => {
  console.error('❌ Error recording 4:3 video:', err);
  process.exit(1);
});
