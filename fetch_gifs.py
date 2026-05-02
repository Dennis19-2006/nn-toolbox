import urllib.request
import re

url = "https://towardsdatascience.com/hopfield-networks-neural-memory-machines-4c94be821073/"
html = urllib.request.urlopen(url).read().decode('utf-8')

# Find all medium image URLs ending in .gif
gifs = re.findall(r'https://miro\.medium\.com/[^\s"\'<>]+', html)

filtered = []
for g in gifs:
    if '.gif' in g:
        filtered.append(g)

# Remove duplicates
filtered = list(set(filtered))

for idx, gUrl in enumerate(filtered):
    print(f"[{idx}] {gUrl}")
    urllib.request.urlretrieve(gUrl, f"c:/Users/preet/.gemini/antigravity/scratch/nn_toolbox/frontend/public/hopfield_gif_{idx}.gif")
