# 📥 YouTube Video Downloader

A web-based YouTube video downloader application built with HTML, CSS, and JavaScript. Download videos in multiple qualities and formats directly from YouTube links.

## ✨ Features

- ✅ **Multiple Quality Options** - Download in 1080p, 720p, 480p, 360p, or audio-only
- ✅ **Multiple Formats** - MP4, WebM for video; MP3 for audio
- ✅ **Video Information Display** - Shows title, channel, duration, views, and upload date
- ✅ **Real-time Progress Tracking** - Visual progress bar during download
- ✅ **No Registration Required** - Start downloading immediately
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **URL Validation** - Supports various YouTube URL formats

## 🚀 Quick Start

### Option 1: Direct Browser Access (Simplified Demo)
1. Clone or download this repository
2. Open `index.html` in your web browser
3. Paste a YouTube URL
4. Click "Fetch Info"
5. Select quality and format
6. Click "Download"

### Option 2: With Backend Service (Full Functionality)

#### Prerequisites
- Python 3.7+
- Node.js 12+ (optional, for JavaScript backend)
- yt-dlp package

#### Installation

**Step 1: Clone the repository**
```bash
git clone https://github.com/caddac2026/youtube-video-downloader.git
cd youtube-video-downloader
```

**Step 2: Install Python dependencies**
```bash
pip install yt-dlp flask flask-cors
```

**Step 3: Create a backend server**

Create a file named `server.py`:

```python
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp
import os
from pathlib import Path

app = Flask(__name__)
CORS(app)

DOWNLOAD_FOLDER = 'downloads'
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

@app.route('/api/video-info', methods=['POST'])
def get_video_info():
    """Fetch video information from YouTube"""
    try:
        url = request.json.get('url')
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            return jsonify({
                'success': True,
                'title': info.get('title'),
                'channel': info.get('uploader'),
                'duration': format_duration(info.get('duration', 0)),
                'views': format_views(info.get('view_count', 0)),
                'uploadDate': info.get('upload_date', 'Unknown'),
                'thumbnail': info.get('thumbnail'),
                'formats': get_available_formats(info.get('formats', []))
            })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/download', methods=['POST'])
def download_video():
    """Download video in specified quality and format"""
    try:
        url = request.json.get('url')
        quality = request.json.get('quality', 'best')
        format_type = request.json.get('format', 'mp4')
        
        ydl_opts = {
            'format': get_format_string(quality, format_type),
            'outtmpl': os.path.join(DOWNLOAD_FOLDER, '%(title)s.%(ext)s'),
            'quiet': False,
            'no_warnings': False,
        }
        
        # Handle audio conversion
        if format_type == 'mp3':
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }]
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            
            return jsonify({
                'success': True,
                'message': 'Download completed successfully',
                'filename': os.path.basename(filename)
            })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

def format_duration(seconds):
    """Convert seconds to human readable format"""
    if not seconds:
        return 'Unknown'
    mins, secs = divmod(int(seconds), 60)
    hours, mins = divmod(mins, 60)
    if hours:
        return f"{hours}:{mins:02d}:{secs:02d}"
    return f"{mins}:{secs:02d}"

def format_views(views):
    """Format view count"""
    if views >= 1_000_000:
        return f"{views/1_000_000:.1f}M"
    elif views >= 1_000:
        return f"{views/1_000:.1f}K"
    return str(views)

def get_available_formats(formats):
    """Extract available formats from video"""
    available = set()
    for fmt in formats:
        if fmt.get('height'):
            available.add(f"{fmt['height']}p")
    return sorted(list(available), reverse=True)

def get_format_string(quality, format_type):
    """Generate yt-dlp format string"""
    if format_type == 'mp3':
        return 'bestaudio/best'
    elif format_type == 'webm':
        if quality == 'best':
            return 'best[ext=webm]'
        return f'best[ext=webm][height<={quality.replace("p", "")}]'
    else:  # mp4
        if quality == 'best':
            return 'best'
        return f'best[height<={quality.replace("p", "")}]'

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=5000)
```

**Step 4: Run the backend server**
```bash
python server.py
```

**Step 5: Update JavaScript to use backend**

Edit `downloader.js` and uncomment the backend integration section:

```javascript
// Replace the mock getVideoInfo function with:
async function fetchVideoInfo() {
    const url = document.getElementById('youtubeUrl').value.trim();
    
    if (!url || !isValidYouTubeUrl(url)) {
        showError('Please enter a valid YouTube URL');
        return;
    }

    const fetchBtn = event.target;
    const spinner = document.getElementById('fetchSpinner');
    fetchBtn.disabled = true;
    spinner.style.display = 'inline-block';

    try {
        const response = await fetch('http://localhost:5000/api/video-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        if (data.success) {
            currentVideoData = data;
            // Display video info...
            document.getElementById('videoInfoSection').style.display = 'block';
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError(`Error: ${error.message}`);
    } finally {
        fetchBtn.disabled = false;
        spinner.style.display = 'none';
    }
}
```

## 📋 Supported URL Formats

The downloader accepts various YouTube URL formats:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/v/VIDEO_ID`

## ⚙️ Configuration

### Environment Variables (for backend)

Create a `.env` file:

```
FLASK_ENV=production
DOWNLOAD_FOLDER=downloads
MAX_FILE_SIZE=5000  # MB
ALLOWED_FORMATS=mp4,mp3,webm
```

### Quality Settings

The downloader supports:
- **1080p** - Full HD
- **720p** - HD
- **480p** - SD
- **360p** - Low quality
- **Audio Only** - MP3 format

## 🔧 Troubleshooting

### Issue: "Could not extract video ID"
**Solution:** Ensure the URL is a valid YouTube link

### Issue: Download fails with permission error
**Solution:** Check that the `downloads` folder has write permissions
```bash
chmod -R 755 downloads
```

### Issue: FFmpeg error when converting to MP3
**Solution:** Install FFmpeg
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
choco install ffmpeg
```

### Issue: CORS errors
**Solution:** Ensure Flask has CORS enabled in `server.py`
```python
from flask_cors import CORS
CORS(app)
```

## 📦 Deployment

### Deploy to Heroku

1. Create `Procfile`:
```
web: python server.py
```

2. Create `requirements.txt`:
```bash
pip freeze > requirements.txt
```

3. Deploy:
```bash
heroku create your-app-name
git push heroku main
```

### Deploy to AWS Lambda

Use AWS Lambda with the yt-dlp layer and API Gateway

## ⚖️ Legal & Terms of Service

**Important:** 
- Respect copyright laws and YouTube's Terms of Service
- Only download content you have permission to download
- YouTube's ToS may restrict video downloads
- Always respect content creators' rights
- Use responsibly and ethically

## 🔒 Privacy & Security

- No tracking or data collection
- Videos are downloaded directly to your device
- No account or sign-up required
- All processing happens locally or on your server

## 💡 Tips & Tricks

1. **Batch Downloading**: Modify the backend to accept playlist URLs
2. **Subtitle Support**: Add subtitle extraction with yt-dlp
3. **Video Conversion**: Use FFmpeg for additional format conversions
4. **Schedule Downloads**: Use cron jobs to schedule automatic downloads

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This tool is provided for educational purposes. Users are responsible for ensuring they have the legal right to download content from YouTube. The developers are not liable for misuse or copyright infringement.

## 🆘 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the FAQ section in the HTML file

## 📚 Resources

- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [FFmpeg Guide](https://ffmpeg.org/)
- [Flask Documentation](https://flask.palletsprojects.com/)

---

**Made with ❤️ by caddac2026**
