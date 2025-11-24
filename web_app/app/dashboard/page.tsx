import fs from 'fs'
import path from 'path'
import { MapVisualizer } from '@/components/MapVisualizer'
import { StatsPanel } from '@/components/StatsPanel'
import { UtilityBreakdown } from '@/components/UtilityBreakdown'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

async function getData() {
    const filePath = path.join(process.cwd(), 'public', 'data.json')
    try {
        const fileContents = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(fileContents)
    } catch (e) {
        console.error("Error reading data.json", e)
        return { positions: [], utility: {} }
    }
}

export default async function Dashboard() {
    const data = await getData()

    return (
        <main className="min-h-screen bg-black text-zinc-100 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
                    <div className="space-y-1">
                        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mb-2 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Home
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
                            Dust 2 B-Site Analysis
                        </h1>
                        <p className="text-zinc-400 text-sm">
                            CT Positioning & Utility Usage
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-500 font-mono">
                            Source: g2-vs-spirit-m3-dust2.dem
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Map Section (Left/Top) */}
                    <div className="lg:col-span-7 space-y-6">
                        <MapVisualizer data={data.positions} />
                        <StatsPanel data={data.positions} />
                    </div>

                    {/* Utility Section (Right/Bottom) */}
                    <div className="lg:col-span-5">
                        <UtilityBreakdown data={data.utility} />
                    </div>

                </div>
            </div>
        </main>
    )
}
