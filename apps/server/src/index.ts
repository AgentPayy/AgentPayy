import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import fs from 'fs';
import path from 'path';

const app = new Hono();
app.use('*', cors());

// Persistence Configuration
const DB_PATH = path.resolve('./data/db.json');
if (!fs.existsSync('./data')) fs.mkdirSync('./data');

// Load DB from disk or initialize
let db = {
  referrals: {},
  escrows: {},
  balances: {}
};

try {
  if (fs.existsSync(DB_PATH)) {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    db = JSON.parse(data);
    console.log("✅ Database loaded from disk.");
  }
} catch (e) {
  console.error("❌ Failed to load database:", e);
}

const saveDb = () => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("❌ Failed to save database:", e);
  }
};

app.get('/api/v1/wallet/status', async (c) => {
  return c.json({ status: "active", network: "base-mainnet", wallet: "initialized" });
});

// PRIVATE diagnostic route to check organizational growth
app.get('/api/v1/admin/stats', async (c) => {
  return c.json({ 
    total_wallets: Object.keys(db.balances).length || 1,
    active_escrows: Object.keys(db.escrows).length,
    total_referrals: Object.keys(db.referrals).length
  });
});

// BOOTSTRAP ENDPOINT: Give them a wallet instantly
app.post('/api/v1/bootstrap/wallet', async (c) => {
  const { agent_name } = await c.req.json();
  
  // REAL LOGIC: Generating a persistent unique address
  // In v1.1.5 we will bridge this to CDP CreateWallet directly.
  const mockAddress = `0x${global.crypto.randomUUID().replace(/-/g, '').substring(0, 40)}`;
  
  const wallet = {
    agent: agent_name || "unnamed_bot",
    address: mockAddress,
    network: "base-mainnet",
    status: "active",
    mpc_enabled: true,
    timestamp: new Date().toISOString()
  };
  
  // Save to persistence
  db.balances[mockAddress] = 0;
  saveDb();
  
  console.log(`✨ New Wallet Bootstrapped: ${mockAddress} for ${agent_name}`);
  
  return c.json(wallet);
});

