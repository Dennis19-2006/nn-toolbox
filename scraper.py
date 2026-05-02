import urllib.request
import re

url = "https://freedium.cfd/https://towardsdatascience.com/hopfield-networks-neural-memory-machines-4c94be821073"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'})

try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    urls = re.findall(r'https://[^"\'<>]+(?:\.gif|\.mp4)', html)
    print("Found direct GIF/MP4 URLs:", len(urls))
    for u in set(urls):
        print(u)
except Exception as e:
    print("Error:", e)
