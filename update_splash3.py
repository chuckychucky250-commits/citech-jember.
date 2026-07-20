import json
import re

with open('frontend/public/data/jember-batas.geojson') as f:
    data = json.load(f)

geom = data['features'][0]['geometry']
coords = geom['coordinates']
if geom['type'] != 'MultiPolygon':
    coords = [coords]

min_x = min_y = float('inf')
max_x = max_y = float('-inf')

for p in coords:
    for r in p:
        for x,y in r: 
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)

w = max_x - min_x
h = max_y - min_y
s = 100 / max(w,h)

paths = []
for p in coords:
    for r in p:
        ps = []
        for i, (x,y) in enumerate(r): 
            sx = (x - min_x) * s
            sy = (max_y - y) * s
            cmd = 'M' if i == 0 else 'L'
            ps.append(f'{cmd}{sx:.2f},{sy:.2f}')
        paths.append(' '.join(ps) + ' Z')

svg = f"""<svg viewBox="-20 -20 140 140" class="w-[150%] h-[150%] md:w-[130%] md:h-[130%] opacity-70 animate-fade-in-up delay-200" preserveAspectRatio="xMidYMid meet">
    <defs>
        <linearGradient id="hologramGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(34,211,238,0.5)" />
            <stop offset="50%" stop-color="rgba(56,189,248,0.2)" />
            <stop offset="100%" stop-color="rgba(14,165,233,0.0)" />
        </linearGradient>
        <filter id="hologramGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
    </defs>
    <path d="{" ".join(paths)}" fill="url(#hologramGradient)" stroke="rgba(34,211,238,0.6)" stroke-width="0.3" filter="url(#hologramGlow)" />
</svg>"""

new_splash = f'''    <!-- Splash Screen -->
    <style>
        @keyframes fadeInUp {{
            from {{ opacity: 0; transform: translateY(30px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}
        .animate-fade-in-up {{
            animation: fadeInUp 0.8s ease-out forwards;
            opacity: 0;
        }}
        .delay-100 {{ animation-delay: 0.1s; }}
        .delay-200 {{ animation-delay: 0.2s; }}
        .delay-300 {{ animation-delay: 0.3s; }}
        .delay-400 {{ animation-delay: 0.4s; }}
    </style>
    <div id="splashScreen" class="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 transition-opacity duration-700 overflow-hidden font-sans">
        
        <!-- Ambient Stars/Particles (Simulated) -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
            <div class="absolute top-[15%] left-[15%] w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_2px_rgba(34,211,238,0.8)] animate-pulse"></div>
            <div class="absolute top-[35%] right-[20%] w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_12px_2px_rgba(96,165,250,0.8)]"></div>
            <div class="absolute bottom-[30%] left-[20%] w-1 h-1 bg-cyan-200 rounded-full shadow-[0_0_8px_2px_rgba(165,243,252,0.8)]"></div>
            <div class="absolute top-[60%] right-[30%] w-1 h-1 bg-amber-200 rounded-full shadow-[0_0_5px_1px_rgba(253,230,138,0.8)] animate-pulse"></div>
            <div class="absolute bottom-[20%] right-[35%] w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_10px_2px_rgba(251,191,36,0.8)]"></div>
            <div class="absolute top-[45%] left-[5%] w-1.5 h-1.5 bg-blue-300 rounded-full shadow-[0_0_8px_2px_rgba(147,197,253,0.8)]"></div>
        </div>

        <!-- Content Container (No Box) -->
        <div class="relative z-10 w-full max-w-[400px] md:max-w-md mx-auto flex flex-col items-center text-center">
            
            <!-- Jember Map Background -->
            <div class="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
                {svg}
            </div>

            <div class="relative z-10 w-full flex flex-col items-center mt-8">
                <!-- Title -->
                <h1 class="text-4xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight drop-shadow-lg animate-fade-in-up delay-100">
                    Arsip Memori<br>Sejarah Jember
                </h1>
                
                <!-- Glow Line -->
                <div class="w-full max-w-[80%] h-[1px] bg-gradient-to-r from-transparent via-cyan-200 to-transparent mb-8 shadow-[0_0_10px_rgba(165,243,252,0.8)] opacity-70 animate-fade-in-up delay-200"></div>
                
                <!-- Description -->
                <p class="text-gray-300 text-sm md:text-base leading-relaxed mb-10 drop-shadow-sm font-light px-2 animate-fade-in-up delay-300">
                    Platform interaktif untuk menelusuri, mempelajari, dan turut serta mencatat memori kolektif Kabupaten Jember. Temukan jejak peristiwa sejarah, bencana, dan pergerakan sosial di sekitar Anda.
                </p>

                <!-- Button -->
                <div class="animate-fade-in-up delay-400 w-full sm:w-auto">
                    <button id="startExploreBtn" class="group relative px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-950 rounded-full font-bold tracking-wide uppercase text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center space-x-3 active:scale-95 w-full sm:w-auto min-w-[220px]">
                        <span>Mulai Jelajahi</span>
                        <div class="w-7 h-7 rounded-full bg-amber-700/20 flex items-center justify-center transition-transform group-hover:translate-x-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </div>\n\n'''

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

splash_start = '    <!-- Splash Screen -->'
splash_end = '    <!-- Onboarding Toast -->'

start_idx = html.find(splash_start)
end_idx = html.find(splash_end)

if start_idx != -1 and end_idx != -1:
    html = html[:start_idx] + new_splash + html[end_idx:]
    with open('frontend/index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Successfully removed box, globe icon, and added fade-in-up animations.")
else:
    print("Could not find start or end index.")
