import Link from 'next/link'
import { ArrowRight, Crosshair, BarChart2, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur text-sm text-zinc-400">
              <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              CS2 Demo Analysis Live
            </div>

            <h1 className="text-6xl md:text-7xl font-bold tracking-tight max-w-4xl bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
              Master the CT Defense on Dust 2
            </h1>

            <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
              Data-driven insights from pro matches. Visualize player positioning, utility usage, and site hold strategies to elevate your game.
            </p>

            <div className="flex items-center gap-4 pt-4">
              <Link
                href="/dashboard"
                className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-white px-8 font-medium text-black transition-all duration-300 hover:bg-zinc-200 hover:scale-105"
              >
                <span className="mr-2">Launch Dashboard</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 transition-opacity group-hover:opacity-10" />
              </Link>
              <a
                href="https://github.com/Alexr951/CSDemoAnalyzer"
                target="_blank"
                className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-800 bg-black px-8 font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-24 border-t border-zinc-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4 p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Crosshair className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-100">Position Heatmaps</h3>
            <p className="text-zinc-400 leading-relaxed">
              See exactly where pros play on B-Site. Identify high-traffic spots and off-angles used in top-tier matches.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-100">Utility Breakdown</h3>
            <p className="text-zinc-400 leading-relaxed">
              Analyze grenade usage by position. Learn the perfect molotovs and flashes to delay rushes and retake the site.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-100">Data-Driven Meta</h3>
            <p className="text-zinc-400 leading-relaxed">
              Stop guessing. Use aggregated data from demo files to understand the current CT meta on Dust 2.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
