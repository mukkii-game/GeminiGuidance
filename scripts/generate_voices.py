import asyncio
import edge_tts
import os

VOICES = [
    # Stage Titles (No "一面" - just the title as requested)
    {
        "filename": "voice_stage1.mp3",
        "text": "チャイナ・シンドローム",
        "voice": "ja-JP-KeitaNeural",
        "rate": "+0%",
        "pitch": "+0Hz"
    },
    {
        "filename": "voice_stage2.mp3",
        "text": "イーロンズ・ゲート",
        "voice": "ja-JP-KeitaNeural",
        "rate": "+0%",
        "pitch": "+0Hz"
    },
    {
        "filename": "voice_stage3.mp3",
        "text": "ザ・ファブル",
        "voice": "ja-JP-KeitaNeural",
        "rate": "+0%",
        "pitch": "+0Hz"
    },
    {
        "filename": "voice_stage4.mp3",
        "text": "魔法使いチャッピー",
        "voice": "ja-JP-NanamiNeural",
        "rate": "+5%",
        "pitch": "+2Hz"
    },

    # Stage 2 Intro: Emperor Elon (Deep menacing pitch)
    {
        "filename": "voice_elon_intro.mp3",
        "text": "わしは、宇宙の帝王、イーロン。",
        "voice": "ja-JP-KeitaNeural",
        "rate": "-10%",
        "pitch": "-14Hz"
    },

    # Stage 1 Boss: China Syndrome (Separating "サンダークラウド" and "フォーメーション" clearly!)
    {
        "filename": "voice_boss1.mp3",
        "text": "雷雲旋風拳！　サンダークラウド……フォーメーション！",
        "voice": "ja-JP-KeitaNeural",
        "rate": "+5%",
        "pitch": "+0Hz"
    },

    # Stage 2 Boss: Elon's Gate
    {
        "filename": "voice_boss2.mp3",
        "text": "スペース・エックス！",
        "voice": "ja-JP-KeitaNeural",
        "rate": "+5%",
        "pitch": "-6Hz"
    },

    # Stage 3 Boss: The Fable
    {
        "filename": "voice_boss3.mp3",
        "text": "ファブル……お前らが勝手にそう呼んでるだけだ……俺は、ただコーディングするだけの、プロだ！",
        "voice": "ja-JP-KeitaNeural",
        "rate": "+0%",
        "pitch": "-4Hz"
    },

    # Stage 4 Boss: Wizard Chappy
    {
        "filename": "voice_boss4.mp3",
        "text": "アブラマハリクマハリタカブラ！",
        "voice": "ja-JP-NanamiNeural",
        "rate": "+5%",
        "pitch": "+4Hz"
    }
]

async def main():
    out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "sounds")
    os.makedirs(out_dir, exist_ok=True)
    
    for item in VOICES:
        path = os.path.join(out_dir, item["filename"])
        print(f"Generating {item['filename']} for: {item['text']} ...")
        communicate = edge_tts.Communicate(
            text=item["text"],
            voice=item["voice"],
            rate=item["rate"],
            pitch=item["pitch"]
        )
        await communicate.save(path)
        print(f"Saved: {path}")

if __name__ == "__main__":
    asyncio.run(main())
