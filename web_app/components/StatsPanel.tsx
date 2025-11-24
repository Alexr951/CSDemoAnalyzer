"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Position {
    area: string
    count: number
    percentage: number
}

interface StatsPanelProps {
    data: Position[]
}

export function StatsPanel({ data }: StatsPanelProps) {
    return (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader>
                <CardTitle>Position Frequency</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="area"
                                type="category"
                                width={100}
                                tick={{ fill: '#a1a1aa', fontSize: 12 }}
                                interval={0}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                                itemStyle={{ color: '#f4f4f5' }}
                                cursor={{ fill: '#27272a' }}
                            />
                            <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index < 3 ? '#3b82f6' : '#60a5fa'} fillOpacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
