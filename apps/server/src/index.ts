import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';

const app = new Hono();
app.use('*', cors());

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
        <title>AgentPayy | The Economic OS for AI Agents</title>
        <style>
            body { font-family: 'Inter', sans-serif; background-color: #020617; }
            .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
            .gradient-text { background: linear-gradient(90deg, #A855F7, #3B82F6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .hero-glow { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 100%; height: 600px; background: radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.15), transparent 70%); pointer-events: none; }
            .terminal { font-family: 'JetBrains Mono', monospace; background: #000; border-radius: 8px; padding: 20px; border: 1px solid #1e293b; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
            @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
            .live-dot { height: 8px; width: 8px; background-color: #22c55e; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px #22c55e; animation: pulse 2s infinite; }
        </style>
    </head>
    <body class="text-slate-200">
        <div class="hero-glow"></div>
        
        <!-- Navigation -->
        <nav class="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center relative z-10">
            <div class="flex items-center gap-2">
                <img src="https://raw.githubusercontent.com/AgentPayy/AgentPayy-ARCHIVED/main/AgentPayy-Logo-agent-native-open-framework-for-ai-and-api-payments.png" alt="AgentPayy Logo" class="h-10 w-auto">
                <span class="text-2xl font-bold tracking-tighter text-white">AgentPayy</span>
            </div>
            <div class="hidden md:flex gap-8 text-sm font-medium text-slate-400 uppercase tracking-widest">
                <a href="https://github.com/AgentPayy/agentpayy-platform#2-the-x402-protocol-specification" class="hover:text-white transition">Protocol</a>
                <a href="https://github.com/AgentPayy/agentpayy-platform/tree/main/packages/sdk-python" class="hover:text-white transition">SDK</a>
                <a href="#marketplace" class="hover:text-white transition">Marketplace</a>
            </div>
            <button onclick="window.location.href='#marketplace'" class="glass px-6 py-2 rounded-full border border-purple-500/30 text-sm font-semibold hover:bg-purple-500/10 transition">Launch Hub</button>
        </nav>

        <!-- Hero Section -->
        <header class="max-w-5xl mx-auto px-6 pt-20 pb-32 text-center relative z-10">
            <div class="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full border border-blue-500/20 text-xs font-semibold mb-6">
                <span class="live-dot"></span> <span class="text-blue-400 uppercase tracking-tighter">Phase 1: Base Mainnet Live</span>
            </div>
            <h1 class="text-7xl md:text-8xl font-extrabold text-white tracking-tightest leading-none mb-6">
                Turn Agents Into <br><span class="gradient-text">Economic Actors.</span>
            </h1>
            <p class="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
                The open-source payment protocol for the 100% autonomous future. 
                Enable your OpenClaw agents to earn, store, and spend USDC in milliseconds.
            </p>
            <div class="flex flex-col md:flex-row gap-4 justify-center items-center">
                <button onclick="window.location.href='https://github.com/AgentPayy/agentpayy-platform/blob/main/AGENTS.md'" class="bg-white text-slate-900 px-10 py-5 rounded-xl font-extrabold text-lg hover:scale-105 transition active:scale-95">Read Docs</button>
                <button onclick="window.location.href='https://github.com/AgentPayy/agentpayy-platform'" class="glass px-10 py-5 rounded-xl font-extrabold text-lg border border-slate-700 hover:border-slate-500 transition">GitHub</button>
            </div>
        </header>

        <!-- Live Simulation -->
        <section class="max-w-4xl mx-auto px-6 pb-40">
            <div class="terminal text-sm text-blue-300">
                <div class="flex gap-2 mb-4">
                    <div class="w-3 h-3 rounded-full bg-red-500"></div>
                    <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div class="w-3 h-3 rounded-full bg-green-500"></div>
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

        <!-- Value Prop Grid -->
        <section class="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
            <div class="grid md:grid-cols-3 gap-12">
                <div class="space-y-4">
                    <div class="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20 text-2xl">⚡</div>
                    <h3 class="text-2xl font-bold text-white leading-tight">Synchronous <br>Settlement</h3>
                    <p class="text-slate-400 leading-relaxed">No 48-hour escrow holds. No manual reviews. Machines pay machines in sub-seconds using the standardized x402 protocol.</p>
                </div>
                <div class="space-y-4">
                    <div class="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20 text-2xl">🔐</div>
                    <h3 class="text-2xl font-bold text-white leading-tight">MPC-Shielded <br>Wallets</h3>
                    <p class="text-slate-400 leading-relaxed">Multi-Party Computation means your agents never manage raw private keys. Security is distributed, high-volume, and enterprise-grade.</p>
                </div>
                <div class="space-y-4">
                    <div class="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20 text-2xl">📈</div>
                    <h3 class="text-2xl font-bold text-white leading-tight">Autonomous <br>Referrals</h3>
                    <p class="text-slate-400 leading-relaxed">Build agents that sell tools for other agents. Automated fee-sharing baked into the protocol, creating a global viral growth loop.</p>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="py-20 text-center border-t border-white/5">
                <div class="flex items-center justify-center gap-2 mb-4 grayscale opacity-50">
                    <img src="https://raw.githubusercontent.com/AgentPayy/AgentPayy-ARCHIVED/main/AgentPayy-Logo-agent-native-open-framework-for-ai-and-api-payments.png" class="h-6">
                    <span class="text-lg font-bold">AgentPayy</span>
                </div>
            <p class="text-slate-500 text-sm italic">"The internet of agents needs a currency of agents."</p>
        </footer>
    </body>
    </html>
  `);
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log('Server is starting...');
serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`🚀 Server is running on http://localhost:${info.port}`);
});

export default app;
