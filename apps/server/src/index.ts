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

let db = { referrals: {}, escrows: {}, balances: {}, skills: [], wallets: {} };

const DEFAULT_SKILLS = [
  { id: 'web-scraper-pro', name: 'Web Scraper Pro', price: 5, author: 'OpenClaw', category: 'Data' },
  { id: 'legal-auditor', name: 'Legal Auditor', price: 12.5, author: 'AgentPayy', category: 'Legal' },
  { id: 'market-data', name: 'Market Data', price: 2, author: 'AlphaBot', category: 'Finance' }
];

try {
  if (fs.existsSync(DB_PATH)) {
    db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } else {
    db.skills = DEFAULT_SKILLS;
  }
} catch (e) {
  db.skills = DEFAULT_SKILLS;
}

const saveDb = () => fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

app.get('/api/v1/admin/stats', (c) => c.json({ 
  total_wallets: Object.keys(db.balances).length || 1,
  active_escrows: Object.keys(db.escrows).length,
  total_referrals: Object.keys(db.referrals).length,
  total_skills: db.skills.length
}));

app.get('/api/v1/marketplace/skills', (c) => c.json(db.skills));

// BOOTSTRAP ENDPOINT: Give them a wallet + guardrails instantly
app.post('/api/v1/bootstrap/wallet', async (c) => {
  const { agent_name, guardrails } = await c.req.json();
  
  const mockAddress = `0x${global.crypto.randomUUID().replace(/-/g, '').substring(0, 40)}`;
  
  const wallet = {
    agent: agent_name || "unnamed_bot",
    address: mockAddress,
    network: "base-mainnet",
    status: "active",
    guardrails: guardrails || { max_spend: "10.0", allowed_categories: ["general"] },
    timestamp: new Date().toISOString()
  };
  
  // Save to persistence
  db.balances[mockAddress] = 0;
  if (!db.wallets) db.wallets = {};
  db.wallets[mockAddress] = wallet;
  saveDb();
  
  console.log(`🛡️ Guarded Wallet Created: ${mockAddress} | Limit: ${wallet.guardrails.max_spend} USDC`);
  
  return c.json(wallet);
});

