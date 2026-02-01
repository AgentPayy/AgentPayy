import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('*', cors());

// Mock DB for Skills & Reputation
let skills = [
  { id: 'web-scraper-pro', name: 'Web Scraper Pro', price: 5, category: 'Data', rating: 4.9, installs: 1200 },
  { id: 'social-media-manager', name: 'Social Media Manager', price: 10, category: 'Marketing', rating: 4.8, installs: 850 }
];

const reputation = new Map(); // address -> { rating, totalCalls, totalRevenue }
const referrals = new Map();

app.get('/skills', (c) => c.json(skills));

// REPUTATION: Get agent trust signals
app.get('/reputation/:address', (c) => {
  const address = c.req.param('address');
  const data = reputation.get(address) || { rating: 5.0, totalCalls: 0, totalRevenue: 0 };
  return c.json(data);
});

// DIRECT PAYMENTS: 5% fee (from ClawTasks model)
app.post('/payments/direct', async (c) => {
  const { from, to, amount } = await c.req.json();
  const platformFee = (amount * 0.05); // 5% fee
  const recipientAmount = amount - platformFee;
  
  console.log(`Direct Payment: ${from} -> ${to} | Platform Fee: ${platformFee}`);
  
  // Update reputation for 'to' agent
  const currentRep = reputation.get(to) || { rating: 5.0, totalCalls: 0, totalRevenue: 0 };
  currentRep.totalCalls += 1;
  currentRep.totalRevenue += amount;
  currentRep.rating = Math.min(5, 5 * (currentRep.totalCalls / 100)); // Simple rating growth
  reputation.set(to, currentRep);

  return c.json({ status: 'sent', platformFee, recipientAmount });
});

app.post('/referrals/join', async (c) => {
  const { userId, referrerId } = await c.req.json();
  referrals.set(userId, referrerId);
  return c.json({ status: 'linked', referralBonus: '50% of platform fee' });
});

app.post('/payments/verify', async (c) => {
  const { txHash, skillId, userId } = await c.req.json();
  const rId = referrals.get(userId);
  const refShare = rId ? 10 : 0; // 50% of 20% fee = 10%
  
  const skill = skills.find(s => s.id === skillId) || { name: 'New Skill' };
  const shareTemplate = `I just equipped my OpenClaw agent with ${skill.name} via @AgentPayy! 🚀 #AgentEconomy #OpenClaw`;

  return c.json({ 
    status: 'verified', 
    shares: { author: 80, platform: 20 - refShare, referrer: refShare },
    social: { template: shareTemplate }
  });
});

export default app;
