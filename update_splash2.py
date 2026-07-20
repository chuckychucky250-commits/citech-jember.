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

svg = f'<svg viewBox="-10 -10 120 120" class="w-[120%] h-[120%] text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] opacity-60" preserveAspectRatio="xMidYMid meet"><path d="{" ".join(paths)}" stroke="currentColor" stroke-width="0.8" fill="rgba(34,211,238,0.05)" /></svg>'

new_splash = f'''    <!-- Splash Screen -->
    <div id="splashScreen" class="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 transition-opacity duration-700 overflow-hidden font-sans">
        
        <!-- Ambient Stars/Particles (Simulated) -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
            <div class="absolute top-[15%] left-[15%] w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_2px_rgba(34,211,238,0.8)]"></div>
            <div class="absolute top-[35%] right-[20%] w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_12px_2px_rgba(96,165,250,0.8)]"></div>
            <div class="absolute bottom-[30%] left-[20%] w-1 h-1 bg-cyan-200 rounded-full shadow-[0_0_8px_2px_rgba(165,243,252,0.8)]"></div>
            <div class="absolute top-[60%] right-[30%] w-1 h-1 bg-amber-200 rounded-full shadow-[0_0_5px_1px_rgba(253,230,138,0.8)]"></div>
            <div class="absolute bottom-[20%] right-[35%] w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_10px_2px_rgba(251,191,36,0.8)]"></div>
            <div class="absolute top-[45%] left-[5%] w-1.5 h-1.5 bg-blue-300 rounded-full shadow-[0_0_8px_2px_rgba(147,197,253,0.8)]"></div>
        </div>

        <!-- Glassmorphism Card -->
        <div class="relative z-10 w-full max-w-[400px] md:max-w-md mx-auto rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-10 shadow-2xl flex flex-col items-center text-center overflow-hidden">
            
            <!-- Jember Map Background inside Card -->
            <div class="absolute inset-0 z-0 pointer-events-none flex items-center justify-center mt-12">
                {svg}
            </div>

            <div class="relative z-10 w-full flex flex-col items-center">
                <!-- Glowing Logo -->
                <div class="w-16 h-16 rounded-full border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] flex items-center justify-center mb-6 bg-slate-900/50 backdrop-blur-sm">
                    <svg class="w-8 h-8 text-cyan-50 drop-shadow-[0_0_5px_rgba(255,255,255,1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>

                <!-- Title -->
                <h1 class="text-4xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight drop-shadow-lg">
                    Arsip Memori<br>Sejarah Jember
                </h1>
                
                <!-- Glow Line -->
                <div class="w-full max-w-[80%] h-[1px] bg-gradient-to-r from-transparent via-cyan-200 to-transparent mb-8 shadow-[0_0_10px_rgba(165,243,252,0.8)] opacity-70"></div>
                
                <!-- Description -->
                <p class="text-gray-300 text-sm md:text-base leading-relaxed mb-10 drop-shadow-sm font-light px-2">
                    Platform interaktif untuk menelusuri, mempelajari, dan turut serta mencatat memori kolektif Kabupaten Jember. Temukan jejak peristiwa sejarah, bencana, dan pergerakan sosial di sekitar Anda.
                </p>

                <!-- Button -->
                <button id="startExploreBtn" class="group relative px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-950 rounded-full font-bold tracking-wide uppercase text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center space-x-3 active:scale-95 w-full sm:w-auto min-w-[220px]">
                    <span>Mulai Jelajahi</span>
                    <div class="w-7 h-7 rounded-full bg-amber-700/20 flex items-center justify-center transition-transform group-hover:translate-x-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </div>
                </button>
            </div>
        </div>
    </div>\n\n'''

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

splash_start = '    <!-- Splash Screen -->\n    <div id="splashScreen"'
splash_end = '    <!-- Onboarding Toast -->'

start_idx = html.find(splash_start)
end_idx = html.find(splash_end)

if start_idx != -1 and end_idx != -1:
    html = html[:start_idx] + new_splash + html[end_idx:]
    with open('frontend/index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Successfully replaced splash screen with new glassmorphism design.")
else:
    print("Could not find start or end index.")
