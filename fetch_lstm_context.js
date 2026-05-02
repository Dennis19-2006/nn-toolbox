const fs = require('fs');

async function scrape() {
  const res = await fetch("https://readmedium.com/animated-rnn-lstm-and-gru-ef124d06cf45");
  const html = await res.text();
  
  // Split HTML into blocks or find index of each gif to see surrounding text
  const regex = /https?:\/\/[^"'\s<>]+?(?:\.gif|\.webp|\.mp4)/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
      let url = match[0];
      if (url.includes('.gif')) {
          let start = Math.max(0, match.index - 300);
          let end = Math.min(html.length, match.index + 300);
          console.log(`URL: ${url}`);
          console.log(`CONTEXT: ${html.substring(start, end).replace(/\n/g, ' ')}`);
          console.log("-------------------");
      }
  }
}
scrape();
