"""
Enhanced Detailed Transcription with Timestamps, Fillers, Pauses, and Confidence
Provides granular word-level analysis for confidence-based analysis
"""

import os
import json
import re
from datetime import datetime
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
from typing import List, Dict, Tuple, Any
import torch

try:
    import whisper
except ImportError:
    os.system("pip install openai-whisper librosa soundfile numpy scipy")
    import whisper


class DetailedTranscriber:
    """Enhanced transcription with detailed timestamps, fillers, and pauses"""
    
    FILLER_WORDS = {
        'um', 'uh', 'er', 'erm', 'ah', 'hmm', 'hm', 'eh',
        'like', 'you know', 'i mean', 'i think', 'actually',
        'basically', 'kind of', 'sort of', 'literally',
        'umm', 'uhhh', 'uh-huh', 'mm-hmm', 'uhh'
    }
    
    SILENCE_THRESHOLD_DB = -40  # dB threshold for silence
    MIN_PAUSE_DURATION = 0.3    # Minimum pause duration in seconds
    
    def __init__(self, model_size="base", device="cpu"):
        """Initialize transcriber with specified model"""
        self.model_size = model_size
        self.device = device
        self.model = None
        self.load_model()
        
    def load_model(self):
        """Load Whisper model"""
        print(f"Loading Whisper {self.model_size} model...")
        try:
            self.model = whisper.load_model(self.model_size, device=self.device)
            self.model.eval()
            self.model = self.model.float()
            print(f"Model loaded successfully on {self.device}\n")
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            raise
    
    def detect_pauses(self, audio: np.ndarray, sr: int) -> List[Dict[str, Any]]:
        """
        Detect pauses/silence in audio
        
        Args:
            audio: Audio data as numpy array
            sr: Sample rate
            
        Returns:
            List of pause information with timestamps and durations
        """
        # Convert to mono if stereo
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=1)
        
        # Calculate short-time energy
        frame_length = int(sr * 0.02)  # 20ms frames
        hop_length = int(sr * 0.01)    # 10ms hop
        
        frames = librosa.util.frame(audio, frame_length=frame_length, hop_length=hop_length)
        energy = np.sqrt(np.sum(frames**2, axis=0))
        
        # Convert to dB
        energy_db = 20 * np.log10(np.maximum(energy, 1e-10))
        
        # Detect silence
        silence_mask = energy_db < self.SILENCE_THRESHOLD_DB
        
        # Find pause regions
        pauses = []
        in_pause = False
        pause_start = 0
        
        for i, is_silence in enumerate(silence_mask):
            time = i * hop_length / sr
            
            if is_silence and not in_pause:
                pause_start = time
                in_pause = True
            elif not is_silence and in_pause:
                pause_duration = time - pause_start
                if pause_duration >= self.MIN_PAUSE_DURATION:
                    pauses.append({
                        'start_time': round(pause_start, 3),
                        'end_time': round(time, 3),
                        'duration': round(pause_duration, 3)
                    })
                in_pause = False
        
        return pauses
    
    def detect_fillers(self, text: str) -> List[Dict[str, Any]]:
        """
        Detect filler words in transcription
        
        Args:
            text: Transcribed text
            
        Returns:
            List of detected fillers with positions
        """
        fillers = []
        words = text.lower().split()
        char_pos = 0
        
        for word_idx, word in enumerate(words):
            # Remove punctuation for comparison
            clean_word = re.sub(r'[^\w]', '', word)
            
            # Check exact match
            if clean_word in self.FILLER_WORDS:
                fillers.append({
                    'word': clean_word,
                    'word_index': word_idx,
                    'char_position': char_pos,
                    'type': 'filler'
                })
            
            # Check multi-word phrases
            phrase = ' '.join(words[max(0, word_idx-1):word_idx+1])
            if phrase in self.FILLER_WORDS:
                fillers.append({
                    'phrase': phrase,
                    'word_index': word_idx,
                    'char_position': char_pos,
                    'type': 'filler_phrase'
                })
            
            char_pos += len(word) + 1
        
        return fillers
    
    def transcribe_detailed(self, audio_path: str, language: str = "en") -> Dict[str, Any]:
        """
        Transcribe audio with detailed information including timestamps and confidence
        
        Args:
            audio_path: Path to audio file
            language: Language code (default: 'en')
            
        Returns:
            Dictionary with detailed transcription data
        """
        print(f"\nTranscribing: {audio_path}")
        
        # Convert to absolute path (fixes Windows path issues)
        audio_path = str(Path(audio_path).resolve())
        print(f"Resolved path: {audio_path}")
        
        # Load audio
        try:
            audio, sr = librosa.load(audio_path, sr=16000)
        except Exception as e:
            print(f"Error loading audio: {e}")
            return None
        
        audio_duration = len(audio) / sr
        print(f"Audio duration: {audio_duration:.2f} seconds")
        
        # Transcribe with Whisper (verbose mode includes tokens and probabilities)
        print("Running Whisper transcription...")
        try:
            result = self.model.transcribe(
                audio_path,
                language=language,
                verbose=False,
                temperature=0,  # Greedy decoding for consistency
                task="transcribe"
            )
        except Exception as e:
            print(f"Transcription error with direct path: {e}")
            print("Attempting alternative transcription method with audio array...")
            try:
                # Try transcribing the numpy array directly
                result = self.model.transcribe(
                    audio,
                    language=language,
                    verbose=False,
                    temperature=0,
                    task="transcribe"
                )
                print("✓ Alternative method successful")
            except Exception as e2:
                print(f"Alternative transcription also failed: {e2}")
                return None
        
        full_text = result["text"]
        segments = result.get("segments", [])
        
        # Detect pauses
        print("Detecting pauses...")
        pauses = self.detect_pauses(audio, sr)
        
        # Detect fillers
        print("Detecting fillers...")
        fillers = self.detect_fillers(full_text)
        
        # Create detailed word-level transcription
        detailed_words = self._create_word_level_transcription(segments, full_text, fillers)
        
        # Compile results
        result_data = {
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "audio_file": Path(audio_path).name,
                "audio_duration_seconds": round(audio_duration, 2),
                "language": language,
                "model_size": self.model_size,
                "transcription_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            },
            "transcription": {
                "full_text": full_text,
                "word_level": detailed_words,
            },
            "analysis": {
                "pauses": pauses,
                "pause_count": len(pauses),
                "total_pause_duration": round(sum(p['duration'] for p in pauses), 2),
                "fillers": fillers,
                "filler_count": len(fillers),
                "filler_words": list(set(f.get('word', f.get('phrase', '')) for f in fillers if f['type'] in ['filler', 'filler_phrase'])),
            },
            "segments": segments,
            "language_detected": result.get("language", language)
        }
        
        return result_data
    
    def _create_word_level_transcription(self, segments: List[Dict], 
                                        full_text: str, fillers: List[Dict]) -> List[Dict[str, Any]]:
        """
        Create word-level transcription with timestamps and confidence
        
        Args:
            segments: Whisper segments with timing info
            full_text: Full transcribed text
            fillers: Detected fillers
            
        Returns:
            List of word-level details
        """
        word_level = []
        filler_positions = set(f.get('word_index', f.get('char_position', -1)) for f in fillers)
        word_idx = 0
        
        for segment in segments:
            segment_text = segment['text'].strip()
            words_in_segment = segment_text.split()
            segment_start = segment['start']
            segment_end = segment['end']
            segment_duration = segment_end - segment_start
            
            # Estimate word-level timing
            word_duration = segment_duration / len(words_in_segment) if words_in_segment else 0
            
            for i, word in enumerate(words_in_segment):
                word_start = segment_start + (i * word_duration)
                word_end = word_start + word_duration
                
                is_filler = word_idx in filler_positions or word.lower() in self.FILLER_WORDS
                
                word_level.append({
                    'word_index': word_idx,
                    'word': word,
                    'start_time': round(word_start, 3),
                    'end_time': round(word_end, 3),
                    'duration': round(word_duration, 3),
                    'segment_index': segments.index(segment),
                    'is_filler': is_filler,
                    'confidence_score': segment.get('confidence', 1.0)  # Segment-level confidence
                })
                
                word_idx += 1
        
        return word_level
    
    def save_results(self, result_data: Dict[str, Any], output_dir: str = ".") -> Tuple[str, str]:
        """
        Save transcription results in multiple formats
        
        Args:
            result_data: Transcription result data
            output_dir: Output directory
            
        Returns:
            Tuple of (json_path, txt_path)
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = f"detailed_transcription_{timestamp}"
        
        # Save JSON with full details
        json_path = output_dir / f"{base_name}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(result_data, f, indent=2, ensure_ascii=False)
        print(f"✓ JSON saved: {json_path}")
        
        # Save human-readable text file
        txt_path = output_dir / f"{base_name}.txt"
        self._save_formatted_text(result_data, txt_path)
        print(f"✓ Text file saved: {txt_path}")
        
        # Save detailed analysis report
        report_path = output_dir / f"{base_name}_analysis.txt"
        self._save_analysis_report(result_data, report_path)
        print(f"✓ Analysis report saved: {report_path}")
        
        return str(json_path), str(txt_path)
    
    def _save_formatted_text(self, result_data: Dict[str, Any], filepath: Path):
        """Save human-readable formatted transcription"""
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write("DETAILED TRANSCRIPTION WITH TIMESTAMPS AND ANALYSIS\n")
            f.write("=" * 80 + "\n\n")
            
            # Metadata
            meta = result_data['metadata']
            f.write(f"Audio File: {meta['audio_file']}\n")
            f.write(f"Duration: {meta['audio_duration_seconds']} seconds\n")
            f.write(f"Transcribed: {meta['transcription_date']}\n")
            f.write(f"Language: {result_data['language_detected']}\n\n")
            
            # Full transcription
            f.write("-" * 80 + "\n")
            f.write("FULL TRANSCRIPTION:\n")
            f.write("-" * 80 + "\n")
            f.write(result_data['transcription']['full_text'] + "\n\n")
            
            # Word-by-word with timestamps
            f.write("-" * 80 + "\n")
            f.write("WORD-BY-WORD TRANSCRIPTION (with timestamps):\n")
            f.write("-" * 80 + "\n")
            f.write(f"{'Time':>10} | {'Word':30} | {'Duration':>10} | {'Filler?':>8} | {'Confidence':>12}\n")
            f.write("-" * 80 + "\n")
            
            for word_data in result_data['transcription']['word_level']:
                is_filler = "YES" if word_data['is_filler'] else "NO"
                f.write(f"{word_data['start_time']:>6.3f}s | {word_data['word']:30} | "
                       f"{word_data['duration']:>8.3f}s | {is_filler:>8} | "
                       f"{word_data['confidence_score']:>12.2%}\n")
            
            # Pauses section
            f.write("\n" + "-" * 80 + "\n")
            f.write(f"PAUSES AND SILENCE ({result_data['analysis']['pause_count']} detected):\n")
            f.write("-" * 80 + "\n")
            f.write(f"{'Start':>10} | {'End':>10} | {'Duration':>12}\n")
            f.write("-" * 80 + "\n")
            
            for pause in result_data['analysis']['pauses']:
                f.write(f"{pause['start_time']:>6.3f}s | {pause['end_time']:>6.3f}s | "
                       f"{pause['duration']:>8.3f}s\n")
            
            # Fillers section
            f.write("\n" + "-" * 80 + "\n")
            f.write(f"DETECTED FILLERS ({result_data['analysis']['filler_count']} total):\n")
            f.write("-" * 80 + "\n")
            
            if result_data['analysis']['fillers']:
                f.write(f"Unique filler words: {', '.join(result_data['analysis']['filler_words'])}\n\n")
                f.write(f"{'Word Index':>12} | {'Filler Word/Phrase':30} | {'Position':>10}\n")
                f.write("-" * 80 + "\n")
                
                for filler in result_data['analysis']['fillers']:
                    filler_text = filler.get('word', filler.get('phrase', 'unknown'))
                    f.write(f"{filler['word_index']:>12} | {filler_text:30} | {filler.get('char_position', 0):>10}\n")
            else:
                f.write("No fillers detected.\n")
            
            # Summary statistics
            f.write("\n" + "-" * 80 + "\n")
            f.write("SUMMARY STATISTICS:\n")
            f.write("-" * 80 + "\n")
            f.write(f"Total words: {len(result_data['transcription']['word_level'])}\n")
            f.write(f"Filler words/phrases detected: {result_data['analysis']['filler_count']}\n")
            f.write(f"Number of pauses: {result_data['analysis']['pause_count']}\n")
            f.write(f"Total pause duration: {result_data['analysis']['total_pause_duration']}s\n")
            f.write(f"Audio duration: {meta['audio_duration_seconds']}s\n")
            f.write(f"Speaking time: {meta['audio_duration_seconds'] - result_data['analysis']['total_pause_duration']:.2f}s\n")
    
    def _save_analysis_report(self, result_data: Dict[str, Any], filepath: Path):
        """Save detailed analysis report for confidence analysis"""
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write("CONFIDENCE ANALYSIS REPORT\n")
            f.write("=" * 80 + "\n\n")
            
            # Confidence by word
            f.write("WORD-LEVEL CONFIDENCE SCORES:\n")
            f.write("-" * 80 + "\n")
            
            confidence_scores = [w['confidence_score'] for w in result_data['transcription']['word_level']]
            avg_confidence = np.mean(confidence_scores) if confidence_scores else 0
            min_confidence = np.min(confidence_scores) if confidence_scores else 0
            max_confidence = np.max(confidence_scores) if confidence_scores else 0
            
            f.write(f"Average confidence: {avg_confidence:.4f}\n")
            f.write(f"Min confidence: {min_confidence:.4f}\n")
            f.write(f"Max confidence: {max_confidence:.4f}\n")
            f.write(f"Std deviation: {np.std(confidence_scores):.4f}\n\n")
            
            # Low confidence words
            f.write("LOW CONFIDENCE WORDS (<0.8):\n")
            f.write("-" * 80 + "\n")
            low_conf_words = [w for w in result_data['transcription']['word_level'] if w['confidence_score'] < 0.8]
            
            if low_conf_words:
                for word in low_conf_words:
                    f.write(f"'{word['word']}' @ {word['start_time']}s (confidence: {word['confidence_score']:.4f})\n")
            else:
                f.write("All words have confidence >= 0.8\n")
            
            # Filler impact on confidence
            f.write("\n" + "=" * 80 + "\n")
            f.write("FILLER WORDS ANALYSIS:\n")
            f.write("-" * 80 + "\n")
            
            filler_indices = [w['word_index'] for f in result_data['analysis']['fillers'] 
                            for w in result_data['transcription']['word_level'] if w['is_filler']]
            
            if filler_indices:
                filler_words = [result_data['transcription']['word_level'][i] for i in filler_indices if i < len(result_data['transcription']['word_level'])]
                filler_confidences = [w['confidence_score'] for w in filler_words]
                
                f.write(f"Filler words found: {len(filler_words)}\n")
                f.write(f"Average filler confidence: {np.mean(filler_confidences):.4f}\n")
                f.write(f"Average non-filler confidence: {np.mean([s for i, s in enumerate(confidence_scores) if i not in filler_indices]):.4f}\n")
            
            f.write(f"\nDetected fillers: {', '.join(result_data['analysis']['filler_words'])}\n")


def main():
    """Main execution"""
    # Example usage
    audio_file = "voice_recording_20260510_105239.wav"  # Update with your audio file
    
    if not Path(audio_file).exists():
        print(f"Audio file not found: {audio_file}")
        print("Please provide a valid audio file path")
        return
    
    # Initialize transcriber
    transcriber = DetailedTranscriber(model_size="base", device="cpu")
    
    # Transcribe with detailed information
    result = transcriber.transcribe_detailed(audio_file)
    
    if result:
        # Save results
        json_path, txt_path = transcriber.save_results(
            result,
            output_dir="."
        )
        
        print("\n" + "=" * 80)
        print("TRANSCRIPTION COMPLETE!")
        print("=" * 80)
        print(f"\nResults saved to:")
        print(f"  JSON (detailed): {json_path}")
        print(f"  Text (readable): {txt_path}")


if __name__ == "__main__":
    main()
