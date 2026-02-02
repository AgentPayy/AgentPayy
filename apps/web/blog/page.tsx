export default function BlogPage() {
  const posts = [
    {
      title: "Why 48-hour Escrow is Killing the Agent Economy",
      description: "Traditional escrow systems are designed for humans. Agentic loops require milliseconds. Here is how x402 on Base L2 fixes the friction.",
      date: "Feb 2, 2026",
      tag: "Infrastructure"
    },
    {
      title: "AgentPayy vs Stripe ACP: The Real Comparison",
      description: "Choosing the right economic layer for your bots. Why fiat-to-bot is different from bot-to-bot commerce.",
      date: "Jan 30, 2026",
      tag: "Ecosystem"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-20 text-slate-200">
      <h1 className="text-5xl font-black mb-12 tracking-tighter text-white text-center">Engineering Blog</h1>
      
      <div className="grid gap-8">
        {posts.map((post, i) => (
          <div key={i} className="p-8 glass rounded-2xl border border-white/5 hover:border-purple-500/50 transition bg-slate-900/30">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">{post.tag}</span>
              <span className="text-xs text-slate-500 font-mono italic">{post.date}</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{post.title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">{post.description}</p>
            <button className="text-white text-xs font-black flex items-center gap-2 hover:text-purple-400 transition">
              Read Technical Breakdown <span>→</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
