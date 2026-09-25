import urllib.request
import re

url = 'https://maou.audio/bgm_neorock81/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
    mp3s = re.findall(r'https?://[^\s"\'<>]+\.mp3', html)
    print("Found MP3s:", mp3s)
except Exception as e:
    print("Error:", e)
