const { app, desktopCapturer, screen } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    
    // Give QuickDo a couple seconds to fully render
    await new Promise(resolve => setTimeout(resolve, 2000));

    const sources = await desktopCapturer.getSources({ 
      types: ['screen'], 
      thumbnailSize: { width, height } 
    });
    
    // Create artifacts directory
    const artifactDir = 'C:\\Users\\MRUNMAYEE\\.gemini\\antigravity\\brain\\4b91654b-2e21-4709-84e5-e5fcbe9272c1\\artifacts';
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
    
    const imagePath = path.join(artifactDir, 'hud_pill_preview.png');
    fs.writeFileSync(imagePath, sources[0].thumbnail.toPNG());
    console.log(`Saved screenshot to ${imagePath}`);
  } catch (err) {
    console.error(err);
  } finally {
    app.quit();
  }
});
