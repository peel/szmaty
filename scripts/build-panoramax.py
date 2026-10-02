"""Build local photo associations; never run from the visitor's browser.

Only metadata is downloaded. Re-run with a new cache directory to refresh.
Usage: python3 scripts/build-panoramax.py --cache /path/to/cache
"""
import argparse
import concurrent.futures
import datetime
import hashlib
import json
import math
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
API = 'https://api.panoramax.xyz/api'
RADIUS = 100


def distance(lat, lon, coordinates):
    lng2, lat2 = coordinates[:2]
    a = math.sin(math.radians(lat2-lat)/2)**2 + math.cos(math.radians(lat))*math.cos(math.radians(lat2))*math.sin(math.radians(lng2-lon)/2)**2
    return 6371000 * 2 * math.asin(min(1, math.sqrt(a)))


def choose_photo(features, lat, lon):
    candidates = []
    for f in features:
        prop = f.get('properties', {})
        coords = f.get('geometry', {}).get('coordinates', [])
        if len(coords) < 2 or not f.get('collection'):
            continue
        meters = distance(lat, lon, coords)
        if meters > RADIUS:
            continue
        license_link = next((l['href'] for l in f.get('links', []) if l.get('rel') == 'license' and l.get('href', '').startswith('https://')), None)
        image_url = f.get('assets', {}).get('sd', {}).get('href', '')
        if not license_link or not prop.get('geovisio:producer') or not image_url.startswith('https://'):
            continue
        candidates.append((meters, f['id'], {
            'id': f['id'], 'sequence': f['collection'], 'coordinates': coords[:2],
            'distance': round(meters, 1), 'date': prop.get('datetime'),
            'author': prop.get('exif', {}).get('Exif.Image.Artist') or prop['geovisio:producer'], 'license': prop.get('license', 'Licence'),
            'licenseUrl': license_link,
            'imageUrl': image_url,
        }))
    return min(candidates, key=lambda x: (x[0], x[1]))[2] if candidates else None


def fetch_box(box, cache):
    url = API + '/search?' + urllib.parse.urlencode({'bbox': ','.join(f'{v:.7f}' for v in box), 'limit': 1000})
    file = cache / (hashlib.sha256(url.encode()).hexdigest() + '.json')
    if file.exists():
        data = json.loads(file.read_text())
    else:
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'szmaty.peelosophy.com photo-metadata-builder'})
                with urllib.request.urlopen(req, timeout=30) as response:
                    data = json.load(response)
                if not isinstance(data.get('features'), list):
                    raise ValueError('Missing feature list')
                file.write_text(json.dumps(data))
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(2 ** attempt)
        time.sleep(.15)
    features = data['features']
    # This catalog may omit pagination links: subdivide saturated boxes.
    if len(features) >= 1000:
        west, south, east, north = box
        mid = (west + east) / 2
        if east-west < .000001:
            raise ValueError('Photo search remains truncated')
        features = fetch_box((west, south, mid, north), cache) + fetch_box((mid, south, east, north), cache)
    return features


def build(cache):
    cache.mkdir(parents=True, exist_ok=True)
    coordinates = json.loads((ROOT/'pomorskie_punkty.json').read_text())['coordinates']
    electronic = json.loads((ROOT/'elektroodpady_punkty.json').read_text())['points']
    points = [('textiles:'+k, g) for k, g in coordinates.items() if g['status'] != 'unresolved']
    points += [('electronics:'+str(p['id']), p['geo']) for p in electronic]
    groups = {}
    for key, geo in points:
        groups.setdefault((geo['lat'], geo['lon']), []).append(key)

    def lookup(position):
        lat, lon = position
        dy = RADIUS/110000
        dx = dy/math.cos(math.radians(lat))
        return position, choose_photo(fetch_box((lon-dx, lat-dy, lon+dx, lat+dy), cache), lat, lon)

    matches = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        for i, (position, photo) in enumerate(executor.map(lookup, groups), 1):
            for key in groups[position]:
                matches[key] = photo
            if i % 100 == 0:
                print(f'Checked {i}/{len(groups)} positions; {sum(v is not None for v in matches.values())} matches', flush=True)
    result = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'radiusMeters': RADIUS, 'api': API, 'points': dict(sorted(matches.items()))}
    encoded = json.dumps(result, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
    (ROOT/'panoramax_punkty.json').write_text(encoded+'\n')
    html = (ROOT/'index.html').read_text()
    block = '<script id="panoramax-data" type="application/json">'+encoded+'</script>'
    if 'id="panoramax-data"' in html:
        html = re.sub(r'<script id="panoramax-data" type="application/json">.*?</script>', lambda _: block, html, flags=re.S)
    else:
        html = html.replace('<script id="source-data"', block+'\n<script id="source-data"', 1)
    (ROOT/'index.html').write_text(html)
    print(f'Done: {sum(v is not None for v in matches.values())}/{len(matches)} mapped points have photos within {RADIUS} m', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--cache', type=Path, required=True)
    build(parser.parse_args().cache)
