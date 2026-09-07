import telebot
from flask import Flask, jsonify, request
from flask_cors import CORS

BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"  # BotFather থেকে পাওয়া টোকেন
bot = telebot.TeleBot(BOT_TOKEN)

app = Flask(__name__)
CORS(app)

# মেমোরিতে গান সেভ রাখার লিস্ট (স্থায়ী করতে JSON বা Database ব্যবহার করতে পারো)
song_database = []

@bot.channel_post_handler(content_types=['audio'])
def handle_audio(message):
    audio = message.audio
    file_id = audio.file_id
    
    # টেলিগ্রাম থেকে ডিরেক্ট স্ট্রিম লিঙ্ক তৈরি
    file_info = bot.get_file(file_id)
    stream_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_info.file_path}"
    
    # ক্যাপশন ফরম্যাট: Artist | Album | Year
    caption = message.caption or ""
    parts = [p.strip() for p in caption.split("|")]
    
    artist = parts[0] if len(parts) > 0 and parts[0] else (audio.performer or "Unknown Artist")
    album = parts[1] if len(parts) > 1 and parts[1] else "Single"
    year = parts[2] if len(parts) > 2 and parts[2] else "2024"
    title = audio.title or audio.file_name or "Untitled Track"

    song_data = {
        "id": len(song_database) + 1,
        "title": title,
        "artist": artist,
        "album": album,
        "year": year,
        "url": stream_url
    }
    
    # নতুন গান তালিকায় যোগ করা
    song_database.insert(0, song_data)
    print(f"Added: {title}")

# ওয়েবসাইটের জন্য API রুট
@app.route('/api/songs', methods=['GET'])
def get_songs():
    return jsonify(song_database)

if __name__ == '__main__':
    import threading
    # বটকে আলাদা থ্রেডে চালানো যেন ব্যাকএন্ড একই সাথে কাজ করে
    threading.Thread(target=bot.infinity_polling, daemon=True).start()
    app.run(host='0.0.0.0', port=5000)
