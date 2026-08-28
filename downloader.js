// State management
let currentVideoData = null;
let selectedQuality = 'best';
let selectedFormat = 'mp4';

// Extract YouTube video ID from URL
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (let pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Validate YouTube URL
function isValidYouTubeUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//.test(url);
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Fetch video information
async function fetchVideoInfo() {
    const url = document.getElementById('youtubeUrl').value.trim();

    if (!url) {
        showError('Please enter a YouTube URL');
        return;
    }

    if (!isValidYouTubeUrl(url)) {
        showError('Please enter a valid YouTube URL');
        return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
        showError('Could not extract video ID from URL');
        return;
    }

    // Show loading state
    const fetchBtn = event.target;
    const spinner = document.getElementById('fetchSpinner');
    fetchBtn.disabled = true;
    spinner.style.display = 'inline-block';

    try {
        // Using YouTube Data API alternative (yt-dlp style approach)
        // For a real implementation, you would need a backend service
        currentVideoData = await getVideoInfo(videoId);

        // Display video info
        document.getElementById('videoThumbnail').src = currentVideoData.thumbnail;
        document.getElementById('videoTitle').textContent = currentVideoData.title;
        document.getElementById('videoChannel').textContent = `Channel: ${currentVideoData.channel}`;
        document.getElementById('videoDuration').textContent = `Duration: ${currentVideoData.duration}`;
        document.getElementById('videoViews').textContent = `Views: ${currentVideoData.views}`;
        document.getElementById('videoUploadDate').textContent = `Uploaded: ${currentVideoData.uploadDate}`;

        document.getElementById('videoInfoSection').style.display = 'block';
    } catch (error) {
        showError(`Error fetching video: ${error.message}`);
    } finally {
        fetchBtn.disabled = false;
        spinner.style.display = 'none';
    }
}

// Mock function to get video info (in real scenario, this would call a backend)
async function getVideoInfo(videoId) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulated video data - in production, this would come from a backend API
            resolve({
                id: videoId,
                title: 'Sample Video Title',
                channel: 'Sample Channel',
                duration: '10:45',
                views: '1.2M',
                uploadDate: '2 weeks ago',
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                formats: [
                    { quality: '1080p', format: 'mp4' },
                    { quality: '720p', format: 'mp4' },
                    { quality: '480p', format: 'mp4' },
                    { quality: '360p', format: 'mp4' },
                    { quality: 'audio', format: 'mp3' }
                ]
            });
        }, 1500);
    });
}

// Select quality
function selectQuality(quality) {
    selectedQuality = quality;

    // Update button states
    document.querySelectorAll('.quality-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

// Update format
function updateFormat(format) {
    selectedFormat = format;
}

// Download video
async function downloadVideo() {
    if (!currentVideoData) {
        showError('Please fetch video info first');
        return;
    }

    const downloadBtn = document.getElementById('downloadBtn');
    const spinner = document.getElementById('downloadSpinner');
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const statusMessage = document.getElementById('statusMessage');

    downloadBtn.disabled = true;
    spinner.style.display = 'inline-block';
    progressSection.style.display = 'block';
    statusMessage.textContent = 'Starting download...';

    try {
        // Simulate download progress
        for (let i = 0; i <= 100; i += Math.random() * 15) {
            progressFill.style.width = Math.min(i, 100) + '%';
            progressText.textContent = Math.min(Math.floor(i), 100) + '%';

            if (Math.min(i, 100) < 30) {
                statusMessage.textContent = 'Fetching video information...';
            } else if (Math.min(i, 100) < 60) {
                statusMessage.textContent = 'Processing video...';
            } else if (Math.min(i, 100) < 90) {
                statusMessage.textContent = 'Converting format...';
            } else {
                statusMessage.textContent = 'Finalizing download...';
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Complete the download
        progressFill.style.width = '100%';
        progressText.textContent = '100%';
        statusMessage.textContent = 'Download complete! Your file is ready.';

        // Simulate file download
        const filename = `${currentVideoData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${selectedFormat === 'mp3' ? 'mp3' : selectedFormat}`;
        simulateDownload(filename, currentVideoData.title);

        // Reset after delay
        setTimeout(() => {
            progressSection.style.display = 'none';
            progressFill.style.width = '0%';
            progressText.textContent = '0%';
            statusMessage.textContent = '';
        }, 2000);

    } catch (error) {
        showError(`Download failed: ${error.message}`);
        statusMessage.textContent = 'Download failed. Please try again.';
    } finally {
        downloadBtn.disabled = false;
        spinner.style.display = 'none';
    }
}

// Simulate file download
function simulateDownload(filename, title) {
    // Create a blob and trigger download
    const link = document.createElement('a');
    link.href = 'data:application/octet-stream;base64,UEsDBBQAAAAIAA=='; // Dummy data
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success notification
    showNotification(`Downloading: ${title}`);
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = '✓ ' + message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add CSS animation for notification
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Allow Enter key to fetch video
document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('youtubeUrl');
    if (urlInput) {
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fetchVideoInfo();
            }
        });
    }
});

// Backend Integration Instructions (for production use)
/*
IMPORTANT: This is a client-side implementation that simulates downloads.
For a production YouTube downloader, you'll need a backend service.

Recommended approaches:

1. Using yt-dlp API (Node.js Backend):
   - Install: npm install yt-dlp-core
   - Create endpoint: POST /api/download
   - Return stream or file URL

2. Using Python Flask Backend:
   - Install: pip install yt-dlp flask
   - Create Flask routes for video info and download
   - Return file as response

3. Using Third-party API:
   - RapidAPI YouTube Downloader
   - YouTube Data API (for info only, not downloads)

Backend example (Node.js with Express):
```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

app.post('/api/download', (req, res) => {
    const { url, quality, format } = req.body;
    
    const outputTemplate = path.join(__dirname, 'downloads', '%(title)s.%(ext)s');
    const qualityArg = quality === 'best' ? 'best' : `bestvideo[height<=${quality}]/best`;
    const formatArg = format === 'mp3' ? 'bestaudio/best' : 'best';
    
    const command = `yt-dlp -f "${formatArg}" -o "${outputTemplate}" "${url}"`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.json({ success: true, file: stdout });
    });
});
```

Legal Notice:
- Respect copyright laws
- Only download content you have permission to
- YouTube ToS may restrict downloads
- Always respect creators' rights
*/
