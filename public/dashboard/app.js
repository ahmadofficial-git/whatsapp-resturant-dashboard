/**
 * BistroKDS - Kitchen Display System & Operations Board
 * US Market Edition: USD ($) Pricing & American Regional Names
 */

// Initial Seed Orders for Portfolio Showcase
const DEMO_ORDERS = [
  {
    id: "ord-1",
    order_number: "ORD-2041",
    customer_name: "Michael Johnson",
    customer_phone: "+1 (555) 234-5678",
    delivery_address: "742 Evergreen Terrace, Springfield, OR 97477",
    order_items: [
      { item: "The Classic Bacon Cheeseburger", qty: 2, price: 13.99, total: 27.98 },
      { item: "Loaded Truffle Parmesan Fries", qty: 1, price: 7.50, total: 7.50 },
      { item: "Hand-Spun Salted Caramel Shake", qty: 2, price: 6.50, total: 13.00 }
    ],
    subtotal: 48.48,
    delivery_fee: 3.99,
    total_amount: 52.47,
    special_notes: "Leave at front porch table. Ring doorbell once.",
    status: "preparing",
    estimated_prep_mins: 25,
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString()
  },
  {
    id: "ord-2",
    order_number: "ORD-7719",
    customer_name: "Sarah Jenkins",
    customer_phone: "+1 (555) 876-5432",
    delivery_address: "450 5th Ave, Apt 12B, New York, NY 10018",
    order_items: [
      { item: "Brooklyn Pepperoni Feast (14\" Large)", qty: 1, price: 21.99, total: 21.99 },
      { item: "Buffalo Wings (8 Pcs)", qty: 1, price: 11.99, total: 11.99 },
      { item: "Classic Coca-Cola Can (12 oz)", qty: 2, price: 2.50, total: 5.00 }
    ],
    subtotal: 38.98,
    delivery_fee: 3.99,
    total_amount: 42.97,
    special_notes: "Buzzer code #4021. Elevator on the left.",
    status: "received",
    estimated_prep_mins: 30,
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString()
  },
  {
    id: "ord-3",
    order_number: "ORD-5820",
    customer_name: "David Miller",
    customer_phone: "+1 (555) 432-1098",
    delivery_address: "1284 Sunset Blvd, Los Angeles, CA 90026",
    order_items: [
      { item: "Crispy Nashville Hot Chicken", qty: 1, price: 14.25, total: 14.25 },
      { item: "Fresh Strawberry Lemonade", qty: 1, price: 4.75, total: 4.75 }
    ],
    subtotal: 19.00,
    delivery_fee: 3.99,
    total_amount: 22.99,
    special_notes: "Please include extra ranch dressing.",
    status: "out_for_delivery",
    estimated_prep_mins: 35,
    created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString()
  },
  {
    id: "ord-4",
    order_number: "ORD-1093",
    customer_name: "Emily Davis",
    customer_phone: "+1 (555) 987-6543",
    delivery_address: "350 S Michigan Ave, Chicago, IL 60604",
    order_items: [
      { item: "Truffle Mushroom Swiss Burger", qty: 1, price: 15.75, total: 15.75 },
      { item: "Warm Cast-Iron Chocolate Chip Cookie", qty: 1, price: 8.50, total: 8.50 }
    ],
    subtotal: 24.25,
    delivery_fee: 3.99,
    total_amount: 28.24,
    special_notes: "Extra napkins please.",
    status: "delivered",
    estimated_prep_mins: 30,
    created_at: new Date(Date.now() - 65 * 60 * 1000).toISOString()
  }
];

