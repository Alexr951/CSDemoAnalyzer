"use client"

import React from 'react'

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

interface JourneyPathProps {
    journey: JourneyPoint[]
    utilityThrows: UtilityThrow[]
    playerName: string
    color: string
    mapBounds: {
        minX: number
        maxX: number
        minY: number
        maxY: number
    }
}

// Utility icons mapping
const UTILITY_ICONS: Record<string, string> = {
    'Smoke Grenade': '💨',
    'Flashbang': '⚡',
    'HE Grenade': '💥',
    'Molotov': '🔥',
    'Incendiary Grenade': '🔥'
}

function coordinateToPercent(value: number, min: number, max: number): number {
    return ((value - min) / (max - min)) * 100
}

export function JourneyPath({
    journey,
    utilityThrows,
    playerName,
    color,
    mapBounds
}: JourneyPathProps) {
    if (!journey || journey.length === 0) {
        return null
    }

    // Convert coordinates to percentages
    const points = journey.map((point) => ({
        x: coordinateToPercent(point.x, mapBounds.minX, mapBounds.maxX),
        y: coordinateToPercent(point.y, mapBounds.minY, mapBounds.maxY),
        time: point.time,
        area: point.area,
        is_entry: point.is_entry
    }))

    const utilityPoints = utilityThrows.map((util) => ({
        x: coordinateToPercent(util.x, mapBounds.minX, mapBounds.maxX),
        y: coordinateToPercent(util.y, mapBounds.minY, mapBounds.maxY),
        type: util.type,
        time: util.time
    }))

    // Create SVG path string
    const pathString = points.map((point, index) => {
        if (index === 0) {
            return `M ${point.x} ${100 - point.y}` // Flip Y for SVG coordinates
        }
        return `L ${point.x} ${100 - point.y}`
    }).join(' ')

    // Calculate dwell times (time spent between points)
    const dwellTimes = points.slice(1).map((point, index) => {
        return point.time - points[index].time
    })

    const maxDwell = Math.max(...dwellTimes, 1)

    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ zIndex: 10 }}
        >
            {/* Main journey path */}
            <path
                d={pathString}
                fill="none"
                stroke={color}
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
                filter="url(#glow)"
            />

            {/* Segment markers with variable thickness based on dwell time */}
            {points.slice(1).map((point, index) => {
                const prevPoint = points[index]
                const dwellTime = dwellTimes[index]
                const thickness = 0.3 + (dwellTime / maxDwell) * 1.5 // Scale thickness
                const opacity = 0.4 + (dwellTime / maxDwell) * 0.4 // Scale opacity

                return (
                    <line
                        key={`segment-${index}`}
                        x1={prevPoint.x}
                        y1={100 - prevPoint.y}
                        x2={point.x}
                        y2={100 - point.y}
                        stroke={color}
                        strokeWidth={thickness}
                        opacity={opacity}
                        strokeLinecap="round"
                    />
                )
            })}

            {/* Entry point marker */}
            <circle
                cx={points[0].x}
                cy={100 - points[0].y}
                r="1.2"
                fill={color}
                stroke="white"
                strokeWidth="0.3"
                opacity="0.9"
            />

            {/* End point marker */}
            <circle
                cx={points[points.length - 1].x}
                cy={100 - points[points.length - 1].y}
                r="0.8"
                fill={color}
                opacity="0.7"
            />

            {/* Glow filter */}
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
        </svg>
    )
}

// Separate component for utility markers (rendered on top)
export function UtilityMarkers({
    utilityThrows,
    mapBounds
}: {
    utilityThrows: UtilityThrow[]
    mapBounds: { minX: number; maxX: number; minY: number; maxY: number }
}) {
    if (!utilityThrows || utilityThrows.length === 0) {
        return null
    }

    return (
        <>
            {utilityThrows.map((util, index) => {
                const x = coordinateToPercent(util.x, mapBounds.minX, mapBounds.maxX)
                const y = coordinateToPercent(util.y, mapBounds.minY, mapBounds.maxY)
                const icon = UTILITY_ICONS[util.type] || '🎯'

                return (
                    <div
                        key={`util-${index}`}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
                        style={{
                            left: `${x}%`,
                            bottom: `${y}%`
                        }}
                    >
                        {/* Utility icon */}
                        <div className="text-lg drop-shadow-lg hover:scale-125 transition-transform">
                            {icon}
                        </div>

                        {/* Tooltip */}
                        <div className="absolute opacity-0 group-hover:opacity-100 bg-zinc-900/95 border border-zinc-700 text-white text-xs px-2 py-1 rounded -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap transition-opacity pointer-events-none shadow-xl">
                            <div className="font-bold">{util.type}</div>
                            <div className="text-zinc-400">{util.time.toFixed(1)}s</div>
                        </div>
                    </div>
                )
            })}
        </>
    )
}
