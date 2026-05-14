"""
Batch Transcription Processor
Process multiple audio files and generate detailed transcriptions
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import json
from detailed_transcription import DetailedTranscriber


def process_batch(audio_dir: str = ".", output_dir: str = "transcriptions", 
                 audio_extensions: list = None, model_size: str = "base"):
    """
    Process all audio files in a directory
    
    Args:
        audio_dir: Directory containing audio files
        output_dir: Directory to save transcriptions
        audio_extensions: List of audio file extensions to process
        model_size: Whisper model size ('tiny', 'base', 'small', 'medium', 'large')
    """
    
    if audio_extensions is None:
        audio_extensions = ['.wav', '.mp3', '.m4a', '.flac', '.ogg']
    
    audio_dir = Path(audio_dir)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Find all audio files
    audio_files = []
    for ext in audio_extensions:
        audio_files.extend(audio_dir.glob(f"*{ext}"))
        audio_files.extend(audio_dir.glob(f"*{ext.upper()}"))
    
    if not audio_files:
        print(f"No audio files found in {audio_dir}")
        return
    
    print(f"\nFound {len(audio_files)} audio file(s)")
    print(f"Model size: {model_size}")
    print(f"Output directory: {output_dir}\n")
    
    # Initialize transcriber
    transcriber = DetailedTranscriber(model_size=model_size, device="cpu")
    
    # Process each file
    results_summary = []
    for i, audio_file in enumerate(audio_files, 1):
        print(f"\n[{i}/{len(audio_files)}] Processing: {audio_file.name}")
        print("-" * 60)
        
        try:
            # Transcribe
            result = transcriber.transcribe_detailed(str(audio_file))
            
            if result:
                # Create output subdirectory for this file
                file_output_dir = output_dir / audio_file.stem
                file_output_dir.mkdir(parents=True, exist_ok=True)
                
                # Save results
                json_path, txt_path = transcriber.save_results(result, file_output_dir)
                
                results_summary.append({
                    'audio_file': audio_file.name,
                    'status': 'success',
                    'json_output': json_path,
                    'text_output': txt_path,
                    'words_count': len(result['transcription']['word_level']),
                    'pauses_count': result['analysis']['pause_count'],
                    'fillers_count': result['analysis']['filler_count']
                })
                
                print(f"✓ Successfully processed")
                print(f"  Words: {results_summary[-1]['words_count']}")
                print(f"  Pauses: {results_summary[-1]['pauses_count']}")
                print(f"  Fillers: {results_summary[-1]['fillers_count']}")
            else:
                results_summary.append({
                    'audio_file': audio_file.name,
                    'status': 'failed',
                    'error': 'Transcription returned None'
                })
                print("✗ Transcription failed")
        
        except Exception as e:
            results_summary.append({
                'audio_file': audio_file.name,
                'status': 'error',
                'error': str(e)
            })
            print(f"✗ Error: {str(e)}")
    
    # Save summary report
    summary_path = output_dir / f"batch_processing_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(results_summary, f, indent=2)
    
    print("\n" + "=" * 60)
    print("BATCH PROCESSING COMPLETE")
    print("=" * 60)
    print(f"\nSuccessfully processed: {sum(1 for r in results_summary if r['status'] == 'success')}/{len(audio_files)}")
    print(f"Summary report: {summary_path}")
    
    # Print summary table
    print("\nSummary:")
    print(f"{'Audio File':<40} | {'Status':<10} | {'Words':<8} | {'Pauses':<8} | {'Fillers':<8}")
    print("-" * 90)
    for result in results_summary:
        words = result.get('words_count', '-')
        pauses = result.get('pauses_count', '-')
        fillers = result.get('fillers_count', '-')
        print(f"{result['audio_file']:<40} | {result['status']:<10} | {str(words):<8} | {str(pauses):<8} | {str(fillers):<8}")


def main():
    """Main execution"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Batch transcribe audio files with detailed analysis')
    parser.add_argument('--audio-dir', default='.', help='Directory containing audio files (default: current directory)')
    parser.add_argument('--output-dir', default='transcriptions', help='Directory to save transcriptions (default: transcriptions/)')
    parser.add_argument('--model', default='base', choices=['tiny', 'base', 'small', 'medium', 'large'],
                       help='Whisper model size (default: base)')
    
    args = parser.parse_args()
    
    process_batch(
        audio_dir=args.audio_dir,
        output_dir=args.output_dir,
        model_size=args.model
    )


if __name__ == "__main__":
    main()
