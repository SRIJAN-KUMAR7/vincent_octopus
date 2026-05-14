"""
DEMO: Quick Example of Enhanced Transcription
Shows how to use the new transcription system with sample data
"""

from detailed_transcription import DetailedTranscriber
from pathlib import Path
import json


def demo_usage():
    """
    Demonstration of how to use the DetailedTranscriber
    """
    
    print("=" * 80)
    print("ENHANCED TRANSCRIPTION SYSTEM - QUICK DEMO")
    print("=" * 80)
    
    # Find audio files in current directory
    audio_extensions = ['.wav', '.mp3', '.m4a', '.flac', '.ogg']
    current_dir = Path(".")
    
    audio_files = []
    for ext in audio_extensions:
        audio_files.extend(current_dir.glob(f"*{ext}"))
        audio_files.extend(current_dir.glob(f"*{ext.upper()}"))
    
    if not audio_files:
        print("\n⚠️  No audio files found in current directory!")
        print("\nTo use this system:")
        print("1. Place your audio file in this directory")
        print("2. Edit the script to set audio_file path")
        print("3. Run: python demo_transcription.py")
        
        print("\nExample:")
        print("  audio_file = 'my_recording.wav'")
        print("  transcriber.transcribe_detailed(audio_file)")
        
        return
    
    print(f"\n✓ Found {len(audio_files)} audio file(s)")
    
    # Initialize transcriber
    print("\n▶ Initializing transcriber with 'base' model...")
    print("  (First run downloads the model, ~140MB)\n")
    
    transcriber = DetailedTranscriber(model_size="base", device="cpu")
    
    audio_file = str(audio_files[0])
    print(f"▶ Processing: {Path(audio_file).name}")
    
    result = transcriber.transcribe_detailed(audio_file)
    
    if result:
        print("\n▶ Saving results...")
        json_path, txt_path = transcriber.save_results(result)
        
    
        print("\n" + "=" * 80)
        print("TRANSCRIPTION COMPLETE!")
        print("=" * 80)
        
        meta = result['metadata']
        analysis = result['analysis']
        words = result['transcription']['word_level']
        
        print(f"\n📄 Audio File: {meta['audio_file']}")
        print(f"⏱️  Duration: {meta['audio_duration_seconds']} seconds")
        print(f"🗣️  Words: {len(words)}")
        print(f"⏸️  Pauses: {analysis['pause_count']} ({analysis['total_pause_duration']}s total)")
        print(f"💬 Fillers: {analysis['filler_count']} ({', '.join(analysis['filler_words'])})")
        

        confidences = [w['confidence_score'] for w in words]
        avg_conf = sum(confidences) / len(confidences) if confidences else 0
        low_conf_words = [w for w in words if w['confidence_score'] < 0.8]
        
        print(f"🎯 Confidence: {avg_conf:.1%} average")
        print(f"⚠️  Low confidence (<0.8): {len(low_conf_words)} words")
        
        print(f"\n📊 Output files created:")
        print(f"   ✓ JSON (data): {json_path}")
        print(f"   ✓ TEXT (readable): {txt_path}")
        
    
        print("\n" + "-" * 80)
        print("SAMPLE: First 10 words with timestamps")
        print("-" * 80)
        print(f"{'#':<4} | {'Time':<10} | {'Word':<20} | {'Confidence':<12} | {'Filler':<7}")
        print("-" * 80)
        
        for i, word in enumerate(words[:10]):
            is_filler = "YES" if word['is_filler'] else "NO"
            print(f"{i+1:<4} | {word['start_time']:>6.3f}s  | {word['word']:<20} | {word['confidence_score']:>10.1%} | {is_filler:<7}")
        
        if len(words) > 10:
            print(f"... and {len(words)-10} more words")
        
        # Show sample pauses
        if analysis['pauses']:
            print("\n" + "-" * 80)
            print("SAMPLE: Detected pauses")
            print("-" * 80)
            print(f"{'Start':<10} | {'End':<10} | {'Duration':<12}")
            print("-" * 80)
            for pause in analysis['pauses'][:5]:
                print(f"{pause['start_time']:>6.3f}s  | {pause['end_time']:>6.3f}s  | {pause['duration']:>8.3f}s")
            
            if len(analysis['pauses']) > 5:
                print(f"... and {len(analysis['pauses'])-5} more pauses")
        
        # Show sample fillers
        if analysis['fillers']:
            print("\n" + "-" * 80)
            print("SAMPLE: Detected fillers")
            print("-" * 80)
            for filler in analysis['fillers'][:5]:
                filler_text = filler.get('word', filler.get('phrase', 'unknown'))
                print(f"   • {filler_text} (word #{filler['word_index']})")
            
            if len(analysis['fillers']) > 5:
                print(f"   ... and {len(analysis['fillers'])-5} more fillers")
        
        print("\n" + "=" * 80)
        print("✅ Demo complete! Check the output files for full details.")
        print("=" * 80)
        
        print("\n📚 Next steps:")
        print("   1. Open the .txt file to see human-readable output")
        print("   2. Open the .json file for data analysis")
        print("   3. Check *_analysis.txt for confidence metrics")
        print("   4. See USAGE_GUIDE.py for more examples")
        
    else:
        print("❌ Transcription failed")


if __name__ == "__main__":
    demo_usage()
