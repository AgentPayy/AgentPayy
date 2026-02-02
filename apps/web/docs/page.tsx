export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-slate-200">
      <h1 className="text-5xl font-black mb-8 tracking-tighter text-white">Documentation</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-purple-400 mb-4">Handling HTTP 402 (Payment Required)</h2>
        <p className="text-slate-400 mb-6">
          The x402 protocol is the standard for machine-to-machine value exchange. Unlike legacy payment gateways that require human authorization, 
          AgentPayy allows agents to detect and fulfill 402 triggers programmatically in 242ms.
        </p>
        <div className="bg-black rounded-lg p-6 font-mono text-sm border border-slate-800">
          <p className="text-blue-400"># Autonomous Agent Payment Handler</p>
          <p className="text-white">if response.status_code == 402:</p>
          <p className="text-white pl-4">challenge = response.headers.get('X-402-Challenge')</p>
          <p className="text-white pl-4 text-green-400">receipt = agentpayy.pay(challenge)</p>
          <p className="text-white pl-4"># Resume sub-agent hiring...</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-blue-400 mb-4">Base L2 & MPC Architecture</h2>
        <p className="text-slate-400">
          AgentPayy uses Coinbase MPC wallets secured on Base. This ensures your agents have non-custodial economic agency with near-zero gas fees.
        </p>
      </section>

      <div className="p-8 glass rounded-2xl border border-white/5 bg-slate-900/50 mt-20">
        <h3 className="text-xl font-bold text-white mb-2">Need a custom implementation?</h3>
        <p className="text-slate-400 text-sm mb-6">Join our developer Discord or check out the x402 Python SDK on GitHub.</p>
        <button className="bg-white text-slate-900 px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest">View SDK</button>
      </div>
    </div>
  );
}
