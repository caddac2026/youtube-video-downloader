const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create downloads directory
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', port: PORT });
});

/**
 * POST /api/video-info
 * Fetch video information from YouTube
 * Body: { url: string }
 */
app.post('/api/video-info', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Use yt-dlp to extract video info
    const command = `yt-dlp --dump-json --no-warnings "${url}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Error fetching video info:', error);
            return res.status(400).json({ 
                error: 'Failed to fetch video information. Make sure yt-dlp is installed.' 
            });
        }

        try {
            const videoInfo = JSON.parse(stdout);
            
            // Format the response
            const response = {
                success: true,
                id: videoInfo.id,
                title: videoInfo.title,
                channel: videoInfo.uploader || 'Unknown',
                duration: formatDuration(videoInfo.duration),
                views: formatViews(videoInfo.view_count || 0),
                uploadDate: videoInfo.upload_date ? formatDate(videoInfo.upload_date) : 'Unknown',
                thumbnail: videoInfo.thumbnail,
                url: url,
                formats: extractAvailableFormats(videoInfo.formats || [])
            };

            res.json(response);
        } catch (parseError) {
            console.error('Error parsing video info:', parseError);
            res.status(400).json({ error: 'Failed to parse video information' });
        }
    });
});

/**
 * POST /api/download
 * Download video in specified quality and format
 * Body: { url: string, quality: string, format: string }
 */
app.post('/api/download', (req, res) => {
    const { url, quality = 'best', format = 'mp4' } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Generate output filename
    const timestamp = Date.now();
    const outputTemplate = path.join(DOWNLOADS_DIR, `%(title)s_${timestamp}.%(ext)s`);

    // Build yt-dlp command based on quality and format
    let formatString = buildFormatString(quality, format);
    let postProcessorArgs = '';

    if (format === 'mp3') {
        postProcessorArgs = '--extract-audio --audio-format mp3 --audio-quality 192K';
    }

    const command = `yt-dlp -f "${formatString}" ${postProcessorArgs} -o "${outputTemplate}" --no-warnings "${url}"`;

    console.log(`Downloading: ${url} (Quality: ${quality}, Format: ${format})`);

    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error('Download error:', error);
            return res.status(400).json({ 
                error: 'Download failed. Please check the URL and try again.' 
            });
        }

        // Find the downloaded file
        const files = fs.readdirSync(DOWNLOADS_DIR);
        const downloadedFile = files.find(file => 
            file.includes(timestamp) && fs.statSync(path.join(DOWNLOADS_DIR, file)).isFile()
        );

        if (!downloadedFile) {
            return res.status(400).json({ error: 'File download verification failed' });
        }

        const filePath = path.join(DOWNLOADS_DIR, downloadedFile);
        const fileSize = fs.statSync(filePath).size;

        console.log(`Download complete: ${downloadedFile} (${formatFileSize(fileSize)})`);

        // Send file as download
        res.download(filePath, downloadedFile, (err) => {
            if (err) {
                console.error('Error sending file:', err);
            }
            
            // Optional: Delete file after download (comment out to keep files)
            // setTimeout(() => {
            //     fs.unlink(filePath, (unlinkErr) => {
            //         if (unlinkErr) console.error('Error deleting file:', unlinkErr);
            //     });
            // }, 5000);
        });
    });
});

/**
 * POST /api/download-info
 * Get download information without actually downloading
 * Body: { url: string }
 */
app.post('/api/download-info', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    const command = `yt-dlp -F --dump-json --no-warnings "${url}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(400).json({ error: 'Failed to fetch download info' });
        }

        try {
            const videoInfo = JSON.parse(stdout);
            const formats = videoInfo.formats || [];

            // Extract available quality options
            const qualityOptions = extractQualityOptions(formats);

            res.json({
                success: true,
                title: videoInfo.title,
                availableQualities: qualityOptions,
                duration: videoInfo.duration,
                fileSize: estimateFileSize(formats)
            });
        } catch (parseError) {
            res.status(400).json({ error: 'Failed to parse download info' });
        }
    });
});

/**
 * GET /api/downloads
 * List all downloaded files
 */
