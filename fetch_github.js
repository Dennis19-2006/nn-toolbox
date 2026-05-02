const fs = require('fs');
async function getGithub() {
  try {
    const res = await fetch("https://api.github.com/repos/ImagineOrange/Hopfield-Network/contents", { headers: {"User-Agent": "node"} });
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.log(e);
  }
}
getGithub();
