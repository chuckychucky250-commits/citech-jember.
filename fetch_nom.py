import urllib.request, json

url = 'https://nominatim.openstreetmap.org/search.php?q=Kabupaten+Jember&polygon_geojson=1&format=jsonv2'
req = urllib.request.Request(url, headers={'User-Agent': 'Antigravity-CITECH-Project/1.0 (test@example.com)'})
try:
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    if data and 'geojson' in data[0]:
        feature = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": "Kabupaten Jember"},
                "geometry": data[0]['geojson']
            }]
        }
        with open('frontend/public/data/jember-batas.geojson', 'w', encoding='utf-8') as f:
            json.dump(feature, f)
        print("Success")
    else:
        print("No geojson found")
except Exception as e:
    print("Error:", e)
