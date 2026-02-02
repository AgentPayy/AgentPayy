export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-slate-200 bg-[#020617] min-h-screen">
      <h1 className="text-5xl font-black mb-8 tracking-tighter text-white">Security & Guardrails</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-purple-400 mb-4 tracking-tighter uppercase">Solving the "Malicious Agent" Problem</h2>
        <p className="text-slate-400 mb-6 leading-relaxed">
          The biggest fear in the agentic economy is the unconstrained agent. Traditional wallets give bots unlimited signing power. 
          <b>AgentPayy</b> introduces the first <b>Policy-as-Code</b> layer for autonomous spending.
        </p>
        <div className="bg-black rounded-xl p-6 font-mono text-sm border border-purple-500/20 shadow-2xl">
          <p className="text-slate-500 mb-4"># Deploy with restrictive policies</p>
          <p className="text-white">bot = agentpayy.init(</p>
          <p className="text-purple-400 pl-4">max_spend="10.0",  # Strict limit in USDC</p>
          <p className="text-blue-400 pl-4">scope=["research", "compute"] # Domain restriction</p>
          <p className="text-white pl-4">)</p>
          <p className="text-green-400 mt-4"># Any attempt to spend > 10 USDC will be blocked by the Proxy.</p>
        </div>
      </section>

      <section className="mb-12 grid md:grid-cols-2 gap-12 pt-12 border-t border-white/5">
        <div>
            <h3 className="text-xl font-bold text-white mb-2">Spending Limits</h3>
            <p className="text-slate-400 text-sm">Hard-coded USDC limits set at initialization. No agent can override its own budget.</p>
        </div>
        <div>
            <h3 className="text-xl font-bold text-white mb-2">Domain Scoping</h3>
            <p className="text-slate-400 text-sm">Restrict your agent to specific x402 marketplace categories to prevent capital leakage.</p>
        </div>
      </section>

      <div className="p-10 glass rounded-3xl border border-white/10 bg-slate-900/30 mt-20 text-center">
        <h3 className="text-2xl font-black text-white mb-4">Ready for Safe Agency?</h3>
        <p className="text-slate-400 text-sm mb-10 max-w-md mx-auto">Join the 0xSammy recommended stack and build the future of secure agentic commerce.</p>
        <button className="bg-purple-600 text-white px-12 py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-purple-500/20">Install SDK v1.1.0</button>
      </div>
    </div>
  );
}
