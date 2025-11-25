"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JourneyPath, UtilityMarkers } from '@/components/JourneyPath'

interface JourneyPoint {
    tick: number
    time: number
    x: number
    y: number
    area: string
    is_entry: boolean
}

interface UtilityThrow {
    tick: number
    time: number
    type: string
    x: number
    y: number
    area: string
}

interface PlayerData {
    name: string
    buy_type: string
    equipment: any
    journey: JourneyPoint[]
    utility_throws: UtilityThrow[]
    entry_point: string
    primary_position: string
    time_in_site: number
}

interface MapVisualizerV2Props {
    players: PlayerData[]
    viewMode: 'individual' | 'aggregate'
}

const MAP_BOUNDS = {
    minX: -2264,
    maxX: -963,
    minY: -72,
    maxY: 1738
}

const PLAYER_COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899'  // pink
]

export function MapVisualizerV2({ players, viewMode }: MapVisualizerV2Props) {
    const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)

    // In individual mode, show all players
    // In aggregate mode, show overlapping paths
    const playersToShow = viewMode === 'individual' ? players : players

    return (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>B-Site Journey Map</CardTitle>
                    <div className="flex items-center gap-2">
                        {players.map((player, idx) => (
                            <button
                                key={player.name}
                                onClick={() => setSelectedPlayer(selectedPlayer === idx ? null : idx)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-all ${selectedPlayer === null || selectedPlayer === idx
                                        ? 'opacity-100'
                                        : 'opacity-40'
                                    }`}
                                style={{
                                    backgroundColor: selectedPlayer === idx ? PLAYER_COLORS[idx % PLAYER_COLORS.length] : '#27272a',
                                    color: selectedPlayer === idx ? 'white' : '#a1a1aa'
                                }}
                            >
                                {player.name}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="relative h-[600px] w-full bg-zinc-950 rounded-md overflow-hidden border border-zinc-800 p-0">
                {/* Dust 2 B-Site Radar Background */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: 'url("/maps/dust2_radar.webp")',
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        opacity: 0.75
                    }}
                />

                {/* Dark overlay for better contrast */}
                <div className="absolute inset-0 bg-black/30" />

                {/* Journey Paths */}
                {playersToShow.map((player, idx) => {
                    // Skip if a player is selected and this isn't that player
                    if (selectedPlayer !== null && selectedPlayer !== idx) {
                        return null
                    }

                    return (
                        <div key={`${player.name}-${idx}`} className="absolute inset-0">
                            <JourneyPath
                                journey={player.journey}
                                utilityThrows={player.utility_throws}
                                playerName={player.name}
                                color={PLAYER_COLORS[idx % PLAYER_COLORS.length]}
                                mapBounds={MAP_BOUNDS}
                            />
                        </div>
                    )
                })}

                {/* Utility Markers (on top) */}
                {playersToShow.map((player, idx) => {
                    if (selectedPlayer !== null && selectedPlayer !== idx) {
                        return null
                    }

                    return (
                        <UtilityMarkers
                            key={`utils-${player.name}-${idx}`}
                            utilityThrows={player.utility_throws}
                            mapBounds={MAP_BOUNDS}
                        />
                    )
                })}

                {/* Legend */}
                <div className="absolute bottom-4 right-4 bg-zinc-900/90 backdrop-blur p-3 rounded border border-zinc-800 text-xs space-y-2 z-30">
                    <div className="font-bold text-zinc-100 mb-2">Legend</div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-zinc-300">Entry Point</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-1 bg-blue-500" style={{ opacity: 0.7 }} />
                        <span className="text-zinc-300">Player Path</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-lg">💨</span>
                        <span className="text-zinc-300">Utility Throws</span>
                    </div>
                    <div className="text-zinc-500 text-xs mt-2 border-t border-zinc-800 pt-2">
                        Line thickness = dwell time
                    </div>
                </div>

                {/* Info when no players */}
                {players.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-6 text-center">
                            <p className="text-zinc-400">No CT players in B-Site this round</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
