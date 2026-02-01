import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers'; // Works for generic Hono

const app = new Hono();
app.use('*', cors());

// UI: Zero-build Marketplace (Served directly via Hono JSX)
app.get('/', (c) => {
  return c.html(`
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <title>AgentPayy - The OpenClaw Native Payment Layer</title>
    </head>
    <body class="bg-slate-900 text-white font-sans">
      <div class="h-[70vh] flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-800">
        <div class="text-center">
          <h1 class="text-6xl font-extrabold mb-4">AgentPayy 🦞💰</h1>
          <p class="text-xl text-blue-100">The first-principles capability store for OpenClaw agents.</p>
          <div class="mt-8 flex gap-4 justify-center">
            <button class="bg-white text-purple-700 px-8 py-3 rounded-full font-bold">Browse Skills</button>
            <button class="border-2 border-white px-8 py-3 rounded-full font-bold">Login with Coinbase</button>
          </div>
        </div>
      </div>
      <section id="marketplace" class="py-20 max-w-6xl mx-auto px-4">
        <h2 class="text-3xl font-bold mb-10">Live Skills</h2>
        <div class="grid md:grid-cols-3 gap-8">
           <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
             <div class="text-sm text-purple-400 mb-2 uppercase tracking-widest">Data Layer</div>
             <h3 class="text-xl font-bold mb-2">Web Scraper Pro</h3>
             <p class="text-slate-400 mb-4">Recursive scraping for agents. Bypasses CAPTCHA on Base.</p>
             <button class="w-full bg-purple-600 py-3 rounded-lg font-bold">5 USDC / Install</button>
           </div>
           <!-- More cards here -->
        </div>
      </section>
    </body>
    </html>
  `);
});

// API: Multi-level Referral and Escrow Logic
const db = {
  referrals: new Map(), // userId -> referrerId
  escrows: new Map(),   // taskId -> Task object
  balances: new Map()   // address -> balance
};

// MULTI-LEVEL REFERRALS: Ported from Legacy
app.post('/api/v1/referrals/link', async (c) => {
  const { userId, referrerId, subReferrerId } = await c.req.json();
  db.referrals.set(userId, { parent: referrerId, grandParent: subReferrerId });
  return c.json({ status: 'linked', structure: 'multi-tier active' });
});

// ESCROW: Pay on Completion with 10% Stake
app.post('/api/v1/escrow/create', async (c) => {
  const { payer, worker, amount, timeout } = await c.req.json();
  const taskId = crypto.randomUUID();
  const stakeAmount = amount * 0.10; // 10% Stake Required
  
  const task = {
    id: taskId,
    payer,
    worker,
    amount,
    stake: stakeAmount,
    status: 'locked',
    deadline: Date.now() + (timeout || 3600) * 1000
  };
  
  db.escrows.set(taskId, task);
  return c.json({ status: 'escrow_locked', taskId, stakeRequired: stakeAmount });
});

app.post('/api/v1/escrow/release', async (c) => {
  const { taskId, proof } = await c.req.json();
  const task = db.escrows.get(taskId);
  
  if (!task) return c.json({ error: 'Task not found' }, 404);
  
  // REVENUE SPLIT MATH: 80 / 15 / 5 structure
  const total = task.amount + task.stake;
  const authorShare = task.amount * 0.80;
  const platformShare = task.amount * 0.15;
  const affiliateShare = task.amount * 0.05;
  
  task.status = 'released';
  return c.json({ 
    status: 'success', 
    payout: { 
      worker: authorShare + task.stake, // Worker gets their stake back + 80%
      platform: platformShare,
      affiliate: affiliateShare
    }
  });
});

// x402 Gateway: The core logic
app.get('/api/v1/gate/:skillId', (c) => {
  const skillId = c.req.param('skillId');
  return c.json({
    status: 402,
    message: "Payment Required on Base L2",
    x402: {
        amount: "5.00",
        currency: "USDC",
        recipient: "0xAgentPayyMasterWallet...",
        memo: `Purchase for ${skillId}`
    }
  }, 402);
});

export default app;
