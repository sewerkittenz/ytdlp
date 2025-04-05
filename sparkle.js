document.addEventListener('DOMContentLoaded', () => {
    // Sparkle button effects
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseover', createSparkles);
    });

    // URL input handling
    const urlInput = document.querySelector('input[name="url"]');
    if (urlInput) {
        urlInput.addEventListener('input', handleURLInput);
    }    

    // Form submission
    const form = document.querySelector('form');
if (form) {
    form.addEventListener('submit', handleSubmit);
}

function createSparkles(e) {
    const sparkles = document.createElement('div');
    sparkles.className = 'sparkles';
    
    for (let i = 0; i < 8; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        spark.style.left = `${Math.random() * 100}%`;
        spark.style.top = `${Math.random() * 100}%`;
        sparkles.appendChild(spark);
    }

    e.target.appendChild(sparkles);
    setTimeout(() => sparkles.remove(), 1000);
}

async function handleURLInput(e) {
    const url = e.target.value;
    if (!url.includes('youtube.com/') && !url.includes('youtu.be/')) return;

    try {
        const response = await fetch('/get_thumbnail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: `url=${encodeURIComponent(url)}`
        });
        
        const data = await response.json();
        if (data.thumbnail) {
            document.getElementById('videoPreview').style.display = 'block';
            document.getElementById('thumbnail').src = data.thumbnail;
            document.getElementById('videoTitle').textContent = data.title;
            document.getElementById('videoDuration').textContent = `🕒 ${data.duration}`;
        }
    } catch (error) {
        console.error('Preview error:', error);
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    document.getElementById('loading').style.display = 'block';
    
    try {
        const response = await fetch('/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json' // Explicitly accept JSON
            }
        });

        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Unknown error');
            }
        } else if (contentType && contentType.includes('video') || contentType.includes('audio')) {
            // Handle file download
            const blob = await response.blob();
            const filename = response.headers.get('Content-Disposition').split('filename=')[1].replace(/"/g, '');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            throw new Error('Unexpected response type');
        }
    } catch (error) {
        showError(error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function showError(message) {
    const errorBubble = document.createElement('div');
    errorBubble.className = 'error-bubble';
    errorBubble.innerHTML = `🐰💔 ${message}`;
    document.querySelector('.container').appendChild(errorBubble);
    setTimeout(() => errorBubble.remove(), 5000);
}
