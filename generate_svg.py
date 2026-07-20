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

print('<svg viewBox="-5 -5 110 110" class="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.03] text-gray-900 dark:text-white fill-current" preserveAspectRatio="xMidYMid slice"><path d="' + ' '.join(paths) + '" /></svg>')
