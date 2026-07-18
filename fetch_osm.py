import urllib.request, json

query = '[out:json];relation["name"~"Kabupaten Jember"]["admin_level"="5"];out geom;'
url = 'https://overpass-api.de/api/interpreter'
req = urllib.request.Request(url, data=query.encode('utf-8'), method='POST')
try:
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode('utf-8'))
    print('Found relations:', len(data.get('elements', [])))
    if len(data.get('elements', [])) > 0:
        rel = data['elements'][0]
        print('Relation ID:', rel['id'])
        
        # Build GeoJSON Polygon from relation members
        coords = []
        for member in rel.get('members', []):
            if member['type'] == 'way' and member['role'] in ['outer', '']:
                way_coords = []
                for node in member['geometry']:
                    way_coords.append([node['lon'], node['lat']])
                coords.append(way_coords)
        
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "name": "Kabupaten Jember"
                    },
                    "geometry": {
                        "type": "MultiLineString",
                        "coordinates": coords
                    }
                }
            ]
        }
        with open('frontend/public/data/jember-batas.geojson', 'w') as f:
            json.dump(geojson, f)
        print('Saved geojson successfully.')
except Exception as e:
    print('Error:', e)
