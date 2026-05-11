"""
Voice Introduction Analyzer - Windows Compatible (No FFmpeg Required)
A program to capture voice introductions, transcribe with Whisper, and analyze voice metrics
Works directly with audio data without needing FFmpeg
"""

import os
import sys
import numpy as np
import librosa
import soundfile as sf
from datetime import datetime
import json
from pathlib import Path
import io

# Force FP32
import torch
torch.set_default_dtype(torch.float32)

try:
    import whisper
except ImportError:
    print("Installing required packages...")
    os.system("pip install openai-whisper librosa soundfile numpy scipy")
    import whisper

try:
    import pyaudio
except ImportError:
    print("Installing pyaudio...")
    os.system("pip install pyaudio")
    import pyaudio


class VoiceAnalyzer:
    """Analyzes voice characteristics and metrics (Windows Compatible)"""
    
    def __init__(self, sample_rate=16000):
        self.sample_rate = sample_rate
        self.whisper_model = None
        
    def load_whisper_model(self, model_size="base"):
        """
        Load Whisper model with FP32 only
        
        Args:
            model_size: Model size ('tiny', 'base', 'small', 'medium', 'large')
        """
        print(f"Loading Whisper {model_size} model (FP32 mode)...")
        print("Warning: FP32 is slower but more compatible")
        
        try:
            # Load on CPU with float32
            self.whisper_model = whisper.load_model(model_size, device="cpu")
            
            # Ensure model is in eval mode and uses FP32
            self.whisper_model.eval()
            self.whisper_model = self.whisper_model.float()
            
            print("Whisper model loaded successfully in FP32 mode!")
            print(f"   Device: CPU")
            print(f"   Precision: Float32\n")
            
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            print("Try installing latest Whisper: pip install --upgrade openai-whisper")
            raise
        
    def record_audio(self, duration=30, chunk_size=1024):
        """
        Record audio from microphone
        
        Args:
            duration: Recording duration in seconds
            chunk_size: Audio chunk size
            
        Returns:
            numpy array of audio data
        """
        p = pyaudio.PyAudio()
        
        # Find default input device
        stream = p.open(
            format=pyaudio.paFloat32,
            channels=1,
            rate=self.sample_rate,
            input=True,
            frames_per_buffer=chunk_size
        )
        
        print(f"\nRecording for {duration} seconds... Please speak your introduction.")
        print("(Press Ctrl+C to stop early)\n")
        
        frames = []
        try:
            for i in range(0, int(self.sample_rate / chunk_size * duration)):
                data = stream.read(chunk_size)
                frames.append(np.frombuffer(data, dtype=np.float32))
                
                # Show progress
                elapsed = (i + 1) * chunk_size / self.sample_rate
                progress = int((elapsed / duration) * 20)
                print(f"[{'█' * progress}{'░' * (20 - progress)}] {elapsed:.1f}s", end='\r')
        except KeyboardInterrupt:
            print("\nRecording stopped early")
        
        stream.stop_stream()
        stream.close()
        p.terminate()
        
        print("\nRecording complete!\n")
        return np.concatenate(frames)
    
    def transcribe_audio(self, audio_data):
        """
        Transcribe audio using Whisper with numpy array (No FFmpeg needed!)
        
        Args:
            audio_data: numpy array of audio samples (float32)
            
        Returns:
            Transcribed text dictionary
        """
        if self.whisper_model is None:
            self.load_whisper_model()
        
        print("Transcribing audio with Whisper (FP32)...")
        print("   This may take a minute or two...\n")
        
        try:
            # Pad or trim audio to match Whisper's expected input
            # Whisper expects approximately 30 seconds of audio
            target_length = self.sample_rate * 30
            
            if len(audio_data) < target_length:
                # Pad with zeros if too short
                audio_padded = np.zeros(target_length)
                audio_padded[:len(audio_data)] = audio_data
                audio_to_process = audio_padded
            else:
                # Use as is if longer
                audio_to_process = audio_data
            
            # Normalize audio to [-1, 1] range if needed
            max_val = np.max(np.abs(audio_to_process))
            if max_val > 1.0:
                audio_to_process = audio_to_process / max_val
            
            # Transcribe directly from numpy array
            with torch.no_grad():
                result = self.whisper_model.transcribe(
                    audio_to_process,
                    fp16=False,
                    verbose=False,
                    language="en"
                )
            
            print("Transcription complete!\n")
            return result
            
        except Exception as e:
            print(f"Error during transcription: {str(e)}")
            print("\nTrying alternative transcription method...\n")
            
            try:
                # Try with different parameters
                with torch.no_grad():
                    result = self.whisper_model.transcribe(
                        audio_data,
                        fp16=False,
                        verbose=False,
                        beam_size=1,
                        temperature=0.0
                    )
                print("Transcription complete!\n")
                return result
            except Exception as e2:
                print(f"Transcription failed: {str(e2)}")
                print("\n💡 Workaround: Saving audio file and using file-based transcription...")
                
                # Save audio temporarily and transcribe
                temp_audio = "temp_audio_transcribe.wav"
                sf.write(temp_audio, audio_data, self.sample_rate)
                
                try:
                    result = self.whisper_model.transcribe(
                        temp_audio,
                        fp16=False,
                        verbose=False
                    )
                    os.remove(temp_audio)
                    print("Transcription complete!\n")
                    return result
                except Exception as e3:
                    print(f"All transcription methods failed: {str(e3)}")
                    if os.path.exists(temp_audio):
                        os.remove(temp_audio)
                    raise
    
    def extract_metrics(self, audio_data):
        """
        Extract various voice metrics from audio
        
        Args:
            audio_data: numpy array of audio samples
            
        Returns:
            Dictionary of metrics
        """
        print("Analyzing voice metrics...")
        
        metrics = {}
        
        # Duration
        duration = len(audio_data) / self.sample_rate
        metrics['duration_seconds'] = round(duration, 2)
        
        # Energy/Loudness
        energy = np.sqrt(np.mean(audio_data ** 2))
        metrics['rms_energy'] = round(float(energy), 4)
        metrics['loudness_db'] = round(float(20 * np.log10(energy + 1e-10)), 2)
        
        # Silence Detection (quieter than -40dB)
        silence_threshold = 0.01
        silent_frames = np.abs(audio_data) < silence_threshold
        silence_ratio = np.sum(silent_frames) / len(audio_data)
        metrics['silence_ratio'] = round(float(silence_ratio), 4)
        metrics['silence_percentage'] = round(float(silence_ratio * 100), 2)
        
        # Pause Detection (segments of silence > 0.5 seconds)
        pauses = self._detect_pauses(audio_data, min_duration=0.5)
        metrics['number_of_pauses'] = len(pauses)
        metrics['average_pause_duration'] = round(float(np.mean([p[1] - p[0] for p in pauses])), 2) if pauses else 0
        metrics['total_pause_duration'] = round(float(sum(p[1] - p[0] for p in pauses)), 2)
        
        # Noise Detection (high-frequency content)
        noise_level = self._estimate_noise_level(audio_data)
        metrics['noise_level'] = round(float(noise_level), 4)
        metrics['noise_db'] = round(float(20 * np.log10(noise_level + 1e-10)), 2)
        
        # Spectral Characteristics
        spec_centroid = librosa.feature.spectral_centroid(y=audio_data, sr=self.sample_rate)[0]
        metrics['spectral_centroid_hz'] = round(float(np.mean(spec_centroid)), 2)
        
        # Zero Crossing Rate
        zcr = librosa.feature.zero_crossing_rate(audio_data)[0]
        metrics['zero_crossing_rate'] = round(float(np.mean(zcr)), 4)
        
        # MFCC
        mfcc = librosa.feature.mfcc(y=audio_data, sr=self.sample_rate, n_mfcc=13)
        metrics['mfcc_mean'] = round(float(np.mean(mfcc)), 4)
        
        # Pitch estimation
        f0 = self._estimate_fundamental_frequency(audio_data)
        metrics['estimated_pitch_hz'] = round(f0, 2) if f0 > 0 else "N/A"
        
        # Speaking rate
        wpm_estimate = self._estimate_wpm(len(audio_data), silence_ratio)
        metrics['estimated_wpm'] = round(wpm_estimate, 1)
        
        # Clarity
        clarity = (1 - silence_ratio) * 100
        metrics['voice_clarity_percentage'] = round(clarity, 2)
        
        # Peak amplitude
        peak_amplitude = np.max(np.abs(audio_data))
        metrics['peak_amplitude'] = round(float(peak_amplitude), 4)
        
        print("Metrics analysis complete!\n")
        return metrics
    
    def _detect_pauses(self, audio_data, min_duration=0.3, silence_threshold=0.01):
        """Detect pauses in audio"""
        silent_frames = np.abs(audio_data) < silence_threshold
        frame_duration = 1 / self.sample_rate
        
        pauses = []
        start_idx = None
        
        for i, is_silent in enumerate(silent_frames):
            if is_silent and start_idx is None:
                start_idx = i
            elif not is_silent and start_idx is not None:
                pause_length = (i - start_idx) * frame_duration
                if pause_length >= min_duration:
                    pauses.append((start_idx * frame_duration, i * frame_duration))
                start_idx = None
        
        return pauses
    
    def _estimate_noise_level(self, audio_data):
        """Estimate noise level from audio"""
        fft = np.abs(np.fft.fft(audio_data))
        freq_bins = len(fft) // 2
        noise_estimate = np.mean(fft[freq_bins//2:]) / np.mean(fft[:freq_bins//2])
        return noise_estimate
    
    def _estimate_fundamental_frequency(self, audio_data, min_hz=50, max_hz=400):
        """Estimate fundamental frequency using autocorrelation"""
        correlations = np.correlate(audio_data, audio_data, mode='full')
        correlations = correlations[len(correlations)//2:]
        
        min_lag = int(self.sample_rate / max_hz)
        max_lag = int(self.sample_rate / min_hz)
        
        if max_lag > len(correlations):
            return -1
        
        peaks = correlations[min_lag:max_lag]
        if len(peaks) == 0:
            return -1
        
        peak_idx = np.argmax(peaks) + min_lag
        f0 = self.sample_rate / peak_idx
        
        return f0
    
    def _estimate_wpm(self, num_samples, silence_ratio):
        """Estimate words per minute"""
        speaking_time = (num_samples / self.sample_rate) * (1 - silence_ratio)
        avg_wpm = 140
        estimated_words = (speaking_time / 60) * avg_wpm
        wpm = estimated_words / (num_samples / self.sample_rate / 60)
        return wpm
    
    def save_results(self, audio_path, transcription, metrics):
        """Save analysis results to JSON file"""
        output_file = f"voice_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'audio_file': str(audio_path),
            'transcription': transcription['text'],
            'language': transcription.get('language', 'en'),
            'metrics': metrics,
            'note': 'Windows Compatible Version - FP32 Precision'
        }
        
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"Results saved to {output_file}\n")
        return output_file
    
    def print_report(self, transcription, metrics):
        """Print formatted analysis report"""
        print("\n" + "="*70)
        print(" " * 15 + "VOICE ANALYSIS REPORT")
        print("="*70)
        
        print("\nTRANSCRIPTION:")
        print("-" * 70)
        print(f"{transcription['text']}\n")
        
        print("VOICE METRICS:")
        print("-" * 70)
        
        # Duration and Speaking
        print(f"\nTIMING METRICS:")
        print(f"   Duration:              {metrics['duration_seconds']} seconds")
        print(f"   Speaking Rate (WPM):   {metrics['estimated_wpm']} words/minute")
        print(f"   Voice Clarity:         {metrics['voice_clarity_percentage']}%")
        
        # Pauses
        print(f"\nPAUSE METRICS:")
        print(f"   Number of Pauses:      {metrics['number_of_pauses']}")
        print(f"   Avg Pause Duration:    {metrics['average_pause_duration']} seconds")
        print(f"   Total Pause Time:      {metrics['total_pause_duration']} seconds")
        
        # Silence
        print(f"\nSILENCE METRICS:")
        print(f"   Silence Ratio:         {metrics['silence_ratio']}")
        print(f"   Silence Percentage:    {metrics['silence_percentage']}%")
        
        # Energy and Noise
        print(f"\nAUDIO QUALITY:")
        print(f"   RMS Energy:            {metrics['rms_energy']}")
        print(f"   Loudness:              {metrics['loudness_db']} dB")
        print(f"   Peak Amplitude:        {metrics['peak_amplitude']}")
        print(f"   Noise Level:           {metrics['noise_level']}")
        print(f"   Noise (dB):            {metrics['noise_db']} dB")
        
        # Frequency Characteristics
        print(f"\nFREQUENCY CHARACTERISTICS:")
        print(f"   Spectral Centroid:     {metrics['spectral_centroid_hz']} Hz")
        if metrics['estimated_pitch_hz'] != "N/A":
            print(f"   Estimated Pitch:       {metrics['estimated_pitch_hz']} Hz")
        print(f"   Zero Crossing Rate:    {metrics['zero_crossing_rate']}")
        print(f"   MFCC Mean:             {metrics['mfcc_mean']}")
        
        print("\n" + "="*70)


def main():
    """Main program"""
    print("\n" + "="*70)
    print(" " * 10 + "VOICE INTRODUCTION ANALYZER")
    print(" " * 10 + "Windows Compatible (No FFmpeg Required)")
    print("="*70)
    print("\nThis program will:")
    print("  1. Record your voice introduction (1 minute)")
    print("  2. Transcribe it using OpenAI's Whisper (FP32)")
    print("  3. Analyze voice metrics (noise, pauses, etc.)")
    print("  4. Generate a detailed report")
    print("\n" + "="*70 + "\n")
    
    # Initialize analyzer
    analyzer = VoiceAnalyzer(sample_rate=16000)
    
    try:
        # Load Whisper model (FP32)
        analyzer.load_whisper_model(model_size="base")
        
        # Get user info
        name = input("Please enter your name: ").strip()
        topic = input("What is your introduction topic/subject?: ").strip()
        
        print(f"\nHello {name}! Please prepare to give your introduction about: {topic}")
        input("Press Enter when you're ready to start recording...\n")
        
        # Record audio
        audio_data = analyzer.record_audio(duration=10)
        
        # Save audio file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        audio_file = f"voice_recording_{timestamp}.wav"
        sf.write(audio_file, audio_data, analyzer.sample_rate)
        print(f"Audio saved to {audio_file}\n")
        
        # Transcribe (pass numpy array directly, no file needed!)
        transcription = analyzer.transcribe_audio(audio_data)
        
        # Extract metrics
        metrics = analyzer.extract_metrics(audio_data)
        
        # Print report
        analyzer.print_report(transcription, metrics)
        
        # Save results
        analyzer.save_results(audio_file, transcription, metrics)
        
        print("Analysis complete! Check the JSON file for detailed metrics.")
        
    except KeyboardInterrupt:
        print("\n\nProgram interrupted by user")
    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
        print("\nTroubleshooting tips:")
        print("   - Make sure you have the latest Whisper: pip install --upgrade openai-whisper")
        print("   - Check your PyAudio installation")
        print("   - Windows users: FFmpeg is NOT required with this version")


if __name__ == "__main__":
    main()