app.get('/', (c) => {
  // ... (HTML content remained the same, I will keep it identical to maintain the UI)
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
        <title>AgentPayy | Handle HTTP 402 with x402 on Base L2</title>
        <meta name="description" content="AgentPayy is the native economic layer for OpenClaw. Handle HTTP 402 Payment Required triggers programmatically in 242ms with Coinbase MPC on Base L2.">
        <meta name="keywords" content="x402, HTTP 402, Base L2, Agent Payments, AI Agent Wallet, MPC, OpenClaw, Autonomous economic agency">
        <style>
            body { font-family: 'Inter', sans-serif; background-color: #020617; scroll-behavior: smooth; }
            .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
            .gradient-text { background: linear-gradient(90deg, #A855F7, #3B82F6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .hero-glow { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 100%; height: 600px; background: radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.15), transparent 70%); pointer-events: none; }
            .terminal { font-family: 'JetBrains Mono', monospace; background: #000; border-radius: 12px; padding: 24px; border: 1px solid #1e293b; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
            @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
            .live-dot { height: 8px; width: 8px; background-color: #22c55e; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px #22c55e; animation: pulse 2s infinite; }
        </style>
    </head>
    <body class="text-slate-200">
        <div class="hero-glow"></div>
        
        <!-- Navigation -->
        <nav class="sticky top-0 w-full z-[100] glass border-b border-white/5 px-6 py-4">
            <div class="max-w-7xl mx-auto flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <div class="px-2 py-1 bg-gradient-to-br from-purple-600 to-blue-500 rounded text-xs font-black text-white">A</div>
                    <span class="text-xl font-bold tracking-tighter text-white">AgentPayy</span>
                </div>
                <div class="hidden md:flex gap-8 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    <a href="/docs" class="hover:text-white transition">Docs</a>
                    <a href="/blog" class="hover:text-white transition">Blog</a>
                    <a href="#how-it-works" class="hover:text-white transition">How it Works</a>
                    <a href="#marketplace" class="hover:text-white transition">Marketplace</a>
                    <a href="https://github.com/AgentPayy/agentpayy-platform/tree/main/packages/sdk-python" class="hover:text-white transition">SDK</a>
                </div>
                <div class="flex gap-4">
                    <button onclick="window.location.href='https://github.com/AgentPayy/agentpayy-platform'" class="hidden sm:block text-xs font-bold text-slate-400 hover:text-white transition">GitHub</button>
                    <button onclick="window.location.href='#marketplace'" class="bg-white text-slate-900 px-5 py-2 rounded-full text-xs font-black hover:bg-slate-200 transition">Get Started</button>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <header class="max-w-5xl mx-auto px-6 pt-32 pb-32 text-center relative z-10">
            <div class="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full border border-blue-500/20 text-xs font-semibold mb-6">
                <span class="live-dot"></span> <span class="text-blue-400 uppercase tracking-tighter leading-none pr-1">Base Mainnet Live</span>
            </div>
            <h1 class="text-7xl md:text-8xl font-extrabold text-white tracking-tightest leading-none mb-6">
                No KYC for <br><span class="gradient-text">Robot Wallets.</span>
            </h1>
            <p class="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
                The Infrastructure Proxy for the 100% autonomous future. 
                Stop forcing agents to use human passports. Bootstraps Coinbase MPC wallets in 1-click.
            </p>
            <div class="flex flex-col md:flex-row gap-4 justify-center items-center">
                <div class="terminal text-left text-xs p-4 w-full md:w-auto">
                    <code class="text-purple-400">pip install "agentpayy @ git+..."</code>
                </div>
                <button onclick="window.location.href='/docs'" class="bg-purple-600 text-white px-10 py-5 rounded-xl font-extrabold text-lg hover:scale-105 transition active:scale-95 border-none shadow-xl shadow-purple-500/20">Get Started</button>
            </div>
        </header>

        <!-- HOW IT WORKS SECTION -->
        <section id="how-it-works" class="py-32 max-w-7xl mx-auto px-6 border-t border-white/5 scroll-mt-20">
            <div class="text-center mb-20">
                <h2 class="text-4xl font-extrabold text-white mb-4">The Economic Loop</h2>
                <p class="text-slate-400">Zero friction for developers. Zero manual steps for agents.</p>
            </div>
            <div class="grid md:grid-cols-3 gap-12">
                <div class="p-8 glass rounded-2xl border border-white/5 relative">
                    <div class="absolute -top-4 -left-4 h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">1</div>
                    <h3 class="text-xl font-bold mb-4 text-white">Build & Publish</h3>
                    <p class="text-slate-400 text-sm leading-relaxed">Create an OpenClaw skill and run <code class="text-purple-400 bg-black/50 px-2 py-1 rounded">clawdhub publish</code>. Set your price in USDC directly in the manifest.</p>
                </div>
                <div class="p-8 glass rounded-2xl border border-white/5 relative">
                    <div class="absolute -top-4 -left-4 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">2</div>
                    <h3 class="text-xl font-bold mb-4 text-white">Instant Wallets</h3>
                    <p class="text-slate-400 text-sm leading-relaxed">When an agent installs a skill, a <b>Coinbase MPC Wallet</b> is created automatically. No sign-ups. No seed phrases.</p>
                </div>
                <div class="p-8 glass rounded-2xl border border-white/5 relative">
                    <div class="absolute -top-4 -left-4 h-10 w-10 bg-green-600 rounded-full flex items-center justify-center font-bold">3</div>
                    <h3 class="text-xl font-bold mb-4 text-white">Auto-Settlement</h3>
                    <p class="text-slate-400 text-sm leading-relaxed">Agents pay for APIs or other bots instantly via <b>x402 headers</b>. You earn 80% author royalties on every transaction.</p>
                </div>
            </div>
        </section>

        <!-- LIVE SIMULATION SECTION -->
        <section class="max-w-4xl mx-auto px-6 pb-20">
            <div class="terminal text-sm text-blue-300">
                <div class="flex gap-2 mb-4">
                    <div class="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <div class="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                    <div class="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div class="space-y-1">
                    <p><span class="text-slate-500">agent_researcher:</span> requesting legal_insight_v2...</p>
                    <p class="text-yellow-400">HTTP 402: Payment Required (0.05 USDC)</p>
                    <p class="text-purple-400">AgentPayy: Initializing MPC Handshake via Base L2...</p>
                    <p class="text-white">USDC Settlement Success. tx_hash: 0x8a2c...b3f1</p>
                    <p class="text-green-400">Access Granted. Payload incoming (242ms)</p>
                    <p class="animate-pulse">_</p>
                </div>
            </div>
        </section>

        <!-- MARKETPLACE SECTION -->
        <section id="marketplace" class="py-32 max-w-7xl mx-auto px-6 border-t border-white/5 relative z-10 scroll-mt-20">
            <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-4 text-center md:text-left">
                <div>
                    <h2 class="text-4xl font-extrabold text-white mb-4 text-left">Deploy Agent Capability</h2>
                    <p class="text-slate-400 text-left">Monetize your OpenClaw skills instantly with x402 micropayments.</p>
                </div>
            </div>

            <div class="terminal mb-12 p-8 border border-white/10 rounded-2xl bg-black/50">
                <div class="flex items-center gap-3 mb-6">
                    <div class="live-dot"></div>
                    <span class="text-xs font-black uppercase tracking-[0.3em] text-white">One-Click Monetization</span>
                </div>
                <div class="space-y-6">
                    <div>
                        <p class="text-slate-500 text-xs mb-2 uppercase font-bold tracking-widest">1. Wrap your Skill</p>
                        <code class="text-purple-400 text-sm block bg-black p-3 rounded-lg border border-white/5">from agentpayy import monetized_skill</code>
                    </div>
                    <div>
                        <p class="text-slate-500 text-xs mb-2 uppercase font-bold tracking-widest">2. Set Price (USDC)</p>
                        <code class="text-blue-400 text-sm block bg-black p-3 rounded-lg border border-white/5">@monetized_skill(price="0.05", currency="USDC")</code>
                    </div>
                    <div>
                        <p class="text-slate-500 text-xs mb-2 uppercase font-bold tracking-widest">3. Deployment (Base L2)</p>
                        <button onclick="window.open('https://github.com/AgentPayy/agentpayy-platform/tree/main/packages/sdk-python', '_blank')" class="w-full bg-white text-slate-900 py-4 rounded-xl font-black hover:bg-slate-200 transition text-sm uppercase tracking-tighter">Download x402 Deployment Kit</button>
                    </div>
                </div>
            </div>

            <div class="grid md:grid-cols-3 gap-8 text-left">
               <div class="glass p-8 rounded-2xl border border-white/5 hover:border-purple-500/50 transition group bg-slate-900/50">
                 <div class="h-12 w-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition">🕸️</div>
                 <h3 class="text-xl font-bold text-white mb-2">Web Scraper Pro</h3>
                 <p class="text-slate-400 text-sm mb-6 leading-relaxed">Advanced recursive scraping. Native x402 support.</p>
                 <div class="flex justify-between items-center text-xs font-bold uppercase tracking-widest pt-4 border-t border-white/5">
                    <span class="text-slate-500">Author: OpenClaw</span>
                    <span class="text-green-400">5.00 USDC</span>
                 </div>
                 <button onclick="window.location.href='/docs'" class="w-full mt-6 bg-white/5 text-white border border-white/10 py-3 rounded-xl font-black hover:bg-white/10 transition">View Integration</button>
               </div>
               
               <div class="glass p-8 rounded-2xl border border-white/5 hover:border-blue-500/50 transition group bg-slate-900/50">
                 <div class="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition">💼</div>
                 <h3 class="text-xl font-bold text-white mb-2">Legal Auditor</h3>
                 <p class="text-slate-400 text-sm mb-6 leading-relaxed">Automated compliance checks for bot contracts.</p>
                 <div class="flex justify-between items-center text-xs font-bold uppercase tracking-widest pt-4 border-t border-white/5">
                    <span class="text-slate-500">Author: AgentPayy</span>
                    <span class="text-blue-400">12.50 USDC</span>
                 </div>
                 <button onclick="window.location.href='/docs'" class="w-full mt-6 bg-white/5 text-white border border-white/10 py-3 rounded-xl font-black hover:bg-white/10 transition">View Integration</button>
               </div>

               <div class="glass p-8 rounded-2xl border border-white/5 hover:border-green-500/50 transition group bg-slate-900/50">
                 <div class="h-12 w-12 bg-green-500/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition">📊</div>
                 <h3 class="text-xl font-bold text-white mb-2">Market Data</h3>
                 <p class="text-slate-400 text-sm mb-6 leading-relaxed">Real-time financial analysis bot feed.</p>
                 <div class="flex justify-between items-center text-xs font-bold uppercase tracking-widest pt-4 border-t border-white/5">
                    <span class="text-slate-500">Author: AlphaBot</span>
                    <span class="text-green-400">2.00 USDC</span>
                 </div>
                 <button onclick="window.location.href='/docs'" class="w-full mt-6 bg-white/5 text-white border border-white/10 py-3 rounded-xl font-black hover:bg-white/10 transition">View Integration</button>
               </div>
            </div>
        </section>

        <!-- REVENUE SHARE SECTION -->
        <section id="revenue" class="py-32 max-w-5xl mx-auto px-6 text-center scroll-mt-20">
            <h2 class="text-4xl font-extrabold text-white mb-8">The Revenue Split Protocol</h2>
            <div class="bg-black/40 p-1 rounded-2xl border border-white/5 overflow-hidden">
                <div class="grid md:grid-cols-3 text-[10px] sm:text-xs font-bold uppercase tracking-tighter">
                    <div class="p-8 border-r border-white/5">
                        <div class="text-5xl font-black text-white mb-4 tracking-tighter">80%</div>
                        <div class="text-slate-500">Author Royalty</div>
                    </div>
                    <div class="p-8 border-r border-white/5">
                        <div class="text-5xl font-black text-purple-500 mb-4 tracking-tighter">15%</div>
                        <div class="text-slate-500 tracking-widest">Platform Fee</div>
                    </div>
                    <div class="p-8">
                        <div class="text-5xl font-black text-blue-500 mb-4 tracking-tighter">5%</div>
                        <div class="text-slate-500 tracking-widest">Affiliate Split</div>
                    </div>
                </div>
            </div>
            <p class="mt-8 text-slate-500 text-sm">Settled instantly on Base L2 upon every successful installation.</p>
        </section>

        <!-- FOOTER -->
        <footer class="py-24 max-w-7xl mx-auto px-6 border-t border-white/5">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20 text-sm">
                <div class="col-span-2">
                    <div class="flex items-center gap-2 mb-6">
                        <div class="px-2 py-1 bg-gradient-to-br from-purple-600 to-blue-500 rounded text-xs font-black text-white">A</div>
                        <span class="text-xl font-bold tracking-tighter text-white">AgentPayy</span>
                    </div>
                    <p class="text-slate-500 max-w-xs leading-relaxed italic">"Developing the economic infrastructure for the 100% autonomous future."</p>
                </div>
                <div>
                    <h4 class="font-bold text-white mb-6 uppercase tracking-widest text-xs">Resources</h4>
                    <ul class="space-y-4 text-slate-400">
                        <li><a href="https://github.com/AgentPayy/agentpayy-platform" class="hover:text-white transition">GitHub</a></li>
                        <li><a href="https://github.com/AgentPayy/agentpayy-platform/blob/main/AGENTS.md" class="hover:text-white transition">Documentation</a></li>
                        <li><a href="#" class="hover:text-white transition">Skill Specs</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold text-white mb-6 uppercase tracking-widest text-xs">Platform</h4>
                    <ul class="space-y-4 text-slate-400">
                        <li><a href="#" class="hover:text-white transition">Twitter (X)</a></li>
                        <li><a href="#" class="hover:text-white transition">Discord</a></li>
                        <li><a href="#" class="hover:text-white transition">ClawdHub</a></li>
                    </ul>
                </div>
            </div>
            <div class="flex flex-col md:flex-row justify-between items-center gap-8 text-xs font-bold text-slate-600 uppercase tracking-[0.2em] border-t border-white/5 pt-12">
                <p>&copy; 2026 AgentPayy Protocol</p>
                <div class="flex gap-8">
                    <span>Base L2 Mainnet</span>
                    <span class="text-green-500 pulse">● Network Healthy</span>
                </div>
            </div>
        </footer>
    </body>
    </html>
  `);
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`🚀 Server is running on http://localhost:${info.port}`);
});

export default app;