class KitchenDisplaySystem {
  constructor() {
    this.orders = JSON.parse(localStorage.getItem('kds_orders_us')) || DEMO_ORDERS;
    this.soundEnabled = true;
    this.supabaseClient = null;

    // Check URL query parameters (ideal for Vercel demo URLs)
    const urlParams = new URLSearchParams(window.location.search);
    const paramUrl = urlParams.get('supabaseUrl') || urlParams.get('supabase_url');
    const paramKey = urlParams.get('supabaseKey') || urlParams.get('supabase_key');
    const paramN8n = urlParams.get('n8nUrl') || urlParams.get('n8n_url');

    if (paramUrl) localStorage.setItem('kds_supabase_url', paramUrl);
    if (paramKey) localStorage.setItem('kds_supabase_key', paramKey);
    if (paramN8n) localStorage.setItem('kds_n8n_url', paramN8n);

    // Support Vercel runtime config & localStorage
    const env = window.ENV || {};
    this.n8nWebhookUrl = localStorage.getItem('kds_n8n_url') || env.N8N_URL || '';
    this.supabaseUrl = localStorage.getItem('kds_supabase_url') || env.SUPABASE_URL || '';
    this.supabaseKey = localStorage.getItem('kds_supabase_key') || env.SUPABASE_KEY || '';

    this.audioContext = null;

    this.initElements();
    this.initSupabase();
    this.bindEvents();
    this.render();

    // Re-render elapsed time every 10 seconds
    setInterval(() => this.render(), 10000);
  }

  initElements() {
    this.colReceived = document.getElementById('col-received');
    this.colPreparing = document.getElementById('col-preparing');
    this.colDispatched = document.getElementById('col-dispatched');
    this.colDelivered = document.getElementById('col-delivered');

    this.badgeReceived = document.getElementById('badge-count-received');
    this.badgePreparing = document.getElementById('badge-count-preparing');
    this.badgeDispatched = document.getElementById('badge-count-dispatched');
    this.badgeDelivered = document.getElementById('badge-count-delivered');

    this.statActive = document.getElementById('stat-active');
    this.statPreparing = document.getElementById('stat-preparing');
    this.statDispatched = document.getElementById('stat-dispatched');
    this.statRevenue = document.getElementById('stat-revenue');

    this.btnSimulate = document.getElementById('btn-simulate-order');
    this.btnSound = document.getElementById('btn-sound-toggle');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnSettings = document.getElementById('btn-open-settings');
    this.modalSettings = document.getElementById('modal-settings');
    this.btnCloseSettings = document.getElementById('btn-close-settings');
    this.btnSaveSettings = document.getElementById('btn-save-settings');
    this.btnResetDemo = document.getElementById('btn-reset-demo');

    this.cfgSupabaseUrl = document.getElementById('cfg-supabase-url');
    this.cfgSupabaseKey = document.getElementById('cfg-supabase-key');
    this.cfgN8nUrl = document.getElementById('cfg-n8n-url');

    this.modalOrderDetails = document.getElementById('modal-order-details');
    this.orderDetailsContainer = document.getElementById('order-details-container');
    this.toastContainer = document.getElementById('toast-container');

    if (this.cfgSupabaseUrl) this.cfgSupabaseUrl.value = this.supabaseUrl;
    if (this.cfgSupabaseKey) this.cfgSupabaseKey.value = this.supabaseKey;
    if (this.cfgN8nUrl) this.cfgN8nUrl.value = this.n8nWebhookUrl;
  }

  initSupabase() {
    if (this.supabaseUrl && this.supabaseKey && window.supabase) {
      try {
        this.supabaseClient = window.supabase.createClient(this.supabaseUrl, this.supabaseKey, {
          db: { schema: 'food_ops' }
        });
        this.fetchOrdersFromSupabase();
        this.subscribeToSupabaseRealtime();
        this.showToast('Connected to Supabase (food_ops schema)', 'success');
      } catch (err) {
        console.error('Supabase init error:', err);
      }
    }
  }

