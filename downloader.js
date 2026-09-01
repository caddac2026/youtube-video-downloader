// Complete YouTube Downloader with Backend Integration
// This version works with a Node.js/Express backend using yt-dlp

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

// Show success notification
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
        font-weight: bold;
    `;
    notification.textContent = '✓ ' + message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
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
        // Try to fetch from backend first
        try {
            const response = await fetch('http://localhost:3000/api/video-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (response.ok) {
                const data = await response.json();
                currentVideoData = data;
                displayVideoInfo(data);
                document.getElementById('videoInfoSection').style.display = 'block';
                return;
            }
        } catch (backendError) {
            console.log('Backend not available, using mock data');
        }

        // Fallback to mock data if backend is not available
        currentVideoData = await getMockVideoInfo(videoId);
        displayVideoInfo(currentVideoData);
        document.getElementById('videoInfoSection').style.display = 'block';
        showNotification('Using mock data (backend not running)');

    } catch (error) {
        showError(`Error fetching video: ${error.message}`);
    } finally {
        fetchBtn.disabled = false;
        spinner.style.display = 'none';
    }
}

// Display video information
function displayVideoInfo(data) {
    document.getElementById('videoThumbnail').src = data.thumbnail;
    document.getElementById('videoTitle').textContent = data.title;
    document.getElementById('videoChannel').textContent = `Channel: ${data.channel}`;
    document.getElementById('videoDuration').textContent = `Duration: ${data.duration}`;
    document.getElementById('videoViews').textContent = `Views: ${data.views}`;
    document.getElementById('videoUploadDate').textContent = `Uploaded: ${data.uploadDate}`;
}

// Mock function to get video info
async function getMockVideoInfo(videoId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: videoId,
                title: 'Sample YouTube Video',
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
        }, 1000);
    });
}

// Select quality
function selectQuality(quality) {
    selectedQuality = quality;
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

    const url = document.getElementById('youtubeUrl').value.trim();
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
        // Try backend first
        try {
            const response = await fetch('http://localhost:3000/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: url,
                    quality: selectedQuality,
                    format: selectedFormat
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const filename = `${currentVideoData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${selectedFormat}`;
                
                // Create download link
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);

                progressFill.style.width = '100%';
                progressText.textContent = '100%';
                statusMessage.textContent = '✓ Download complete!';
                showNotification(`Successfully downloaded: ${currentVideoData.title}`);

                setTimeout(() => {
                    progressSection.style.display = 'none';
                    progressFill.style.width = '0%';
                    progressText.textContent = '0%';
                    statusMessage.textContent = '';
                }, 2000);
                return;
            }
        } catch (backendError) {
            console.log('Backend error, using simulation:', backendError);
        }

        // Fallback to simulation
        simulateDownload();

    } catch (error) {
        showError(`Download failed: ${error.message}`);
        statusMessage.textContent = 'Download failed. Please try again.';
    } finally {
        downloadBtn.disabled = false;
        spinner.style.display = 'none';
    }
}

// Simulate download progress
async function simulateDownload() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const statusMessage = document.getElementById('statusMessage');

    for (let i = 0; i <= 100; i += Math.random() * 15) {
        const progress = Math.min(i, 100);
        progressFill.style.width = progress + '%';
        progressText.textContent = Math.floor(progress) + '%';

        if (progress < 30) {
            statusMessage.textContent = 'Fetching video information...';
        } else if (progress < 60) {
            statusMessage.textContent = 'Downloading video...';
        } else if (progress < 90) {
            statusMessage.textContent = 'Converting format...';
        } else {
            statusMessage.textContent = 'Finalizing...';
        }

        await new Promise(resolve => setTimeout(resolve, 300));
    }

    progressText.textContent = '100%';
    statusMessage.textContent = '✓ Download simulation complete (Backend not running)';
    showNotification('Install backend to enable real downloads');

    setTimeout(() => {
        document.getElementById('progressSection').style.display = 'none';
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
        statusMessage.textContent = '';
    }, 2000);
}

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

// Add animation styles
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

console.log('YouTube Downloader Ready');
console.log('To enable real downloads, start the backend server:');
console.log('1. npm install yt-dlp express cors');
console.log('2. node server.js');
console.log('Server will run on http://localhost:3000');
