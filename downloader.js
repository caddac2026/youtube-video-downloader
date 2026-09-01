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

    // FIX: Use Cobalt's official processing endpoint API
    const apiUrl = `https://cobalt.tools`; 

    try {
        if (progressFill) progressFill.style.width = '50%';
        if (progressText) progressText.textContent = '50%';
        if (statusMessage) statusMessage.textContent = 'Fetching download links...';

        // FIX: Reconfigured request body parameters to align with Cobalt API requirements
        const requestBody = {
            url: url,
            vQuality: selectedQuality, 
            isAudioOnly: selectedFormat === 'mp3'
        };

        // If WebM is chosen specifically, configure codec settings if needed, 
        // or let Cobalt handle the default container.
        if (selectedFormat === 'webm') {
            requestBody.vCodec = 'VP9';
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.text || `Server responded with status ${response.status}`);
        }

        const data = await response.json();

        // Cobalt returns 'redirect', 'stream', or 'tunnel' with a URL parameter
        if (data.url) {
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
