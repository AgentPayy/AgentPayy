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

let db = { referrals: {}, escrows: {}, balances: {}, skills: [] };

// Initialize with some default skills if empty
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

app.post('/api/v1/bootstrap/wallet', async (c) => {
  const { agent_name } = await c.req.json();
  const mockAddress = `0x${global.crypto.randomUUID().replace(/-/g, '').substring(0, 40)}`;
  db.balances[mockAddress] = 0;
  saveDb();
  return c.json({ agent: agent_name, address: mockAddress, network: "base-mainnet" });
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
        <title>AgentPayy | The Economic OS for Agents</title>
        <style>
            body { font-family: 'Inter', sans-serif; background-color: #020617; }
            .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
            .gradient-text { background: linear-gradient(90deg, #A855F7, #3B82F6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .terminal { font-family: 'JetBrains Mono', monospace; background: #000; border-radius: 12px; padding: 24px; border: 1px solid #1e293b; }
            .live-dot { height: 8px; width: 8px; background-color: #22c55e; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px #22c55e; }
        </style>
    </head>
    <body class="text-slate-200">
        <nav class="sticky top-0 w-full z-[100] glass border-b border-white/5 px-6 py-4">
            <div class="max-w-7xl mx-auto flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <div class="px-2 py-1 bg-gradient-to-br from-purple-600 to-blue-500 rounded text-xs font-black text-white">A</div>
                    <span class="text-xl font-bold tracking-tighter text-white">AgentPayy</span>
                </div>
                <div class="flex gap-6 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <a href="/docs" class="hover:text-white">Docs</a>
                    <a href="#marketplace" class="hover:text-white">Marketplace</a>
                </div>
            </div>
        </nav>

        <header class="max-w-5xl mx-auto px-6 py-32 text-center">
            <h1 class="text-7xl font-extrabold text-white tracking-tightest leading-none mb-6">
                Turn Agents Into <br><span class="gradient-text">Economic Actors.</span>
            </h1>
            <p class="text-xl text-slate-400 mb-12">The 1-click Infrastructure Proxy for x402 payments on Base L2.</p>
            <div class="flex justify-center gap-4">
                <button onclick="window.location.href='#marketplace'" class="bg-purple-600 text-white px-10 py-4 rounded-xl font-extrabold">Open Marketplace</button>
            </div>
        </header>

        <section id="marketplace" class="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
            <div class="mb-16">
                <h2 class="text-4xl font-black text-white">Real-Time Marketplace</h2>
                <p class="text-slate-500">Live skills available for autonomous agent procurement.</p>
            </div>

            <div id="skills-grid" class="grid md:grid-cols-3 gap-8">
                <!-- Dynamically loaded -->
                <div class="p-8 glass rounded-2xl animate-pulse bg-white/5 h-64"></div>
                <div class="p-8 glass rounded-2xl animate-pulse bg-white/5 h-64"></div>
                <div class="p-8 glass rounded-2xl animate-pulse bg-white/5 h-64"></div>
            </div>
        </section>

        <script>
            async function loadSkills() {
                try {
                    const res = await fetch('/api/v1/marketplace/skills');
                    const skills = await res.json();
                    const grid = document.getElementById('skills-grid');
                    grid.innerHTML = skills.map(s => \`
                        <div class="glass p-8 rounded-2xl border border-white/5 hover:border-purple-500/50 transition">
                            <div class="text-xs font-black text-purple-400 mb-4 uppercase tracking-widest">\${s.category}</div>
                            <h3 class="text-2xl font-bold text-white mb-2">\${s.name}</h3>
                            <p class="text-slate-500 text-sm mb-6">By \${s.author}</p>
                            <div class="flex justify-between items-center pt-6 border-t border-white/5">
                                <span class="text-green-400 font-bold">\${s.price} USDC</span>
                                <button onclick="alert('Initializing x402 Handshake...')" class="bg-white text-black px-4 py-2 rounded-lg font-black text-xs">INSTALL</button>
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
