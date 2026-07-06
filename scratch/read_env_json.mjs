import fs from 'fs';

try {
  const envData = JSON.parse(fs.readFileSync('env.json', 'utf16le').replace(/^\uFEFF/, ''));
  console.log("Keys in env.json:");
  envData.forEach(item => {
    // Print Key and a masked Value or just the key
    console.log(`Key: ${item.Key}, Type: ${typeof item.Value}, Value: ${item.Key.includes('KEY') || item.Key.includes('TOKEN') || item.Key.includes('PASSWORD') ? '***' : item.Value}`);
  });
} catch (e) {
  console.error("Error reading env.json:", e);
}
