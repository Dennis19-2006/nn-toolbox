const { chromium } = require('playwright');
const fs = require('fs');
const https = require('https');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log("Navigating...");
  await page.goto('https://towardsdatascience.com/hopfield-networks-neural-memory-machines-4c94be821073/', { waitUntil: 'domcontentloaded' });
  
  console.log("Waiting for images...");
  await page.waitForTimeout(5000);
  
  console.log("Scrolling...");
  // Medium lazy loads images on scroll. Scroll down a bit
  await page.evaluate(() => window.scrollTo(0, 3000));
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollTo(0, 6000));
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);
  
  // Find all images and their src
  const imgUrls = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map(img => img.src || "");
  });
  
  let targetUrl = "";
  // In the article, the gif is an image that actually resolves to a .gif
  for(let u of imgUrls) {
      if(u.includes('miro.medium.com') && u.includes('gif')) {
          targetUrl = u;
          break;
      }
      // If Medium serves it transparently as webp but names it gif?
      if(u.includes('miro.medium.com') && (u.includes('webp') || u.includes('png') || u.includes('gif'))) {
          console.log("Found image candidate:", u);
      }
  }
  
  console.log("Finished scraping. Found candidates.");
  
  // Actually Medium serves GIFs through an <source> element or just uses .gif in URL
  const sources = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('source')).map(s => s.srcset).concat(Array.from(document.querySelectorAll('img')).map(i => i.src));
  });
  
  let finalUrl = "";
  for (let s of sources) {
      if(s && (s.toLowerCase().includes('.gif') || s.toLowerCase().includes('format:gif'))) {
          finalUrl = s;
      }
  }
  if (!finalUrl) {
      // Just print all unique miro sources
      fs.writeFileSync('medium_sources_dump.json', JSON.stringify([...new Set(sources)], null, 2));
      console.log("No specific gif format found. Dumped to json.");
  } else {
      console.log("FOUND GIF URL: ", finalUrl);
  }

  await browser.close();
})();
