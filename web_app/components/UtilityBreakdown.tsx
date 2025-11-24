"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Cloud, Zap, Bomb } from "lucide-react"

interface UtilityData {
    [area: string]: {
        [grenade: string]: number
    }
}

interface UtilityBreakdownProps {
    data: UtilityData
}

const GRENADE_ICONS: Record<string, any> = {
    "Molotov": Flame,
    "Incendiary Grenade": Flame,
    "Smoke Grenade": Cloud,
    "Flashbang": Zap,
    "HE Grenade": Bomb
}

const GRENADE_COLORS: Record<string, string> = {
    "Molotov": "text-orange-500",
    "Incendiary Grenade": "text-orange-500",
    "Smoke Grenade": "text-gray-400",
    "Flashbang": "text-yellow-400",
    "HE Grenade": "text-red-500"
}

export function UtilityBreakdown({ data }: UtilityBreakdownProps) {
    // Sort areas by total utility count
    const sortedAreas = Object.entries(data).sort(([, a], [, b]) => {
        const totalA = Object.values(a).reduce((sum, val) => sum + val, 0)
        const totalB = Object.values(b).reduce((sum, val) => sum + val, 0)
        return totalB - totalA
    })

    return (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader>
                <CardTitle>Utility Usage by Position</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {sortedAreas.map(([area, grenades]) => (
                        <div key={area} className="space-y-2">
                            <h4 className="text-sm font-medium text-zinc-400 border-b border-zinc-800 pb-1">{area}</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(grenades).map(([grenade, count]) => {
                                    const Icon = GRENADE_ICONS[grenade] || Bomb
                                    const colorClass = GRENADE_COLORS[grenade] || "text-zinc-500"

                                    return (
                                        <div key={grenade} className="flex items-center justify-between bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                                            <div className="flex items-center gap-2">
                                                <Icon className={`w-4 h-4 ${colorClass}`} />
                                                <span className="text-xs text-zinc-300">{grenade}</span>
                                            </div>
                                            <span className="text-xs font-mono font-bold text-zinc-500">{count}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
