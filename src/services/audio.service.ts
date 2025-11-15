
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioContext: AudioContext | null = null;

  private initializeAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playKorotkoffSound(intensity: number): void {
    this.initializeAudioContext();
    if (!this.audioContext) return;

    const context = this.audioContext;
    const now = context.currentTime;

    // The sound is a combination of a low thump and a subtle noise burst
    
    // Low thump (oscillator)
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(70, now); // Low frequency for a "thump"

    // Volume envelope (GainNode)
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0, now);
    // Sharp attack
    gainNode.gain.linearRampToValueAtTime(intensity, now + 0.01);
    // Quick decay
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    // Noise component for "clarity"
    const bufferSize = context.sampleRate * 0.1; // 0.1 seconds of noise
    const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = context.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(intensity * 0.1, now + 0.01); // Noise is quieter
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);


    // Connect the nodes
    oscillator.connect(gainNode);
    noiseSource.connect(noiseGain);
    
    gainNode.connect(context.destination);
    noiseGain.connect(context.destination);

    // Start and stop the sound
    oscillator.start(now);
    noiseSource.start(now);
    
    oscillator.stop(now + 0.1);
    noiseSource.stop(now + 0.1);
  }
}
