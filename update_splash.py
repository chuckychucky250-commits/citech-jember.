import json

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

svg = '<div class="absolute inset-0 z-0 pointer-events-none flex items-center justify-center p-8"><svg viewBox="-5 -5 110 110" class="w-full h-full opacity-10 dark:opacity-[0.03] text-gray-900 dark:text-white fill-current drop-shadow-xl" preserveAspectRatio="xMidYMid meet"><path d="' + ' '.join(paths) + '" /></svg></div>'

import re
with open('frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace splash screen content
splash_start = '    <!-- Splash Screen -->\n    <div id="splashScreen" class="fixed inset-0 z-[9999]'
splash_end = '    <!-- Onboarding Toast -->'

start_idx = html.find(splash_start)
end_idx = html.find(splash_end)

if start_idx != -1 and end_idx != -1:
    new_splash = f'''    <!-- Splash Screen -->
    <div id="splashScreen" class="fixed inset-0 z-[9999] bg-white/85 dark:bg-gray-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 transition-opacity duration-700 overflow-hidden">
      
      <!-- Faint Map of Jember SVG -->
      {svg}

      <!-- Content -->
      <div class="text-center max-w-2xl relative z-10 px-4">
        <!-- Logo -->
        <div class="w-24 h-24 bg-blue-600 dark:bg-blue-600 rounded-full mx-auto mb-8 flex items-center justify-center shadow-md border-4 border-white/50 dark:border-gray-900/50 outline outline-1 outline-blue-300 dark:outline-blue-700">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        
        <!-- Typography -->
        <h1 class="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-6 tracking-tight drop-shadow-sm">
          Arsip Memori Sejarah Jember
        </h1>
        
        <div class="w-24 h-1 bg-amber-500 rounded-full mx-auto mb-6"></div>
        
        <p class="text-gray-700 dark:text-gray-300 mb-12 text-base md:text-lg leading-relaxed max-w-xl mx-auto font-serif drop-shadow-sm">
          Platform interaktif untuk menelusuri, mempelajari, dan turut serta mencatat memori kolektif Kabupaten Jember. Temukan jejak peristiwa sejarah, bencana, dan pergerakan sosial di sekitar Anda.
        </p>
        
        <!-- Action Button -->
        <button id="startExploreBtn" class="px-10 py-4 bg-gray-900 dark:bg-amber-500 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-amber-400 rounded-xl font-serif tracking-widest uppercase text-sm transition-all w-full sm:w-auto inline-flex items-center justify-center mx-auto space-x-3 shadow-lg hover:shadow-xl">
          <span>Mulai Jelajahi</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </button>
      </div>
    </div>\n\n'''
    html = html[:start_idx] + new_splash + html[end_idx:]
    with open('frontend/index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Successfully replaced splash screen.")
else:
    print("Could not find start or end index.")
