"""
Voice Analysis Visualizer - Windows Compatible
Advanced analytics and visualization for voice metrics (Non-GUI Backend)
"""

import json
import numpy as np
import matplotlib
# Use non-interactive backend for Windows compatibility
matplotlib.use('Agg')  # This line MUST come before pyplot import
import matplotlib.pyplot as plt
import librosa
import librosa.display
from pathlib import Path
from datetime import datetime
import soundfile as sf


class VoiceVisualizer:
    """Create visualizations for voice analysis metrics (Windows Compatible)"""
    
    def __init__(self, audio_file, metrics_json=None):
        self.audio_file = audio_file
        self.metrics = metrics_json
        self.y, self.sr = librosa.load(audio_file, sr=16000)
        self.sample_rate = 16000
        print(f"Loaded audio file: {audio_file}")
        
    @staticmethod
    def load_metrics_json(json_file):
        """Load metrics from JSON file"""
        with open(json_file, 'r') as f:
            return json.load(f)
    
    def create_comprehensive_visualization(self, output_file=None):
        """Create comprehensive visualization dashboard"""
        print("Creating comprehensive visualization...")
        
        fig = plt.figure(figsize=(16, 12))
        
        try:
            # 1. Waveform
            ax1 = plt.subplot(3, 3, 1)
            self._plot_waveform(ax1)
            
            # 2. Spectrogram
            ax2 = plt.subplot(3, 3, 2)
            self._plot_spectrogram(ax2)
            
            # 3. Mel Spectrogram
            ax3 = plt.subplot(3, 3, 3)
            self._plot_mel_spectrogram(ax3)
            
            # 4. RMS Energy
            ax4 = plt.subplot(3, 3, 4)
            self._plot_rms_energy(ax4)
            
            # 5. Zero Crossing Rate
            ax5 = plt.subplot(3, 3, 5)
            self._plot_zero_crossing_rate(ax5)
            
            # 6. Spectral Centroid
            ax6 = plt.subplot(3, 3, 6)
            self._plot_spectral_centroid(ax6)
            
            # 7. MFCC
            ax7 = plt.subplot(3, 3, 7)
            self._plot_mfcc(ax7)
            
            # 8. Chromagram
            ax8 = plt.subplot(3, 3, 8)
            self._plot_chromagram(ax8)
            
            # 9. Metrics Summary
            ax9 = plt.subplot(3, 3, 9)
            self._plot_metrics_summary(ax9)
            
            plt.tight_layout()
            
            if output_file is None:
                output_file = f"voice_visualization_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            
            plt.savefig(output_file, dpi=300, bbox_inches='tight')
            plt.close(fig)  # Close figure to free memory
            
            print(f"Visualization saved to {output_file}")
            return output_file
            
        except Exception as e:
            print(f"Error creating visualization: {str(e)}")
            plt.close(fig)
            raise
    
    def _plot_waveform(self, ax):
        """Plot audio waveform"""
        try:
            librosa.display.waveshow(self.y, sr=self.sr, ax=ax, color='#2E86AB')
            ax.set_title('Audio Waveform', fontsize=12, fontweight='bold')
            ax.set_xlabel('Time (s)')
            ax.set_ylabel('Amplitude')
            ax.grid(True, alpha=0.3)
        except Exception as e:
            print(f"Warning in waveform plot: {str(e)}")
    
    def _plot_spectrogram(self, ax):
        """Plot spectrogram"""
        try:
            D = librosa.stft(self.y)
            S_db = librosa.power_to_db(np.abs(D)**2, ref=np.max)
            img = librosa.display.specshow(S_db, sr=self.sr, x_axis='time', y_axis='hz', ax=ax, cmap='viridis')
            ax.set_title('Spectrogram', fontsize=12, fontweight='bold')
            ax.set_ylabel('Frequency (Hz)')
            plt.colorbar(img, ax=ax, format='%+2.0f dB')
        except Exception as e:
            print(f"Warning in spectrogram plot: {str(e)}")
    
    def _plot_mel_spectrogram(self, ax):
        """Plot mel-scaled spectrogram"""
        try:
            S = librosa.feature.melspectrogram(y=self.y, sr=self.sr)
            S_db = librosa.power_to_db(S, ref=np.max)
            img = librosa.display.specshow(S_db, sr=self.sr, x_axis='time', y_axis='mel', ax=ax, cmap='magma')
            ax.set_title('Mel Spectrogram', fontsize=12, fontweight='bold')
            ax.set_ylabel('Mel Frequency')
            plt.colorbar(img, ax=ax, format='%+2.0f dB')
        except Exception as e:
            print(f"Warning in mel spectrogram plot: {str(e)}")
    
    def _plot_rms_energy(self, ax):
        """Plot RMS energy"""
        try:
            S = np.abs(librosa.stft(self.y))
            rms = librosa.feature.rms(S=S)[0]
            frames = range(len(rms))
            t = librosa.frames_to_time(frames, sr=self.sr)
            ax.plot(t, rms, color='#A23B72', linewidth=2)
            ax.fill_between(t, rms, alpha=0.3, color='#A23B72')
            ax.set_title('RMS Energy', fontsize=12, fontweight='bold')
            ax.set_xlabel('Time (s)')
            ax.set_ylabel('Energy')
            ax.grid(True, alpha=0.3)
        except Exception as e:
            print(f"Warning in RMS energy plot: {str(e)}")
    
    def _plot_zero_crossing_rate(self, ax):
        """Plot zero crossing rate"""
        try:
            zcr = librosa.feature.zero_crossing_rate(self.y)[0]
            frames = range(len(zcr))
            t = librosa.frames_to_time(frames, sr=self.sr)
            ax.plot(t, zcr, color='#F18F01', linewidth=2)
            ax.fill_between(t, zcr, alpha=0.3, color='#F18F01')
            ax.set_title('Zero Crossing Rate', fontsize=12, fontweight='bold')
            ax.set_xlabel('Time (s)')
            ax.set_ylabel('ZCR')
            ax.grid(True, alpha=0.3)
        except Exception as e:
            print(f"Warning in ZCR plot: {str(e)}")
    
    def _plot_spectral_centroid(self, ax):
        """Plot spectral centroid"""
        try:
            spectral_centroid = librosa.feature.spectral_centroid(y=self.y, sr=self.sr)[0]
            frames = range(len(spectral_centroid))
            t = librosa.frames_to_time(frames, sr=self.sr)
            ax.plot(t, spectral_centroid, color='#06A77D', linewidth=2)
            ax.fill_between(t, spectral_centroid, alpha=0.3, color='#06A77D')
            ax.set_title('Spectral Centroid', fontsize=12, fontweight='bold')
            ax.set_xlabel('Time (s)')
            ax.set_ylabel('Frequency (Hz)')
            ax.grid(True, alpha=0.3)
        except Exception as e:
            print(f"Warning in spectral centroid plot: {str(e)}")
    
    def _plot_mfcc(self, ax):
        """Plot MFCC"""
        try:
            mfcc = librosa.feature.mfcc(y=self.y, sr=self.sr, n_mfcc=13)
            img = librosa.display.specshow(mfcc, sr=self.sr, x_axis='time', ax=ax, cmap='cool')
            ax.set_title('MFCC (Mel-Frequency Cepstral Coefficients)', fontsize=12, fontweight='bold')
            ax.set_ylabel('MFCC Coefficient')
            plt.colorbar(img, ax=ax)
        except Exception as e:
            print(f"Warning in MFCC plot: {str(e)}")
    
    def _plot_chromagram(self, ax):
        """Plot chromagram"""
        try:
            chroma = librosa.feature.chroma_cqt(y=self.y, sr=self.sr)
            img = librosa.display.specshow(chroma, sr=self.sr, x_axis='time', y_axis='chroma', ax=ax, cmap='hsv')
            ax.set_title('Chromagram', fontsize=12, fontweight='bold')
            ax.set_ylabel('Note')
            plt.colorbar(img, ax=ax)
        except Exception as e:
            print(f"Warning in chromagram plot: {str(e)}")
    
    def _plot_metrics_summary(self, ax):
        """Plot metrics summary as text"""
        ax.axis('off')
        
        if self.metrics:
            metrics_text = f"""
VOICE METRICS SUMMARY
─────────────────────────────
Duration: {self.metrics['metrics'].get('duration_seconds', 'N/A')} s
Speaking Rate: {self.metrics['metrics'].get('estimated_wpm', 'N/A')} WPM
Voice Clarity: {self.metrics['metrics'].get('voice_clarity_percentage', 'N/A')}%

Pauses Detected: {self.metrics['metrics'].get('number_of_pauses', 'N/A')}
Avg Pause: {self.metrics['metrics'].get('average_pause_duration', 'N/A')} s
Total Pause: {self.metrics['metrics'].get('total_pause_duration', 'N/A')} s

Loudness: {self.metrics['metrics'].get('loudness_db', 'N/A')} dB
Noise Level: {self.metrics['metrics'].get('noise_db', 'N/A')} dB
Peak Amplitude: {self.metrics['metrics'].get('peak_amplitude', 'N/A')}

Pitch: {self.metrics['metrics'].get('estimated_pitch_hz', 'N/A')} Hz
Spectral Centroid: {self.metrics['metrics'].get('spectral_centroid_hz', 'N/A')} Hz
ZCR: {self.metrics['metrics'].get('zero_crossing_rate', 'N/A')}
            """
        else:
            metrics_text = "No metrics data available"
        
        ax.text(0.1, 0.95, metrics_text, transform=ax.transAxes,
                fontsize=9, verticalalignment='top', fontfamily='monospace',
                bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
    
    def create_metrics_comparison_chart(self, output_file=None):
        """Create metrics comparison chart"""
        print("Creating metrics comparison chart...")
        
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        
        try:
            if not self.metrics:
                print("No metrics data available")
                plt.close(fig)
                return
            
            m = self.metrics['metrics']
            
            # 1. Timing Analysis
            ax1 = axes[0, 0]
            silence_pct = m.get('silence_percentage', 0)
            speaking_pct = 100 - silence_pct
            ax1.pie([speaking_pct, silence_pct], labels=['Speaking', 'Silence'],
                    autopct='%1.1f%%', colors=['#2E86AB', '#A23B72'], startangle=90)
            ax1.set_title('Speaking vs Silence', fontweight='bold', fontsize=11)
            
            # 2. Pause Distribution
            ax2 = axes[0, 1]
            pauses = m.get('number_of_pauses', 0)
            avg_pause = m.get('average_pause_duration', 0)
            total_pause = m.get('total_pause_duration', 0)
            bars = ax2.bar(['Num Pauses', 'Avg Duration (s)', 'Total (s)'],
                    [pauses, avg_pause, total_pause], color=['#F18F01', '#06A77D', '#D62828'])
            ax2.set_title('Pause Metrics', fontweight='bold', fontsize=11)
            ax2.grid(True, alpha=0.3, axis='y')
            
            # Add value labels on bars
            for bar in bars:
                height = bar.get_height()
                ax2.text(bar.get_x() + bar.get_width()/2., height,
                        f'{height:.2f}', ha='center', va='bottom', fontsize=9)
            
            # 3. Audio Quality
            ax3 = axes[1, 0]
            loudness = m.get('loudness_db', 0)
            noise_db = m.get('noise_db', 0)
            bars = ax3.barh(['Loudness (dB)', 'Noise (dB)'],
                     [loudness, noise_db], color=['#2E86AB', '#A23B72'])
            ax3.set_title('Audio Quality', fontweight='bold', fontsize=11)
            ax3.grid(True, alpha=0.3, axis='x')
            
            # Add value labels
            for i, bar in enumerate(bars):
                width = bar.get_width()
                ax3.text(width, bar.get_y() + bar.get_height()/2.,
                        f'{width:.2f}', ha='left', va='center', fontsize=9)
            
            # 4. Frequency Characteristics
            ax4 = axes[1, 1]
            pitch = m.get('estimated_pitch_hz', 0)
            centroid = m.get('spectral_centroid_hz', 0) / 1000  # Convert to kHz
            wpm = m.get('estimated_wpm', 0)
            bars = ax4.bar(['Pitch\n(Hz)', 'Spectral Centroid\n(kHz)', 'WPM'],
                    [pitch, centroid, wpm], color=['#06A77D', '#F18F01', '#D62828'])
            ax4.set_title('Frequency & Rate Characteristics', fontweight='bold', fontsize=11)
            ax4.grid(True, alpha=0.3, axis='y')
            
            # Add value labels
            for bar in bars:
                height = bar.get_height()
                ax4.text(bar.get_x() + bar.get_width()/2., height,
                        f'{height:.2f}', ha='center', va='bottom', fontsize=9)
            
            plt.tight_layout()
            
            if output_file is None:
                output_file = f"metrics_comparison_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            
            plt.savefig(output_file, dpi=300, bbox_inches='tight')
            plt.close(fig)
            
            print(f"Comparison chart saved to {output_file}")
            return output_file
            
        except Exception as e:
            print(f"Error creating comparison chart: {str(e)}")
            plt.close(fig)
            raise
    
    def create_simple_metrics_chart(self, output_file=None):
        """Create a simple metrics chart without complex visualization"""
        print("Creating simple metrics chart...")
        
        try:
            if not self.metrics:
                print("No metrics data available")
                return
            
            m = self.metrics['metrics']
            
            fig, ax = plt.subplots(figsize=(12, 8))
            
            # Create a simple text-based summary chart
            metrics_text = f"""
╔══════════════════════════════════════════════════════╗
║           VOICE ANALYSIS METRICS SUMMARY              ║
╚══════════════════════════════════════════════════════╝

TIMING METRICS
   Duration:              {m.get('duration_seconds', 'N/A')} seconds
   Speaking Rate (WPM):   {m.get('estimated_wpm', 'N/A')} words/minute
   Voice Clarity:         {m.get('voice_clarity_percentage', 'N/A')}%

PAUSE METRICS
   Number of Pauses:      {m.get('number_of_pauses', 'N/A')}
   Avg Pause Duration:    {m.get('average_pause_duration', 'N/A')} seconds
   Total Pause Time:      {m.get('total_pause_duration', 'N/A')} seconds

SILENCE METRICS
   Silence Ratio:         {m.get('silence_ratio', 'N/A')}
   Silence Percentage:    {m.get('silence_percentage', 'N/A')}%

AUDIO QUALITY
   RMS Energy:            {m.get('rms_energy', 'N/A')}
   Loudness:              {m.get('loudness_db', 'N/A')} dB
   Peak Amplitude:        {m.get('peak_amplitude', 'N/A')}
   Noise Level:           {m.get('noise_level', 'N/A')}
   Noise (dB):            {m.get('noise_db', 'N/A')} dB

FREQUENCY CHARACTERISTICS
   Spectral Centroid:     {m.get('spectral_centroid_hz', 'N/A')} Hz
   Estimated Pitch:       {m.get('estimated_pitch_hz', 'N/A')} Hz
   Zero Crossing Rate:    {m.get('zero_crossing_rate', 'N/A')}
   MFCC Mean:             {m.get('mfcc_mean', 'N/A')}
"""
            
            ax.text(0.05, 0.95, metrics_text, transform=ax.transAxes,
                   fontsize=9, verticalalignment='top', fontfamily='monospace',
                   bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.7))
            ax.axis('off')
            
            if output_file is None:
                output_file = f"metrics_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            
            plt.tight_layout()
            plt.savefig(output_file, dpi=300, bbox_inches='tight')
            plt.close(fig)
            
            print(f"Metrics summary saved to {output_file}")
            return output_file
            
        except Exception as e:
            print(f"Error creating metrics summary: {str(e)}")
            raise


