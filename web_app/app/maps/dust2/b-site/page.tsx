"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart2, Users } from 'lucide-react'
import { RoundSelector, type BuyType } from '@/components/RoundSelector'
import { EquipmentPanel } from '@/components/EquipmentPanel'
import { MapVisualizerV2 } from '@/components/MapVisualizerV2'
import { AggregateStats } from '@/components/AggregateStats'

interface DemoData {
    metadata: {
        demo_file: string
        total_rounds: number
        map: string
    }
    rounds: Array<{
        round_num: number
        ct_players: any[]
    }>
    aggregate: {
        total_rounds: number
        position_stats: any[]
    }
}

export default function Dust2BSitePage() {
    const [data, setData] = useState<DemoData | null>(null)
    const [currentRound, setCurrentRound] = useState(1)
    const [buyTypeFilter, setBuyTypeFilter] = useState<BuyType>('all')
    const [viewMode, setViewMode] = useState<'individual' | 'aggregate'>('individual')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Load data from JSON
        fetch('/data.json')
            .then(res => res.json())
            .then(data => {
                setData(data)
                setLoading(false)
                // Set to first round with data
                const firstRoundWithData = data.rounds.find((r: any) => r.ct_players.length > 0)
                if (firstRoundWithData) {
                    setCurrentRound(firstRoundWithData.round_num)
                }
            })
            .catch(err => {
                console.error('Error loading data:', err)
                setLoading(false)
            })
    }, [])

    if (loading) {
        return (
            <main className="min-h-screen bg-black text-zinc-100 p-4 md:p-8 font-sans">
                <div className="max-w-7xl mx-auto flex items-center justify-center min-h-screen">
                    <div className="text-zinc-400">Loading analysis data...</div>
                </div>
            </main>
        )
    }

    if (!data) {
        return (
            <main className="min-h-screen bg-black text-zinc-100 p-4 md:p-8 font-sans">
                <div className="max-w-7xl mx-auto flex items-center justify-center min-h-screen">
                    <div className="text-red-400">Error loading data. Please check data.json file.</div>
                </div>
            </main>
        )
    }

    // Filter rounds by buy type
    const filteredRounds = data.rounds.filter(round => {
        if (buyTypeFilter === 'all') return true

        // Check if any CT player matches the buy type filter
        return round.ct_players.some(player => player.buy_type === buyTypeFilter)
    })

    // Get rounds that have data
    const roundsWithData = data.rounds
        .filter(r => r.ct_players.length > 0)
        .map(r => r.round_num)

    // Get current round data
    const currentRoundData = data.rounds.find(r => r.round_num === currentRound)
    const currentRoundPlayers = currentRoundData?.ct_players || []

    // Apply buy type filter to current round's players
    const filteredPlayers = buyTypeFilter === 'all'
        ? currentRoundPlayers
        : currentRoundPlayers.filter(p => p.buy_type === buyTypeFilter)

    return (
        <main className="min-h-screen bg-black text-zinc-100 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
                    <div className="space-y-1">
                        <Link
                            href="/maps"
                            className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mb-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Maps
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
                            Dust 2 B-Site Analysis
                        </h1>
                        <p className="text-zinc-400 text-sm">
                            CT Positioning, Equipment & Movement Patterns
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-500 font-mono">
                            {data.metadata.demo_file}
                        </div>
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-3 p-4 bg-zinc-900/40 rounded-lg border border-zinc-800">
                    <span className="text-sm text-zinc-400">View Mode:</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('individual')}
                            className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${viewMode === 'individual'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Individual Rounds
                        </button>
                        <button
                            onClick={() => setViewMode('aggregate')}
                            className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${viewMode === 'aggregate'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            <BarChart2 className="w-4 h-4" />
                            Aggregate Stats
                        </button>
                    </div>
                </div>

                {/* Individual Round View */}
                {viewMode === 'individual' && (
                    <>
                        {/* Round Controls */}
                        <div className="p-4 bg-zinc-900/40 rounded-lg border border-zinc-800">
                            <RoundSelector
                                totalRounds={data.metadata.total_rounds}
                                currentRound={currentRound}
                                onRoundChange={setCurrentRound}
                                buyTypeFilter={buyTypeFilter}
                                onBuyTypeChange={setBuyTypeFilter}
                                roundsWithData={roundsWithData}
                            />
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Map Section (Left/Top) */}
                            <div className="lg:col-span-8 space-y-6">
                                <MapVisualizerV2
                                    players={filteredPlayers}
                                    viewMode="individual"
                                />
                            </div>

                            {/* Equipment Section (Right/Bottom) */}
                            <div className="lg:col-span-4">
                                <EquipmentPanel players={filteredPlayers} />
                            </div>
                        </div>
                    </>
                )}

                {/* Aggregate View */}
                {viewMode === 'aggregate' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="lg:col-span-2">
                            <AggregateStats
                                positionStats={data.aggregate.position_stats}
                                totalRounds={data.aggregate.total_rounds}
                            />
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
