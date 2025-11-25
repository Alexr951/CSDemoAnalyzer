"use client"

import { Shield, Zap, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface Equipment {
    primary_weapon: string
    armor_value: number
    has_helmet: boolean
    total_value: number
    health: number
}

interface PlayerData {
    name: string
    buy_type: string
    equipment: Equipment
    primary_position: string
    time_in_site: number
    entry_point: string
}

interface EquipmentPanelProps {
    players: PlayerData[]
}

const buyTypeColors: Record<string, { bg: string; text: string; label: string }> = {
    pistol: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', label: 'Pistol Round' },
    eco: { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Eco' },
    light_buy: { bg: 'bg-orange-900/30', text: 'text-orange-400', label: 'Light Buy' },
    full_buy: { bg: 'bg-green-900/30', text: 'text-green-400', label: 'Full Buy' }
}

function formatWeaponName(weapon: string): string {
    if (!weapon || weapon === 'None') return 'None'
    // Remove weapon_ prefix and capitalize
    return weapon.replace('weapon_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function EquipmentPanel({ players }: EquipmentPanelProps) {
    if (!players || players.length === 0) {
        return (
            <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <CardHeader>
                    <CardTitle className="text-lg">CT Equipment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-zinc-500">
                        No CT players in B-Site this round
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader>
                <CardTitle className="text-lg">CT Equipment & Loadout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {players.map((player, idx) => {
                    const buyType = buyTypeColors[player.buy_type] || buyTypeColors.eco

                    return (
                        <div
                            key={`${player.name}-${idx}`}
                            className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800/50 space-y-3"
                        >
                            {/* Player Name & Buy Type */}
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-zinc-100">{player.name}</h3>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${buyType.bg} ${buyType.text} border border-current/20`}>
                                    {buyType.label}
                                </span>
                            </div>

                            {/* Equipment Grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <div className="text-zinc-500 text-xs mb-1">Primary Weapon</div>
                                    <div className="font-medium text-zinc-200">
                                        {formatWeaponName(player.equipment.primary_weapon)}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-zinc-500 text-xs mb-1">Armor</div>
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-blue-400" />
                                        <span className="font-medium text-zinc-200">
                                            {player.equipment.armor_value > 0 ? (
                                                player.equipment.has_helmet ? 'Kevlar + Helmet' : 'Kevlar'
                                            ) : 'None'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-zinc-500 text-xs mb-1">Equipment Value</div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-green-400" />
                                        <span className="font-medium text-zinc-200">
                                            ${player.equipment.total_value}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-zinc-500 text-xs mb-1">Health</div>
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-red-400" />
                                        <span className="font-medium text-zinc-200">
                                            {player.equipment.health} HP
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Position Info */}
                            <div className="pt-2 border-t border-zinc-800 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Primary Position:</span>
                                    <span className="text-zinc-300 font-medium">{player.primary_position}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Entry Point:</span>
                                    <span className="text-zinc-300 font-medium capitalize">{player.entry_point}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Time in Site:</span>
                                    <span className="text-zinc-300 font-medium">{player.time_in_site}s</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