def main():
    """Main program for visualization"""
    print("\n" + "="*70)
    print(" " * 15 + "VOICE ANALYSIS VISUALIZER")
    print(" " * 10 + "Windows Compatible (Non-GUI Backend)")
    print("="*70 + "\n")
    
    # Find recent analysis files
    audio_file = input("Enter path to audio file (or press Enter to find recent): ").strip()
    
    if not audio_file or not Path(audio_file).exists():
        # Find most recent audio file
        audio_files = list(Path('.').glob('voice_recording_*.wav'))
        if audio_files:
            audio_file = str(sorted(audio_files)[-1])
            print(f"Using recent file: {audio_file}\n")
        else:
            print("No audio file found!")
            return
    
    # Find corresponding metrics
    metrics_file = input("Enter path to metrics JSON (or press Enter for auto-detect): ").strip()
    
    if not metrics_file or not Path(metrics_file).exists():
        # Find most recent metrics file
        metrics_files = list(Path('.').glob('voice_analysis_*.json'))
        if metrics_files:
            metrics_file = str(sorted(metrics_files)[-1])
            print(f"Using metrics file: {metrics_file}\n")
        else:
            metrics_file = None
    
    # Load metrics if available
    metrics = None
    if metrics_file:
        metrics = VoiceVisualizer.load_metrics_json(metrics_file)
        print(f"Loaded metrics from {metrics_file}\n")
    
    # Create visualizer
    try:
        visualizer = VoiceVisualizer(audio_file, metrics)
        
        print("Creating visualizations...\n")
        
        # Create comprehensive visualization
        try:
            viz_file = visualizer.create_comprehensive_visualization()
        except Exception as e:
            print(f"Could not create comprehensive visualization: {str(e)}")
            viz_file = None
        
        # Create comparison charts
        try:
            comp_file = visualizer.create_metrics_comparison_chart()
        except Exception as e:
            print(f"Could not create comparison chart: {str(e)}")
            comp_file = None
        
        # Always create metrics summary
        try:
            summary_file = visualizer.create_simple_metrics_chart()
        except Exception as e:
            print(f"Could not create metrics summary: {str(e)}")
            summary_file = None
        
        print("\nVisualization complete!")
        if viz_file:
            print(f"   Comprehensive: {viz_file}")
        if comp_file:
            print(f"   Comparison: {comp_file}")
        if summary_file:
            print(f"   Summary: {summary_file}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()