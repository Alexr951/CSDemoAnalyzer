import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'

const CS2_MAPS = [
    {
        id: 'dust2',
        name: 'Dust 2',
        sites: [
            { id: 'a', name: 'A-Site', enabled: false },
            { id: 'b', name: 'B-Site', enabled: true }
        ]
    },
    {
        id: 'mirage',
        name: 'Mirage',
        sites: [
            { id: 'a', name: 'A-Site', enabled: false },
            { id: 'b', name: 'B-Site', enabled: false }
        ]
    },
    {
        id: 'inferno',
        name: 'Inferno',
        sites: [
            { id: 'a', name: 'A-Site', enabled: false },
            { id: 'b', name: 'B-Site', enabled: false }
        ]
    },
    {
        id: 'nuke',
        name: 'Nuke',
        sites: [
            { id: 'a', name: 'A-Site', enabled: false },
            { id: 'b', name: 'B-Site', enabled: false }
        ]
    },
    {
        id: 'anubis',
        name: 'Anubis',
        sites: [
            { id: 'a', name: 'A-Site', enabled: false },
            { id: 'b', name: 'B-Site', enabled: false }
        ]
    },
    {
        id: 'ancient',
        name: 'Ancient',
        sites: [
            { id: 'a', name: 'A-Site', enabled: false },
            { id: 'b', name: 'B-Site', enabled: false }
        ]
    },
    {
        id: 'vertigo',
        name: 'Vertigo',
        sites: [
            { id: 'a', name: 'A-Site', enabled: false },
            { id: 'b', name: 'B-Site', enabled: false }
        ]
    }
]

export default function MapsPage() {
    return (
        <main className="min-h-screen bg-black text-zinc-100 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <h1 className="text-4xl font-bold tracking-tight text-zinc-100 mb-2">
                        Select Map & Site
                    </h1>
                    <p className="text-zinc-400">
                        Choose a map and site to analyze CT positioning and strategies
                    </p>
                </div>

                {/* Maps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CS2_MAPS.map((map) => (
                        <div
                            key={map.id}
                            className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="w-5 h-5 text-blue-500" />
                                <h2 className="text-xl font-bold text-zinc-100">{map.name}</h2>
                            </div>

                            <div className="space-y-2">
                                {map.sites.map((site) => {
                                    const isEnabled = site.enabled
                                    const href = isEnabled ? `/maps/${map.id}/${site.id}-site` : '#'

                                    return isEnabled ? (
                                        <Link
                                            key={site.id}
                                            href={href}
                                            className="block w-full px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors text-center"
                                        >
                                            {site.name}
                                        </Link>
                                    ) : (
                                        <div
                                            key={site.id}
                                            className="block w-full px-4 py-2 rounded-md bg-zinc-800/50 text-zinc-600 font-medium text-center cursor-not-allowed relative group"
                                        >
                                            {site.name}
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                Coming Soon
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Info Banner */}
                <div className="mt-12 bg-zinc-900/60 border border-zinc-800 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2 animate-pulse"></div>
                        <div>
                            <h3 className="font-bold text-zinc-100 mb-1">Currently Available</h3>
                            <p className="text-sm text-zinc-400">
                                Dust 2 B-Site analysis is live with full journey tracking, equipment analysis, and round filtering.
                                More maps and sites coming soon!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
