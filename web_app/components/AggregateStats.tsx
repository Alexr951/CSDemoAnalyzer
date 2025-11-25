"use client"

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { TrendingUp, Target, MapPin } from 'lucide-react'

interface PositionStat {
    area: string
    overall_frequency: number
    total_occurrences: number
    by_buy_type: {
        [key: string]: {
            count: number
            percentage: number
        }
    }
    entry_points: {
        [key: string]: number
    }
    unique_players: number
}

interface AggregateStatsProps {
    positionStats: PositionStat[]
    totalRounds: number
}

const buyTypeColors: Record<string, string> = {
    pistol: 'text-yellow-400',
    eco: 'text-red-400',
    light_buy: 'text-orange-400',
    full_buy: 'text-green-400'
}

const buyTypeLabels: Record<string, string> = {
    pistol: 'Pistol',
    eco: 'Eco',
    light_buy: 'Light',
    full_buy: 'Full Buy'
}

export function AggregateStats({ positionStats, totalRounds }: AggregateStatsProps) {
    if (!positionStats || positionStats.length === 0) {
        return (
            <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <CardHeader>
                    <CardTitle>Aggregate Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-zinc-500">
                        No data available
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Aggregate Statistics
                </CardTitle>
                <p className="text-sm text-zinc-500">Across {totalRounds} rounds</p>
            </CardHeader>
            <CardContent className="space-y-6">
                {positionStats.slice(0, 5).map((stat, idx) => {
                    const topBuyType = Object.entries(stat.by_buy_type)
                        .sort(([, a], [, b]) => b.count - a.count)[0]

                    const topEntry = Object.entries(stat.entry_points)
                        .sort(([, a], [, b]) => b - a)[0]

                    return (
                        <div
                            key={stat.area}
                            className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800/50 space-y-3"
                        >
                            {/* Position Name & Frequency */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-blue-400" />
                                    <h3 className="font-bold text-zinc-100">{stat.area}</h3>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-400">
                                        {(stat.overall_frequency * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        {stat.total_occurrences} times
                                    </div>
                                </div>
                            </div>

                            {/* Buy Type Breakdown */}
                            <div>
                                <div className="text-xs text-zinc-500 mb-2">Buy Type Distribution</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {Object.entries(stat.by_buy_type)
                                        .sort(([, a], [, b]) => b.count - a.count)
                                        .map(([buyType, data]) => (
                                            <div
                                                key={buyType}
                                                className="flex justify-between items-center"
                                            >
                                                <span className={`${buyTypeColors[buyType] || 'text-zinc-400'} font-medium`}>
                                                    {buyTypeLabels[buyType] || buyType}:
                                                </span>
                                                <span className="text-zinc-300">
                                                    {(data.percentage * 100).toFixed(0)}%
                                                    <span className="text-zinc-600 ml-1">({data.count})</span>
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Entry Points */}
                            {topEntry && (
                                <div className="pt-2 border-t border-zinc-800">
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="w-4 h-4 text-purple-400" />
                                        <span className="text-zinc-500">Most Common Entry:</span>
                                        <span className="text-zinc-300 font-medium capitalize">
                                            {topEntry[0]}
                                        </span>
                                        <span className="text-zinc-600">
                                            ({topEntry[1]} times)
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Additional Insight */}
                            {topBuyType && (
                                <div className="text-xs text-zinc-500 italic bg-zinc-900/50 p-2 rounded">
                                    💡 {(stat.overall_frequency * 100).toFixed(0)}% of rounds feature this position,
                                    with {(topBuyType[1].percentage * 100).toFixed(0)}% being {buyTypeLabels[topBuyType[0]]} rounds
                                </div>
                            )}
                        </div>
                    )
                })}

                {positionStats.length > 5 && (
                    <div className="text-center text-sm text-zinc-500">
                        + {positionStats.length - 5} more positions
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
