const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG_PATH = path.join(__dirname, '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
const HTML_FILE = path.join(__dirname, '..', 'whatsapp-mockup', 'index.html');
const FRAMES_DIR = path.join(__dirname, '..', 'temp_frames');
const OUTPUT_MP4 = path.join(__dirname, '..', 'whatsapp_chat_demo.mp4');

async function main() {
  console.log('🚀 Starting Automated WhatsApp Video Generator...');

  if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
  }

  // Clear previous frames
  const oldFiles = fs.readdirSync(FRAMES_DIR);
  for (const f of oldFiles) {
    fs.unlinkSync(path.join(FRAMES_DIR, f));
  }

  console.log('📱 Launching Headless Chrome compositor...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 520, height: 900, deviceScaleFactor: 2 });
  await page.goto('file:///' + HTML_FILE.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  // Hide the top control bar during video capture so only the pure iPhone frame is recorded
  await page.evaluate(() => {
    const controlBar = document.querySelector('.max-w-4xl');
    if (controlBar) controlBar.style.display = 'none';
    document.body.style.padding = '0';
    document.body.style.margin = '0';
    document.body.style.display = 'flex';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
    document.body.style.minHeight = '100vh';
  });

  let frameCount = 0;
  const phoneElement = await page.$('#phone-container');

  async function captureFrames(count = 1) {
    for (let i = 0; i < count; i++) {
      frameCount++;
      const framePath = path.join(FRAMES_DIR, `frame_${String(frameCount).padStart(5, '0')}.png`);
      await phoneElement.screenshot({ path: framePath });
    }
  }

  console.log('🎬 Recording conversation animation frame-by-frame...');

  // Reset chat container and initialize phone status clock to 11:41
  await page.evaluate(() => {
    document.getElementById('messages-list').innerHTML = '';
    const clock = document.getElementById('status-bar-clock');
    if (clock) clock.textContent = '11:41';
  });

  // Capture initial empty phone view
  await captureFrames(8);

  const conversationSteps = [
    {
      sender: "customer",
      time: "11:42 AM",
      text: "Hi! Can I see your lunch menu please? Looking to order for delivery."
    },
    {
      sender: "bot",
      time: "11:42 AM",
      text: "Hello! Welcome to *Bistro Gourmet - American Craft Kitchen* 🍔🍕\n\nHere is our fresh lunch menu:\n\n🍔 *Artisan Burgers*:\n• *The Classic Bacon Cheeseburger* - $13.99\n• *Smoky Texas BBQ Brisket Burger* - $16.50\n• *Crispy Nashville Hot Chicken* - $14.25\n• *Truffle Mushroom Swiss* - $15.75\n\n🍕 *Woodfired Pizzas (14\" Large)*:\n• *Brooklyn Pepperoni Feast* - $21.99\n• *Smoked BBQ Chicken Pizza* - $19.50\n\n🍟 *Sides & Appetizers*:\n• *Loaded Truffle Parmesan Fries* - $7.50\n• *Buffalo Wings (8 Pcs)* - $11.99\n\n🥤 *Beverages*:\n• *Hand-Spun Salted Caramel Shake* - $6.50\n• *Classic Coca-Cola Can* - $2.50\n\n🛵 *Flat Delivery Fee*: $3.99 across town\n\nWhat can I get prepared for you?"
    },
    {
      sender: "customer",
      time: "11:44 AM",
      text: "Sounds great! I'll take 2 Classic Bacon Cheeseburgers and 1 Loaded Truffle Parmesan Fries please."
    },
    {
      sender: "bot",
      time: "11:44 AM",
      text: "Fantastic choice! 🍔🍟\n\nCould you please provide your full *Delivery Address* (Street, Apt/Suite, City, State, ZIP code)?"
    },
    {
      sender: "customer",
      time: "11:45 AM",
      text: "742 Evergreen Terrace, Springfield, OR 97477. Also please leave it on the porch table and ring the doorbell once."
    },
    {
      sender: "bot",
      time: "11:45 AM",
      text: "Perfect! Here is your order breakdown:\n\n📋 *ORDER SUMMARY*\n• 2x The Classic Bacon Cheeseburger ($27.98)\n• 1x Loaded Truffle Parmesan Fries ($7.50)\n• Flat Delivery Fee: $3.99\n--------------------------------\n💵 *Total Bill*: *$39.47*\n📍 *Deliver To*: 742 Evergreen Terrace, Springfield, OR 97477\n📝 *Notes*: Leave on porch table, ring doorbell once.\n\nShall I confirm this order and dispatch it straight to our kitchen?"
    },
    {
      sender: "customer",
      time: "11:46 AM",
      text: "Yes, please confirm the order!"
    },
    {
      sender: "bot",
      time: "11:46 AM",
      text: "🎉 *Order Confirmed & Sent to Kitchen!*\n\n🆔 *Order ID*: *#ORD-8492*\n⏱️ *Estimated Delivery*: 30-35 mins\n💵 *Payment*: Pay Driver on Delivery ($39.47)\n\nOur kitchen team is firing up the grill right now! You can reply *\"Where is my order?\"* at any time for live status tracking. Enjoy!"
    },
    {
      sender: "customer",
      time: "12:02 PM",
      text: "Hey, where is my order right now?"
    },
    {
      sender: "bot",
      time: "12:02 PM",
      text: "👨‍🍳 *Live Kitchen Update*:\nYour order *#ORD-8492* has finished cooking on the grill and is currently being packed in insulated thermal bags! Dispatch driver assignment is in progress.\n\n⏱️ *Estimated arrival*: ~12 minutes!"
    },
    {
      sender: "bot",
      time: "12:10 PM",
      text: "🛵 *Driver Out for Delivery*:\nDriver Mike has picked up your meal from the kitchen and is en route to 742 Evergreen Terrace in a silver Honda Civic. Please keep your phone handy!"
    }
  ];

  for (let i = 0; i < conversationSteps.length; i++) {
    const msg = conversationSteps[i];
    const cleanTime = msg.time.replace(/ [AP]M/i, '').trim();

    // Advance the iPhone status bar clock to match the message time in real-time
    await page.evaluate((t) => {
      const clock = document.getElementById('status-bar-clock');
      if (clock) clock.textContent = t;
    }, cleanTime);

    if (msg.sender === 'bot') {
      // Show typing indicator
      await page.evaluate(() => {
        document.getElementById('typing-indicator').classList.remove('hidden');
        document.getElementById('bot-status-text').textContent = "typing...";
        const stream = document.getElementById('chat-stream');
        stream.scrollTop = stream.scrollHeight;
      });
      // Capture 6 frames of typing
      await captureFrames(6);

      // Hide typing and add message
      await page.evaluate((m) => {
        document.getElementById('typing-indicator').classList.add('hidden');
        document.getElementById('bot-status-text').textContent = "Official Business Account • online";
        window.messagesList = document.getElementById('messages-list');
        window.messagesList.appendChild(createMessageBubble(m));
        const stream = document.getElementById('chat-stream');
        stream.scrollTop = stream.scrollHeight;
      }, msg);

      // Capture 10 frames of reading
      await captureFrames(10);
    } else {
      // Customer message appears
      await page.evaluate((m) => {
        window.messagesList = document.getElementById('messages-list');
        window.messagesList.appendChild(createMessageBubble(m));
        const stream = document.getElementById('chat-stream');
        stream.scrollTop = stream.scrollHeight;
      }, msg);

      // Capture 8 frames
      await captureFrames(8);
    }
  }

  // Hold the final confirmation state for 25 frames (~3 seconds)
  await captureFrames(25);

  await browser.close();
  console.log(`📸 Captured ${frameCount} frames total.`);

  console.log('🎞️ Compiling frames into MP4 with FFmpeg...');
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

  // Clean up frames to save disk space
  console.log('🧹 Cleaning up intermediate frames...');
  for (const f of fs.readdirSync(FRAMES_DIR)) {
    fs.unlinkSync(path.join(FRAMES_DIR, f));
  }
  fs.rmdirSync(FRAMES_DIR);

  const stats = fs.statSync(OUTPUT_MP4);
  console.log(`✅ SUCCESS! MP4 Video created at: ${OUTPUT_MP4} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
}

main().catch(err => {
  console.error('❌ Error recording video:', err);
  process.exit(1);
});
