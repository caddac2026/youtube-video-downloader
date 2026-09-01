# Installation & Setup Guide

## 🚀 Quick Start (Choose One Option)

### Option 1: Frontend Only (Browser Demo)
Perfect for testing the UI without backend.

1. **Open the HTML file**
   ```bash
   # Simply open index.html in your web browser
   # File → Open or double-click index.html
   ```

2. **Use the downloader**
   - Paste a YouTube URL
   - Click "Fetch Info"
   - Select quality & format
   - Click "Download" (simulation mode)

---

### Option 2: Full Backend Setup (Real Downloads) ⭐ RECOMMENDED

#### Prerequisites
- **Node.js** 12+ ([Download here](https://nodejs.org/))
- **Python** 3.7+ ([Download here](https://www.python.org/))
- **yt-dlp** (YouTube downloader CLI)
- **FFmpeg** (for audio conversion)

#### Step 1: Install yt-dlp

**macOS:**
```bash
brew install yt-dlp
```

**Ubuntu/Debian:**
```bash
sudo apt-get install yt-dlp
```

**Windows (using Chocolatey):**
```bash
choco install yt-dlp
```

**Or using Python pip:**
```bash
pip install yt-dlp
```

#### Step 2: Install FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**Windows (using Chocolatey):**
```bash
choco install ffmpeg
```

**Verify installation:**
```bash
ffmpeg -version
yt-dlp --version
```

#### Step 3: Setup Node.js Backend

**Clone or download the repository:**
```bash
git clone https://github.com/caddac2026/youtube-video-downloader.git
cd youtube-video-downloader
```

**Install Node dependencies:**
```bash
npm install
```

This installs:
- `express` - Web framework
- `cors` - Cross-origin requests
- `nodemon` - Auto-reload during development

#### Step 4: Start the Backend Server

**Production:**
```bash
npm start
# Or directly:
node server.js
```

**Development (with auto-reload):**
```bash
npm run dev
# Or directly:
nodemon server.js
```

**Expected output:**
```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         📥 YouTube Video Downloader Backend Server            ║
║                                                               ║
║                  🚀 Server Running on Port 3000               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

✅ API Ready at: http://localhost:3000
```

#### Step 5: Open the Frontend

1. Open `index.html` in your web browser
2. The frontend will auto-detect the backend at `http://localhost:3000`
3. Paste a YouTube URL
4. Click "Fetch Info" → Select options → Download

---

## 📋 API Endpoints

The backend server provides these endpoints:

### GET `/api/health`
Check if server is running
```bash
curl http://localhost:3000/api/health
```

### POST `/api/video-info`
Get video information
```bash
curl -X POST http://localhost:3000/api/video-info \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### POST `/api/download`
Download video file
```bash
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "quality": "720p",
    "format": "mp4"
  }'
```

### POST `/api/download-info`
Get available download options
```bash
curl -X POST http://localhost:3000/api/download-info \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### GET `/api/downloads`
List all downloaded files
```bash
curl http://localhost:3000/api/downloads
```

### DELETE `/api/downloads/:filename`
Delete a downloaded file
```bash
curl -X DELETE http://localhost:3000/api/downloads/video_name.mp4
```

---

## 🔧 Troubleshooting

### "yt-dlp: command not found"
**Solution:** Install yt-dlp
```bash
pip install yt-dlp
# Or use your package manager (brew, apt, choco)
```

### "Cannot find module 'express'"
**Solution:** Install Node dependencies
```bash
npm install
```

### "Port 3000 already in use"
**Solution:** Change port in `server.js` or kill existing process

**macOS/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "FFmpeg not found" (for MP3 conversion)
**Solution:** Install FFmpeg
```bash
brew install ffmpeg  # macOS
sudo apt-get install ffmpeg  # Ubuntu
choco install ffmpeg  # Windows
```

### "CORS error" / "Backend not connecting"
**Solution:** Ensure server is running
```bash
# Check if server is running
curl http://localhost:3000/api/health

# Should return:
# {"status":"Server is running","port":3000}
```

### "Download fails silently"
**Solution:** 
1. Check browser console for errors (F12)
2. Check server console for error messages
3. Verify yt-dlp works: `yt-dlp "https://www.youtube.com/watch?v=dQw4w9WgXcQ"`

---

## 📁 Project Structure

```
youtube-video-downloader/
├── index.html           # Frontend UI
├── style.css           # Styling
├── downloader.js       # Frontend JavaScript
├── server.js           # Backend Express server
├── package.json        # Node dependencies
├── .gitignore          # Git ignore rules
├── README.md           # Project documentation
└── downloads/          # Downloaded files (created automatically)
```

---

## 🚀 Deployment

### Deploy to Heroku

1. Create Heroku account: https://www.heroku.com/

2. Install Heroku CLI:
```bash
brew install heroku/brew/heroku  # macOS
# Or download from: https://devcenter.heroku.com/articles/heroku-cli
```

3. Create Procfile:
```bash
echo "web: node server.js" > Procfile
```

4. Create runtime.txt:
```bash
echo "python-3.9.0" > runtime.txt
```

5. Deploy:
```bash
heroku login
heroku create your-app-name
git push heroku main
```

### Deploy to AWS Lambda

Use AWS Lambda with:
- Node.js runtime
- yt-dlp layer
- API Gateway for endpoints

---

## 📝 Configuration

### Change Server Port

Edit `server.js`, line 6:
```javascript
const PORT = 3000;  // Change this
```

### Change Download Directory

Edit `server.js`, line 13:
```javascript
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');  // Change path
```

### Disable File Cleanup

Edit `server.js`, line 103 (uncomment):
```javascript
// setTimeout(() => {
//     fs.unlink(filePath, (unlinkErr) => {...});
// }, 5000);
```

---

## 📚 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 12.x | 16.x or higher |
| Python | 3.7 | 3.9+ |
| RAM | 512MB | 2GB+ |
| Disk Space | 500MB | 5GB+ (for videos) |
| OS | Any | macOS/Linux/Windows |

---

## 🎯 Quick Command Reference

```bash
# Install everything
npm install
pip install yt-dlp
brew install ffmpeg  # macOS only

# Start server
npm start

# Start with auto-reload
npm run dev

# Test backend
curl http://localhost:3000/api/health

# Open frontend
open index.html  # macOS
start index.html  # Windows
xdg-open index.html  # Linux
```

---

## ⚖️ Legal Notice

- ✅ Respect copyright laws
- ✅ Only download content you own or have permission to download
- ✅ Follow YouTube's Terms of Service
- ✅ Always credit content creators
- ❌ Do not use for piracy or copyright infringement

---

## 🆘 Need Help?

1. Check console errors: `F12` → Console tab
2. Check server logs: Look at terminal/console where server runs
3. Open an issue: https://github.com/caddac2026/youtube-video-downloader/issues
4. Verify installations:
   ```bash
   node --version
   python --version
   yt-dlp --version
   ffmpeg -version
   ```

---

**Happy downloading! 🎉**
