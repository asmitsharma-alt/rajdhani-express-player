import urllib.request, re, json

req = urllib.request.Request("https://open.spotify.com/playlist/3iYHVXAyUepzzNPKaGn3p1", headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

# Spotify puts track info in <meta property="music:song" content="https://open.spotify.com/track/ID">
track_ids = re.findall(r'music:song" content="https://open.spotify.com/track/([^"]+)"', html)
print(track_ids[:5])
