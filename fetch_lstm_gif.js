const fs = require('fs');

async function scrape() {
  const res = await fetch("https://readmedium.com/animated-rnn-lstm-and-gru-ef124d06cf45");
  const html = await res.text();
  
  const regex = /<img[^>]+src=["'](https?:\/\/[^"'\s<>]+?(?:\.gif|\.webp|\.mp4))["'][^>]*alt=["'](.*?)["']/gi;
  
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (match[1].includes('.gif')) {
       console.log(`URL: ${match[1]}\nALT: ${match[2]}\n---`);
    }
  }
}
scrape();