app.get('/api/downloads', (req, res) => {
    try {
        const files = fs.readdirSync(DOWNLOADS_DIR).map(file => ({
            name: file,
            size: formatFileSize(fs.statSync(path.join(DOWNLOADS_DIR, file)).size),
            date: new Date(fs.statSync(path.join(DOWNLOADS_DIR, file)).mtime).toLocaleString()
        }));

        res.json({ success: true, downloads: files });
    } catch (error) {
        res.status(400).json({ error: 'Failed to list downloads' });
    }
});

/**
 * DELETE /api/downloads/:filename
 * Delete a specific download file
 */
app.delete('/api/downloads/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(DOWNLOADS_DIR, filename);

    // Security: prevent directory traversal
    if (!filePath.startsWith(DOWNLOADS_DIR)) {
        return res.status(400).json({ error: 'Invalid filename' });
    }

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(400).json({ error: 'Failed to delete file' });
        }
        res.json({ success: true, message: 'File deleted' });
    });
});

// Helper functions

/**
 * Build yt-dlp format string based on quality and format
 */
function buildFormatString(quality, format) {
    if (format === 'mp3') {
        return 'bestaudio/best';
    }

    if (quality === 'best') {
        return format === 'webm' ? 'best[ext=webm]' : 'best';
    }

    const heightMatch = quality.match(/(\d+)/);
    if (!heightMatch) return 'best';

    const height = heightMatch[1];

    if (format === 'webm') {
        return `bestvideo[ext=webm][height<=${height}]/best[ext=webm]/bestvideo[height<=${height}]/best`;
    } else {
        return `bestvideo[ext=mp4][height<=${height}]/best[ext=mp4]/bestvideo[height<=${height}]/best`;
    }
}

/**
 * Format duration in seconds to HH:MM:SS
 */
function formatDuration(seconds) {
    if (!seconds) return 'Unknown';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format view count to readable format
 */
function formatViews(views) {
    if (views >= 1_000_000) {
        return `${(views / 1_000_000).toFixed(1)}M views`;
    } else if (views >= 1_000) {
        return `${(views / 1_000).toFixed(1)}K views`;
    }
    return `${views} views`;
}

/**
 * Format date from YYYYMMDD to readable format
 */
function formatDate(dateStr) {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return new Date(`${year}-${month}-${day}`).toLocaleDateString();
}

/**
 * Extract available formats from yt-dlp formats array
 */
function extractAvailableFormats(formats) {
    const qualities = new Set();
    
    formats.forEach(fmt => {
        if (fmt.height) {
            qualities.add(`${fmt.height}p`);
        }
    });

    return Array.from(qualities)
        .filter(q => ['360p', '480p', '720p', '1080p', '2160p'].includes(q))
        .sort((a, b) => {
            const aNum = parseInt(a);
            const bNum = parseInt(b);
            return bNum - aNum;
        });
}

/**
 * Extract quality options for download info endpoint
 */
function extractQualityOptions(formats) {
    const options = [];
    const seen = new Set();

    formats.forEach(fmt => {
        if (fmt.height && !seen.has(fmt.height)) {
            seen.add(fmt.height);
            options.push({
                quality: `${fmt.height}p`,
                formatCode: fmt.format_id,
                ext: fmt.ext
            });
        }
    });

    return options.sort((a, b) => b.quality - a.quality);
}

/**
 * Estimate file size for a video
 */
function estimateFileSize(formats) {
    let maxSize = 0;
    formats.forEach(fmt => {
        if (fmt.filesize && fmt.filesize > maxSize) {
            maxSize = fmt.filesize;
        }
    });
    return maxSize ? formatFileSize(maxSize) : 'Unknown';
}

/**
 * Format bytes to human readable size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         📥 YouTube Video Downloader Backend Server            ║
║                                                               ║
║                  🚀 Server Running on Port ${PORT}              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

✅ API Ready at: http://localhost:${PORT}

📋 Available Endpoints:
  • GET  /api/health              - Check server status
  • POST /api/video-info          - Get video information
  • POST /api/download            - Download video file
  • POST /api/download-info       - Get download options
  • GET  /api/downloads           - List downloaded files
  • DELETE /api/downloads/:file   - Delete a file

📁 Downloads Directory: ${DOWNLOADS_DIR}

⚠️  Requirements:
  • yt-dlp must be installed: pip install yt-dlp
  • FFmpeg must be installed for MP3 conversion

🌐 Frontend: Open index.html in your browser
    The frontend will automatically connect to this server

🛑 To stop the server: Press Ctrl+C
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down server...');
    process.exit(0);
});
