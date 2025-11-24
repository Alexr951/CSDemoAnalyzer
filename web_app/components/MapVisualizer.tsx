"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// B-Site boundaries from the script
const MIN_X = -2264
const MAX_X = -963
const MIN_Y = -72
const MAX_Y = 1738

const WIDTH = MAX_X - MIN_X
const HEIGHT = MAX_Y - MIN_Y

interface Position {
    area: string
    count: number
    percentage: number
}

interface MapVisualizerProps {
    data: Position[]
}

// Approximate center points for areas (manually estimated based on ranges in script)
const AREA_CENTERS: Record<string, { x: number; y: number }> = {
    "Back site Tucked": { x: -1534, y: 1272 },
    "Single Barrel": { x: -1897, y: 1340 },
    "Double Barrels": { x: -1910, y: 1179 },
    "Window": { x: -1463, y: 1144 },
    "Default": { x: -1538, y: 955 },
    "Big Box B Site": { x: -1899, y: 983 },
    "Back Plat": { x: -2067, y: 1551 },
    "Doors": { x: -1424, y: 610 },
    "Car B-Site": { x: -1656, y: 188 },
    "Tunnel Exit": { x: -2051, y: -25 },
    "Top Car Box": { x: -1905, y: 227 },
    "Close Left": { x: -2165, y: 242 },
    "Second Cubby": { x: -2211, y: 561 },
    "B-Site General": { x: -1654, y: 1167 },
}

// Helper to get color based on percentage (Blue -> Red gradient)
const getHeatmapColor = (percentage: number) => {
    // Normalize 0-30% (assuming 30% is high)
    const normalized = Math.min(percentage / 30, 1)

    // R, G, B
    // Low (Blue): 59, 130, 246
    // High (Red): 239, 68, 68

    const r = Math.round(59 + (239 - 59) * normalized)
    const g = Math.round(130 + (68 - 130) * normalized)
    const b = Math.round(246 + (68 - 246) * normalized)

    return `rgba(${r}, ${g}, ${b}, 0.6)`
}

export function MapVisualizer({ data }: MapVisualizerProps) {
    // Normalize coordinates to 0-100%
    const getStyle = (x: number, y: number) => {
        const left = ((x - MIN_X) / WIDTH) * 100
        // Flip Y because CSS Y is down, Game Y is usually Up (or check if it needs flipping)
        // Assuming standard game coords where Y is up.
        const bottom = ((y - MIN_Y) / HEIGHT) * 100
        return { left: `${left}%`, bottom: `${bottom}%` }
    }

    return (
        <Card className="h-full w-full bg-zinc-900 border-zinc-800 text-zinc-100 overflow-hidden">
            <CardHeader>
                <CardTitle>B-Site Heatmap</CardTitle>
            </CardHeader>
            <CardContent className="relative h-[600px] w-full bg-zinc-950 rounded-md overflow-hidden border border-zinc-800 p-0">
                {/* Map Background */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-80"
                    style={{
                        backgroundImage: 'url("https://preview.redd.it/new-dust-2-callouts-v0-w1080g8038wc1.jpeg?auto=webp&s=6580556209581333792612255743118491845138")',
                        backgroundPosition: '10% 90%', // Bottom Left is usually B site
                        backgroundSize: '300%' // Zoom in
                    }}
                >
                </div>

                {/* Overlay Grid for context (optional) */}
                <div className="absolute inset-0 bg-black/40"></div>

                {/* Areas */}
                {data.map((pos) => {
                    const center = AREA_CENTERS[pos.area]
                    if (!center) return null

                    const style = getStyle(center.x, center.y)
                    // Size based on percentage
                    const size = Math.max(30, pos.percentage * 4)
                    const color = getHeatmapColor(pos.percentage)

                    return (
                        <div
                            key={pos.area}
                            className="absolute transform -translate-x-1/2 translate-y-1/2 flex items-center justify-center group cursor-pointer"
                            style={style}
                        >
                            <div
                                className="rounded-full blur-md transition-all duration-500 hover:scale-125 hover:blur-sm"
                                style={{
                                    width: `${size}px`,
                                    height: `${size}px`,
                                    backgroundColor: color,
                                    boxShadow: `0 0 20px ${color}`
                                }}
                            />

                            {/* Tooltip */}
                            <div className="absolute opacity-0 group-hover:opacity-100 bg-zinc-900/90 border border-zinc-700 text-white text-xs p-2 rounded -top-12 whitespace-nowrap z-20 pointer-events-none transition-opacity shadow-xl backdrop-blur-sm">
                                <div className="font-bold">{pos.area}</div>
                                <div className="text-zinc-400">{pos.percentage}% Frequency</div>
                            </div>
                        </div>
                    )
                })}

                {/* Legend */}
                <div className="absolute bottom-4 right-4 bg-zinc-900/80 backdrop-blur p-2 rounded border border-zinc-800 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <span>High Traffic</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500/80"></div>
                        <span>Low Traffic</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
