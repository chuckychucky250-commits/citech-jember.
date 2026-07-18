import urllib.request, json

url = 'https://nominatim.openstreetmap.org/search.php?q=Kabupaten+Jember&polygon_geojson=1&format=jsonv2'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode('utf-8'))
    for item in data:
        if item.get('class') == 'boundary' and item.get('type') == 'administrative':
            geojson = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {
                            "name": item.get('display_name')
                        },
                        "geometry": item.get('geojson')
                    }
                ]
            }
            with open('frontend/public/data/jember-batas.geojson', 'w') as f:
                json.dump(geojson, f)
            print('Saved geojson successfully.')
            break
except Exception as e:
    print('Error:', e)