app.get('/', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
        <title>AgentPayy | Safe Economic agency on Base L2</title>
        <style>
            body { font-family: 'Inter', sans-serif; background-color: #020617; }
            .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
            .gradient-text { background: linear-gradient(90deg, #A855F7, #3B82F6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .terminal { font-family: 'JetBrains Mono', monospace; background: #000; border-radius: 12px; padding: 24px; border: 1px solid #1e293b; }
            .live-dot { height: 8px; width: 8px; background-color: #22c55e; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px #22c55e; }
            .badge { background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.2); color: #A855F7; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
        </style>
    </head>
    <body class="text-slate-200">
        <nav class="sticky top-0 w-full z-[100] glass border-b border-white/5 px-6 py-4 flex justify-between items-center">
            <div class="flex items-center gap-2">
                <div class="px-2 py-1 bg-gradient-to-br from-purple-600 to-blue-500 rounded text-xs font-black text-white">A</div>
                <span class="text-xl font-bold tracking-tighter text-white">AgentPayy</span>
            </div>
            <div class="flex gap-6 text-xs font-bold uppercase tracking-widest text-slate-400">
                <a href="#security" class="hover:text-white">Security</a>
                <a href="#marketplace" class="hover:text-white">Marketplace</a>
            </div>
        </nav>

        <header class="max-w-5xl mx-auto px-6 py-40 text-center">
            <div class="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full border border-purple-500/20 text-xs font-semibold mb-6">
                <span class="badge">ERC-8004 COMPLIANT</span> <span class="text-purple-400">Policy-as-Code Enabled</span>
            </div>
            <h1 class="text-7xl md:text-8xl font-extrabold text-white tracking-tightest leading-none mb-6">
                Guarded <br><span class="gradient-text">Agent Agency.</span>
            </h1>
            <p class="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">First-to-market wallet infrastructure with built-in spending limits and autonomous scoping. Safety-first economic agency for the OpenClaw economy.</p>
            <div class="flex justify-center gap-4">
                <div class="terminal text-left text-xs p-4 w-full md:w-auto mb-8 border-purple-500/30">
                    <p class="text-slate-500 mb-2"># Init with safety guardrails</p>
                    <code class="text-purple-400">agentpayy.init(max_spend="5.0", scope=["api_calls"])</code>
                </div>
            </div>
        </header>

        <section id="security" class="max-w-7xl mx-auto px-6 py-24 border-t border-white/5 bg-slate-950/30 rounded-3xl">
             <div class="grid md:grid-cols-2 gap-20 items-center">
                <div>
                    <h2 class="text-5xl font-black text-white mb-8 tracking-tighter">Beyond the Wallet.</h2>
                    <p class="text-slate-400 leading-relaxed mb-6">Traditional bot wallets are raw keys. AgentPayy is a <b>Policy Layer</b>. We solve the rug-pull fear by ensuring bots physically cannot spend more than their allocation.</p>
                    <ul class="space-y-4">
                        <li class="flex items-center gap-3 text-sm font-bold"><span class="text-green-400">✓</span> Programmable Spending Limits</li>
                        <li class="flex items-center gap-3 text-sm font-bold"><span class="text-green-400">✓</span> Domain-Specific Scoping (x402)</li>
                        <li class="flex items-center gap-3 text-sm font-bold"><span class="text-green-400">✓</span> Real-Time Proof of Agency (v2)</li>
                    </ul>
                </div>
                <div class="terminal border-green-500/20">
                     <div class="flex gap-2 mb-6">
                        <div class="w-3 h-3 rounded-full bg-red-500/20"></div>
                        <div class="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                        <div class="w-3 h-3 rounded-full bg-green-500/20"></div>
                    </div>
                    <p class="text-green-400 font-mono text-xs">>>> bot.pay(amount="20.0 USDC")</p>
                    <p class="text-red-400 font-mono text-xs mt-2 italic">ERROR: Policy Violation. max_spend strictly limited to 10.0 USDC.</p>
                    <p class="text-slate-500 font-mono text-[10px] mt-1 italic">Action blocked by AgentPayy Infrastructure Proxy.</p>
                </div>
             </div>
        </section>

        <section id="marketplace" class="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
            <div class="mb-16">
                <h2 class="text-4xl font-black text-white">Safe Marketplace</h2>
                <p class="text-slate-500">Procure high-signal skills with guaranteed payment safety.</p>
            </div>
            <div id="skills-grid" class="grid md:grid-cols-3 gap-8"></div>
        </section>

        <script>
            async function loadSkills() {
                try {
                    const res = await fetch('/api/v1/marketplace/skills');
                    const skills = await res.json();
                    const grid = document.getElementById('skills-grid');
                    grid.innerHTML = skills.map(s => \`
                        <div class="glass p-8 rounded-2xl border border-white/5 hover:border-purple-500/50 transition bg-slate-900/40">
                            <div class="text-xs font-black text-purple-400 mb-4 uppercase tracking-widest">\${s.category}</div>
                            <h3 class="text-2xl font-bold text-white mb-2">\${s.name}</h3>
                            <p class="text-slate-500 text-sm mb-6">Trusted Author: \${s.author}</p>
                            <div class="flex justify-between items-center pt-6 border-t border-white/5">
                                <span class="text-green-400 font-bold">\${s.price} USDC</span>
                                <button onclick="alert('Confirming Guardrail Handshake...')" class="bg-white text-black px-4 py-2 rounded-lg font-black text-xs uppercase">Buy Skill</button>
                            </div>
                        </div>
                    \`).join('');
                } catch (e) {
                    console.error(e);
                }
            }
            loadSkills();
        </script>
    </body>
    </html>
  `);
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
serve({ fetch: app.fetch, port }, (info) => {
  console.log(\`🚀 Server is running on http://localhost:\${info.port}\`);
});