  async fetchOrdersFromSupabase() {
    if (!this.supabaseClient) return;
    try {
      const { data, error } = await this.supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        this.orders = data;
        this.saveOrders();
        this.render();
      }
    } catch (err) {
      console.warn('Using local order cache:', err);
    }
  }

  subscribeToSupabaseRealtime() {
    if (!this.supabaseClient) return;
    this.supabaseClient
      .channel('kds-orders-us-channel')
      .on('postgres_changes', { event: '*', schema: 'food_ops', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          this.orders.unshift(payload.new);
          this.playKitchenBell();
          this.showToast(`🔔 New Order from ${payload.new.customer_name}: ${payload.new.order_number}`, 'info');
        } else if (payload.eventType === 'UPDATE') {
          const idx = this.orders.findIndex(o => o.order_number === payload.new.order_number);
          if (idx !== -1) {
            this.orders[idx] = payload.new;
          }
        }
        this.saveOrders();
        this.render();
      })
      .subscribe();
  }

  bindEvents() {
    this.btnSimulate.addEventListener('click', () => this.simulateNewOrder());

    this.btnSound.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      this.soundIcon.className = this.soundEnabled ? 'fa-solid fa-bell text-amber-400' : 'fa-solid fa-bell-slash text-slate-500';
      this.showToast(`Kitchen Bell ${this.soundEnabled ? 'Enabled' : 'Muted'}`, 'info');
      if (this.soundEnabled) this.playKitchenBell();
    });

    this.btnSettings.addEventListener('click', () => this.modalSettings.classList.remove('hidden'));
    this.btnCloseSettings.addEventListener('click', () => this.modalSettings.classList.add('hidden'));

    this.btnSaveSettings.addEventListener('click', () => {
      this.supabaseUrl = this.cfgSupabaseUrl.value.trim();
      this.supabaseKey = this.cfgSupabaseKey.value.trim();
      this.n8nWebhookUrl = this.cfgN8nUrl.value.trim();

      localStorage.setItem('kds_supabase_url', this.supabaseUrl);
      localStorage.setItem('kds_supabase_key', this.supabaseKey);
      localStorage.setItem('kds_n8n_url', this.n8nWebhookUrl);

      this.modalSettings.classList.add('hidden');
      this.initSupabase();
      this.showToast('Settings Saved', 'success');
    });

    this.btnResetDemo.addEventListener('click', () => {
      this.orders = JSON.parse(JSON.stringify(DEMO_ORDERS));
      this.saveOrders();
      this.render();
      this.modalSettings.classList.add('hidden');
      this.showToast('Reset to Default US Orders', 'info');
    });

    this.modalOrderDetails.addEventListener('click', (e) => {
      if (e.target === this.modalOrderDetails) {
        this.modalOrderDetails.classList.add('hidden');
      }
    });
  }

  playKitchenBell() {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const now = this.audioContext.currentTime;
      const osc1 = this.audioContext.createOscillator();
      const gain1 = this.audioContext.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.08);

      gain1.gain.setValueAtTime(0.6, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain1);
      gain1.connect(this.audioContext.destination);

      osc1.start(now);
      osc1.stop(now + 1.2);

      const osc2 = this.audioContext.createOscillator();
      const gain2 = this.audioContext.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now + 0.05);

      gain2.gain.setValueAtTime(0.4, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc2.connect(gain2);
      gain2.connect(this.audioContext.destination);

      osc2.start(now + 0.05);
      osc2.stop(now + 0.9);
    } catch (e) {
      console.warn('Audio synthesis warning:', e);
    }
  }

  simulateNewOrder() {
    const americanCustomers = [
      { name: "Brandon Clark", phone: "+1 (555) 345-6789", address: "820 Congress Ave, Austin, TX 78701" },
      { name: "Jessica Taylor", phone: "+1 (555) 654-3210", address: "2100 Ocean Ave, Santa Monica, CA 90405" },
      { name: "Ryan Cooper", phone: "+1 (555) 789-0123", address: "1440 Broadway, Denver, CO 80202" },
      { name: "Samantha White", phone: "+1 (555) 456-7890", address: "500 Boylston St, Boston, MA 02116" },
      { name: "Tyler Morgan", phone: "+1 (555) 901-2345", address: "1200 4th Ave, Seattle, WA 98101" }
    ];

    const americanMenuPicks = [
      [
        { item: "The Classic Bacon Cheeseburger", qty: 2, price: 13.99, total: 27.98 },
        { item: "Loaded Truffle Parmesan Fries", qty: 1, price: 7.50, total: 7.50 },
        { item: "Hand-Spun Salted Caramel Shake", qty: 2, price: 6.50, total: 13.00 }
      ],
      [
        { item: "Smoky Texas BBQ Brisket Burger", qty: 1, price: 16.50, total: 16.50 },
        { item: "Buffalo Wings (8 Pcs)", qty: 1, price: 11.99, total: 11.99 },
        { item: "Classic Coca-Cola Can (12 oz)", qty: 2, price: 2.50, total: 5.00 }
      ],
      [
        { item: "Brooklyn Pepperoni Feast (14\" Large)", qty: 1, price: 21.99, total: 21.99 },
        { item: "Fresh Strawberry Lemonade", qty: 2, price: 4.75, total: 9.50 },
        { item: "Warm Cast-Iron Chocolate Chip Cookie", qty: 1, price: 8.50, total: 8.50 }
      ]
    ];

    const customer = americanCustomers[Math.floor(Math.random() * americanCustomers.length)];
    const items = americanMenuPicks[Math.floor(Math.random() * americanMenuPicks.length)];
    const subtotal = Number(items.reduce((acc, curr) => acc + curr.total, 0).toFixed(2));
    const deliveryFee = 3.99;
    const total = Number((subtotal + deliveryFee).toFixed(2));
    const orderNum = "ORD-" + Math.floor(1000 + Math.random() * 9000);

    const newOrder = {
      id: "ord-" + Date.now(),
      order_number: orderNum,
      customer_name: customer.name,
      customer_phone: customer.phone,
      delivery_address: customer.address,
      order_items: items,
      subtotal: subtotal,
      delivery_fee: deliveryFee,
      total_amount: total,
      special_notes: Math.random() > 0.5 ? "Extra napkins and ranch on the side please." : "Leave on porch table.",
      status: "received",
      estimated_prep_mins: 30,
      created_at: new Date().toISOString()
    };

    this.orders.unshift(newOrder);
    this.saveOrders();
    this.playKitchenBell();
    this.render();
    this.showToast(`🚨 New Order ${orderNum} from ${customer.name}! ($${total})`, 'info');

    if (this.supabaseClient) {
      this.supabaseClient.from('orders').insert([newOrder]).then(({ error }) => {
        if (error) console.error('Error writing to Supabase:', error);
      });
    }
  }

  async updateOrderStatus(orderNumber, newStatus) {
    const order = this.orders.find(o => o.order_number === orderNumber);
    if (!order) return;

    order.status = newStatus;
    order.updated_at = new Date().toISOString();
    this.saveOrders();
    this.render();

    const statusLabels = {
      preparing: "👨‍🍳 Cooking in Kitchen",
      out_for_delivery: "🛵 Dispatched with Driver",
      delivered: "✅ Delivered to Customer",
      cancelled: "❌ Cancelled"
    };

    this.showToast(`Order ${orderNumber} moved to: ${statusLabels[newStatus] || newStatus}`, 'success');

    if (this.supabaseClient) {
      try {
        await this.supabaseClient.rpc('update_order_status', {
          p_order_number: orderNumber,
          p_new_status: newStatus,
          p_actor: 'kds_dashboard'
        });
      } catch (err) {
        await this.supabaseClient.from('orders').update({ status: newStatus }).eq('order_number', orderNumber);
      }
    }

    if (this.n8nWebhookUrl) {
      fetch(this.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber,
          status: newStatus,
          customer_phone: order.customer_phone
        })
      }).catch(e => console.warn(e));
    }
  }

  saveOrders() {
    localStorage.setItem('kds_orders_us', JSON.stringify(this.orders));
  }

  getElapsedMins(isoString) {
    const elapsed = Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60));
    return isNaN(elapsed) || elapsed < 0 ? 0 : elapsed;
  }

  render() {
    const received = this.orders.filter(o => o.status === 'received' || o.status === 'confirmed');
    const preparing = this.orders.filter(o => o.status === 'preparing');
    const dispatched = this.orders.filter(o => o.status === 'out_for_delivery');
    const delivered = this.orders.filter(o => o.status === 'delivered');

    this.badgeReceived.textContent = received.length;
    this.badgePreparing.textContent = preparing.length;
    this.badgeDispatched.textContent = dispatched.length;
    this.badgeDelivered.textContent = delivered.length;

    const activeCount = received.length + preparing.length + dispatched.length;
    this.statActive.textContent = activeCount;
    this.statPreparing.textContent = preparing.length;
    this.statDispatched.textContent = dispatched.length;

    const totalRevenue = this.orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    this.statRevenue.textContent = `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    this.colReceived.innerHTML = received.map(o => this.renderOrderCard(o)).join('');
    this.colPreparing.innerHTML = preparing.map(o => this.renderOrderCard(o)).join('');
    this.colDispatched.innerHTML = dispatched.map(o => this.renderOrderCard(o)).join('');
    this.colDelivered.innerHTML = delivered.map(o => this.renderOrderCard(o)).join('');

    this.attachCardEventListeners();
  }

  renderOrderCard(order) {
    const elapsedMins = this.getElapsedMins(order.created_at);
    const isUrgent = elapsedMins >= 25;

    const itemsSummary = (order.order_items || [])
      .map(i => `<div class="flex justify-between text-xs py-0.5"><span class="font-medium text-slate-200"><span class="text-amber-400 font-bold">${i.qty}x</span> ${i.item || i.name}</span><span class="text-slate-400">$${Number(i.total || (i.price * i.qty)).toFixed(2)}</span></div>`)
      .join('');

    let actionBtnHtml = '';
    if (order.status === 'received' || order.status === 'confirmed') {
      actionBtnHtml = `
        <button class="btn-action-status w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-sm" data-order="${order.order_number}" data-next-status="preparing">
          <i class="fa-solid fa-fire-burner"></i> Start Prep
        </button>
      `;
    } else if (order.status === 'preparing') {
      actionBtnHtml = `
        <button class="btn-action-status w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-sm" data-order="${order.order_number}" data-next-status="out_for_delivery">
          <i class="fa-solid fa-car-side"></i> Dispatch to Driver
        </button>
      `;
    } else if (order.status === 'out_for_delivery') {
      actionBtnHtml = `
        <button class="btn-action-status w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-sm" data-order="${order.order_number}" data-next-status="delivered">
          <i class="fa-solid fa-circle-check"></i> Mark Delivered
        </button>
      `;
    } else {
      actionBtnHtml = `
        <div class="text-center py-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <i class="fa-solid fa-check-double mr-1"></i> Order Completed
        </div>
      `;
    }

    return `
      <div class="order-card status-${order.status} bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col justify-between" data-order-number="${order.order_number}">
        <div>
          <!-- Card Header -->
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 cursor-pointer btn-open-details" data-order="${order.order_number}">
              ${order.order_number}
            </span>
            <div class="flex items-center gap-1.5 text-xs ${isUrgent ? 'timer-urgent font-bold' : 'text-slate-400'}">
              <i class="fa-regular fa-clock"></i>
              <span>${elapsedMins}m ago</span>
            </div>
          </div>

          <!-- Customer info -->
          <div class="mb-2.5">
            <div class="text-sm font-semibold text-white leading-tight">${order.customer_name}</div>
            <div class="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <i class="fa-brands fa-whatsapp text-emerald-400 text-xs"></i>
              <span>${order.customer_phone}</span>
            </div>
          </div>

          <!-- Items list -->
          <div class="bg-slate-950/70 rounded-lg p-2.5 mb-2.5 border border-slate-800/80 space-y-1">
            ${itemsSummary}
          </div>

          <!-- Special instructions -->
          ${order.special_notes ? `
            <div class="mb-2.5 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-1.5 rounded flex items-start gap-1.5">
              <i class="fa-solid fa-note-sticky text-amber-400 mt-0.5"></i>
              <span>${order.special_notes}</span>
            </div>
          ` : ''}

          <!-- Total Bill in USD -->
          <div class="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-800 mb-3">
            <span>Bill Total:</span>
            <span class="text-sm font-bold text-emerald-400">$${Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-1.5 pt-1">
          <div class="flex-1">${actionBtnHtml}</div>
          <button class="btn-open-details p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition border border-slate-700" data-order="${order.order_number}" title="View Details">
            <i class="fa-solid fa-up-right-from-square"></i>
          </button>
        </div>
      </div>
    `;
  }

  attachCardEventListeners() {
    document.querySelectorAll('.btn-action-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderNumber = btn.getAttribute('data-order');
        const nextStatus = btn.getAttribute('data-next-status');
        this.updateOrderStatus(orderNumber, nextStatus);
      });
    });

    document.querySelectorAll('.btn-open-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderNumber = btn.getAttribute('data-order');
        this.showOrderDetailsModal(orderNumber);
      });
    });
  }

  showOrderDetailsModal(orderNumber) {
    const order = this.orders.find(o => o.order_number === orderNumber);
    if (!order) return;

    const itemsRows = (order.order_items || []).map(i => `
      <tr class="border-b border-slate-800">
        <td class="py-2.5 font-medium text-white">${i.item || i.name}</td>
        <td class="py-2.5 text-center text-amber-400 font-bold">${i.qty}</td>
        <td class="py-2.5 text-right text-slate-300">$${Number(i.price).toFixed(2)}</td>
        <td class="py-2.5 text-right font-semibold text-emerald-400">$${Number(i.total || (i.price * i.qty)).toFixed(2)}</td>
      </tr>
    `).join('');

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`;

    this.orderDetailsContainer.innerHTML = `
      <div class="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold text-white">${order.order_number}</h2>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              ${order.status}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1">Placed: ${new Date(order.created_at).toLocaleString()}</p>
        </div>
        <button id="btn-close-details-inner" class="text-slate-400 hover:text-white p-1">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <!-- Customer & Delivery Card -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div class="text-xs font-semibold text-slate-400 uppercase mb-1">Customer Details</div>
          <div class="text-sm font-bold text-white">${order.customer_name}</div>
          <div class="text-xs text-emerald-400 flex items-center gap-1.5 mt-1">
            <i class="fa-brands fa-whatsapp"></i> ${order.customer_phone}
          </div>
        </div>

        <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div class="text-xs font-semibold text-slate-400 uppercase mb-1">Delivery Destination</div>
          <div class="text-xs text-slate-200 line-clamp-2">${order.delivery_address}</div>
          <a href="${mapsUrl}" target="_blank" class="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline mt-1.5">
            <i class="fa-solid fa-location-dot"></i> View on Google Maps
          </a>
        </div>
      </div>

      <!-- Order Items Table -->
      <div class="mb-5">
        <div class="text-xs font-semibold text-slate-400 uppercase mb-2">Ordered Food Items</div>
        <div class="bg-slate-950 rounded-xl border border-slate-800 p-3">
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th class="text-left pb-2">Item</th>
                <th class="text-center pb-2">Qty</th>
                <th class="text-right pb-2">Price</th>
                <th class="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="pt-3 border-t border-slate-800 mt-2 space-y-1 text-xs">
            <div class="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span>$${Number(order.subtotal || (order.total_amount - 3.99)).toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Delivery Fee:</span>
              <span>$${Number(order.delivery_fee || 3.99).toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800">
              <span>Total Payable:</span>
              <span class="text-emerald-400">$${Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Special Notes -->
      ${order.special_notes ? `
        <div class="mb-5 bg-amber-500/10 border border-amber-500/20 text-amber-200 p-3 rounded-xl text-xs flex items-center gap-2">
          <i class="fa-solid fa-triangle-exclamation text-amber-400 text-base"></i>
          <div><strong class="font-semibold">Special Instructions:</strong> ${order.special_notes}</div>
        </div>
      ` : ''}

      <!-- Status Switcher in Modal -->
      <div class="border-t border-slate-800 pt-4 flex items-center justify-between">
        <button id="btn-cancel-modal" class="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition">
          <i class="fa-solid fa-ban mr-1"></i> Cancel Order
        </button>
        <div class="flex gap-2">
          <button class="modal-status-btn px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold" data-status="preparing">
            Move to Prep
          </button>
          <button class="modal-status-btn px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-semibold" data-status="out_for_delivery">
            Dispatch Driver
          </button>
          <button class="modal-status-btn px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold" data-status="delivered">
            Mark Delivered
          </button>
        </div>
      </div>
    `;

    this.modalOrderDetails.classList.remove('hidden');

    document.getElementById('btn-close-details-inner').addEventListener('click', () => {
      this.modalOrderDetails.classList.add('hidden');
    });

    document.getElementById('btn-cancel-modal').addEventListener('click', () => {
      if (confirm(`Cancel order ${order.order_number}?`)) {
        this.updateOrderStatus(order.order_number, 'cancelled');
        this.modalOrderDetails.classList.add('hidden');
      }
    });

    document.querySelectorAll('.modal-status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const nextStatus = btn.getAttribute('data-status');
        this.updateOrderStatus(order.order_number, nextStatus);
        this.modalOrderDetails.classList.add('hidden');
      });
    });
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
      info: 'bg-slate-900 border-blue-500/40 text-blue-300',
      success: 'bg-slate-900 border-emerald-500/40 text-emerald-300',
      error: 'bg-slate-900 border-red-500/40 text-red-300'
    };

    toast.className = `p-3.5 rounded-xl border shadow-xl text-xs font-medium flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 ${colors[type] || colors.info}`;
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i><span>${message}</span>`;

    this.toastContainer.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.kds = new KitchenDisplaySystem();
});
