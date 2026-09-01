// Complete YouTube Downloader with Cobalt API Integration
// This version bypasses the local backend and uses Cobalt for downloads

let currentVideoData = null;
let selectedQuality = '720'; // Match default quality strings for Cobalt API
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
        showNotification('Using mock data for visual overview');

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
                thumbnail: `https://youtube.com{videoId}/maxresdefault.jpg`,
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
    // Map standard selections to what Cobalt expects if needed (e.g., '1080p' -> '1080')
    selectedQuality = quality.replace('p', ''); 
    document.querySelectorAll('.quality-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

// Update format
function updateFormat(format) {
    selectedFormat = format;
}

// Download video using Cobalt public API
async function downloadVideo() {
    const url = document.getElementById('youtubeUrl').value.trim();
    if (!url) {
        showError('Please enter a valid YouTube URL first!');
        return;
    }

    const downloadBtn = document.getElementById('downloadBtn');
    const spinner = document.getElementById('downloadSpinner');
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const statusMessage = document.getElementById('statusMessage');

    downloadBtn.disabled = true;
    if (spinner) spinner.style.display = 'inline-block';
    if (progressSection) progressSection.style.display = 'block';
    
    if (progressFill) progressFill.style.width = '20%';
    if (progressText) progressText.textContent = '20%';
    if (statusMessage) statusMessage.textContent = 'Connecting to download server...';

    const apiUrl = `https://cobalt.tools`; 

    try {
        if (progressFill) progressFill.style.width = '50%';
        if (progressText) progressText.textContent = '50%';
        if (statusMessage) statusMessage.textContent = 'Fetching download links...';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                videoQuality: selectedQuality, 
                downloadMode: selectedFormat === 'mp3' ? 'audio' : 'default'
            })
        });

        const data = await response.json();

        if (data.status === 'stream' || data.url) {
            if (progressFill) progressFill.style.width = '90%';
            if (progressText) progressText.textContent = '90%';
            if (statusMessage) statusMessage.textContent = 'Starting browser download...';

            // Direct the browser to seamlessly trigger the file download
            const downloadUrl = data.url;
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = ''; 
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            if (progressFill) progressFill.style.width = '100%';
            if (progressText) progressText.textContent = '100%';
            if (statusMessage) statusMessage.textContent = '✓ Download Started!';
            showNotification('Download triggered successfully!');

            setTimeout(() => {
                if (progressSection) progressSection.style.display = 'none';
                if (progressFill) progressFill.style.width = '0%';
                if (progressText) progressText.textContent = '0%';
                if (statusMessage) statusMessage.textContent = '';
            }, 3000);
        } else {
            throw new Error(data.text || 'Failed to fetch downloadable stream.');
        }

    } catch (error) {
        console.error('Download error:', error);
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = '0%';
        if (statusMessage) statusMessage.textContent = 'Download failed.';
        showError('Error downloading: ' + error.message);
    } finally {
        downloadBtn.disabled = false;
        if (spinner) spinner.style.display = 'none';
    }
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

console.log('YouTube Downloader Ready (Cobalt API Integration)');
