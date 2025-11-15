
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-manometer',
  templateUrl: './manometer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ManometerComponent {
  pressure = input(0);

  // Maps pressure (0-300 mmHg) to a rotation angle (-135 to 135 degrees)
  private readonly MIN_ANGLE = -135;
  private readonly MAX_ANGLE = 135;
  private readonly MAX_PRESSURE = 300;

  needleRotation = computed(() => {
    const pressureValue = this.pressure();
    const pressureRatio = Math.min(pressureValue / this.MAX_PRESSURE, 1);
    const angleRange = this.MAX_ANGLE - this.MIN_ANGLE;
    const angle = this.MIN_ANGLE + pressureRatio * angleRange;
    return `rotate(${angle} 100 100)`;
  });

  // Generate ticks for the gauge
  gaugeTicks = computed(() => {
    const ticks = [];
    for (let i = 0; i <= this.MAX_PRESSURE; i += 10) {
      const isLabelTick = i % 20 === 0;
      const pressureRatio = i / this.MAX_PRESSURE;
      const angleRange = this.MAX_ANGLE - this.MIN_ANGLE;
      const angle = this.MIN_ANGLE + pressureRatio * angleRange;
      
      ticks.push({
        pressure: i,
        isLabel: isLabelTick,
        transform: `rotate(${angle} 100 100)`,
        textTransform: `rotate(${-angle} 100 100)`
      });
    }
    return ticks;
  });
}
