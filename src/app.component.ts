
import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManometerComponent } from './components/manometer/manometer.component';
import { AudioService } from './services/audio.service';

type GameState = 'idle' | 'inflating' | 'deflating' | 'finished';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ManometerComponent],
})
export class AppComponent {
  private audioService = inject(AudioService);
  private gameLoopInterval: any;
  private lastBeatTime = 0;

  gameState = signal<GameState>('idle');
  currentPressure = signal(0);
  
  simulatedSystolic = signal(0);
  simulatedDiastolic = signal(0);
  simulatedHeartRate = signal(0);
  soundClarity = signal(1);

  playerSystolic = signal<number | null>(null);
  playerDiastolic = signal<number | null>(null);

  feedbackMessage = signal('');
  feedbackDetails = signal('');
  
  isDeflating = computed(() => this.gameState() === 'deflating');

  startGame(): void {
    this.playerSystolic.set(null);
    this.playerDiastolic.set(null);
    this.feedbackMessage.set('');
    this.feedbackDetails.set('');
    this.currentPressure.set(0);

    // Generate random patient data
    const diastolic = Math.floor(Math.random() * (95 - 60 + 1)) + 60; // 60-95
    const systolic = diastolic + (Math.floor(Math.random() * (70 - 30 + 1)) + 30); // 30-70 mmHg higher
    this.simulatedDiastolic.set(diastolic);
    this.simulatedSystolic.set(systolic);
    this.simulatedHeartRate.set(Math.floor(Math.random() * (100 - 55 + 1)) + 55); // 55-100 bpm
    this.soundClarity.set(0.7 + Math.random() * 0.3); // 0.7-1.0 intensity

    this.gameState.set('inflating');
    this.inflateCuff();
  }

  private inflateCuff(): void {
    const inflationTarget = this.simulatedSystolic() + 30;
    const inflationInterval = setInterval(() => {
      this.currentPressure.update(p => {
        const newPressure = p + 5;
        if (newPressure >= inflationTarget) {
          clearInterval(inflationInterval);
          this.startDeflation();
          return inflationTarget;
        }
        return newPressure;
      });
    }, 50);
  }

  private startDeflation(): void {
    this.gameState.set('deflating');
    this.lastBeatTime = Date.now();
    const deflationRatePerSecond = 2.5; // 2-3 mmHg/sec
    const updateInterval = 50; // ms
    const pressureDropPerInterval = deflationRatePerSecond / (1000 / updateInterval);
    
    this.gameLoopInterval = setInterval(() => {
      this.currentPressure.update(p => p - pressureDropPerInterval);
      const pressure = this.currentPressure();

      if (pressure <= this.simulatedDiastolic() - 15) {
        this.endGame();
        return 0;
      }
      
      this.playKorotkoffSounds(pressure);

    }, updateInterval);
  }

  private playKorotkoffSounds(pressure: number): void {
    const beatInterval = 60000 / this.simulatedHeartRate();
    const now = Date.now();

    if (now - this.lastBeatTime >= beatInterval) {
      if (pressure <= this.simulatedSystolic() && pressure >= this.simulatedDiastolic()) {
        this.audioService.playKorotkoffSound(this.soundClarity());
        this.lastBeatTime = now;
      }
    }
  }

  markSystolic(): void {
    if (this.isDeflating() && this.playerSystolic() === null) {
      this.playerSystolic.set(Math.round(this.currentPressure()));
    }
  }

  markDiastolic(): void {
    if (this.isDeflating() && this.playerDiastolic() === null) {
      this.playerDiastolic.set(Math.round(this.currentPressure()));
    }
  }

  private endGame(): void {
    if(this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
    this.gameState.set('finished');
    this.calculateFeedback();
  }

  private calculateFeedback(): void {
    const sys = this.playerSystolic();
    const dia = this.playerDiastolic();
    const realSys = this.simulatedSystolic();
    const realDia = this.simulatedDiastolic();

    if (sys === null || dia === null) {
      this.feedbackMessage.set('Intento incompleto');
      this.feedbackDetails.set('Debes marcar tanto la presión sistólica como la diastólica. ¡Inténtalo de nuevo!');
      return;
    }

    const sysDiff = Math.abs(realSys - sys);
    const diaDiff = Math.abs(realDia - dia);

    if (sysDiff <= 3 && diaDiff <= 3) {
      this.feedbackMessage.set('¡Excelente Precisión! 🎯');
      this.feedbackDetails.set('Tus mediciones son muy precisas. Has identificado los sonidos de Korotkoff perfectamente.');
    } else if (sysDiff <= 7 && diaDiff <= 7) {
      this.feedbackMessage.set('¡Buen Trabajo! 👍');
      this.feedbackDetails.set('Estás muy cerca. Con un poco más de práctica, tus mediciones serán perfectas.');
    } else {
      this.feedbackMessage.set('Necesita mejorar 👨‍⚕️');
      this.feedbackDetails.set('La práctica es clave. Concéntrate en escuchar el primer sonido claro y el momento exacto en que desaparecen por completo.');
    }
  }
}
