"use client"

import { useState } from 'react'
import { ChevronDown, Filter } from 'lucide-react'

export type BuyType = 'all' | 'pistol' | 'eco' | 'light_buy' | 'full_buy'

interface RoundSelectorProps {
    totalRounds: number
    currentRound: number
    onRoundChange: (round: number) => void
    buyTypeFilter: BuyType
    onBuyTypeChange: (buyType: BuyType) => void
    roundsWithData: number[]
}

export function RoundSelector({
    totalRounds,
    currentRound,
    onRoundChange,
    buyTypeFilter,
    onBuyTypeChange,
    roundsWithData
}: RoundSelectorProps) {
    const [showDropdown, setShowDropdown] = useState(false)

    const buyTypeLabels: Record<BuyType, string> = {
        all: 'All Rounds',
        pistol: 'Pistol Rounds',
        eco: 'Eco Rounds',
        light_buy: 'Light Buy',
        full_buy: 'Full Buy'
    }

    const buyTypeColors: Record<BuyType, string> = {
        all: 'bg-zinc-700',
        pistol: 'bg-yellow-600',
        eco: 'bg-red-600',
        light_buy: 'bg-orange-600',
        full_buy: 'bg-green-600'
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Round Selector */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-zinc-400">Round:</label>
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-md hover:border-zinc-600 transition-colors text-zinc-100 min-w-[120px]"
                    >
                        <span>Round {currentRound}</span>
                        <ChevronDown className="w-4 h-4" />
                    </button>

                    {showDropdown && (
                        <div className="absolute top-full mt-1 w-64 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl z-50 max-h-64 overflow-y-auto">
                            {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => {
                                const hasData = roundsWithData.includes(round)
                                return (
                                    <button
                                        key={round}
                                        onClick={() => {
                                            onRoundChange(round)
                                            setShowDropdown(false)
                                        }}
                                        disabled={!hasData}
                                        className={`w-full px-4 py-2 text-left hover:bg-zinc-800 transition-colors ${currentRound === round ? 'bg-zinc-800 text-blue-400' : 'text-zinc-300'
                                            } ${!hasData ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        Round {round} {!hasData && '(No B-Site Data)'}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Round Navigation Buttons */}
                <div className="flex gap-1">
                    <button
                        onClick={() => onRoundChange(Math.max(1, currentRound - 1))}
                        disabled={currentRound === 1}
                        className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md hover:border-zinc-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => onRoundChange(Math.min(totalRounds, currentRound + 1))}
                        disabled={currentRound === totalRounds}
                        className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md hover:border-zinc-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300"
                    >
                        →
                    </button>
                </div>
            </div>

            {/* Buy Type Filter */}
            <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-zinc-400" />
                <div className="flex gap-2 flex-wrap">
                    {(Object.keys(buyTypeLabels) as BuyType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => onBuyTypeChange(type)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${buyTypeFilter === type
                                    ? `${buyTypeColors[type]} text-white ring-2 ring-offset-2 ring-offset-black ring-${buyTypeColors[type].replace('bg-', '')}`
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            {buyTypeLabels[type]}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
