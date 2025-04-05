from flask import Flask, render_template, request, send_file, jsonify
import yt_dlp
import os
import re
from dotenv import load_dotenv
load_dotenv()  # Load before app configuration

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')  # No default value here
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB
print(app.config['SECRET_KEY'])  # Should show your key or None if not set

def sanitize_filename(filename):
    """Combined filename sanitization function"""
    clean = re.sub(r'[\\/*?:"<>|]', "", filename)
    clean = "".join(c for c in clean if c.isalnum() or c in (' ', '.', '_', '-')).rstrip()
    return clean.strip()[:50]

@app.route('/get_thumbnail', methods=['POST'])
def get_thumbnail():
    url = request.form['url']
    try:
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            info = ydl.extract_info(url, download=False)
            return jsonify({
                'thumbnail': info.get('thumbnail'),
                'title': sanitize_filename(info.get('title', 'Untitled')),
                'duration': info.get('duration_string', '0:00')
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/', methods=['GET', 'POST'])
def index():
    """Main endpoint for handling downloads"""
    if request.method == 'POST':
        url = request.form['url']
        format_type = request.form['format_type']
        
        try:
            # Metadata check
            with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
                info = ydl.extract_info(url, download=False)
                if info['duration'] > 3600:
                    raise Exception("Video too long (max 1 hour)")

            # Set download options
            ydl_opts = {
                'outtmpl': f'{sanitize_filename(info["title"])}.%(ext)s',
                'quiet': True,
            }

            if format_type == 'mp3':
                ydl_opts.update({
                    'format': 'bestaudio/best',
                    'postprocessors': [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'mp3',
                        'preferredquality': '192',
                    }]
                })
            else:
                ydl_opts.update({
                    'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
                })

            # Download and process
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)
                if format_type == 'mp3':
                    filename = os.path.splitext(filename)[0] + '.mp3'
                
                clean_filename = sanitize_filename(filename)
                
                # Return file if exists
                if os.path.exists(clean_filename):
                    return send_file(clean_filename, as_attachment=True)
                else:
                    raise Exception("File conversion failed")

        except Exception as e:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify(error=str(e)), 400
            return render_template('index.html', error=str(e))
    
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)