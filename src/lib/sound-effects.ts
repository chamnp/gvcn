// Web Audio API Synthesizer for instant zero-dependency classroom sound effects

export type SoundEffectType =
  | 'applause'
  | 'bell'
  | 'drumroll'
  | 'victory'
  | 'confetti'
  | 'buzzer'
  | 'star_ding'
  | 'wheel_click';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSoundEffect(type: SoundEffectType) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'bell': {
        // Crisp dual chime bell
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5
        osc1.frequency.exponentialRampToValueAtTime(440, now + 1.2);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1760, now); // A6
        osc2.frequency.exponentialRampToValueAtTime(880, now + 1.2);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
        break;
      }

      case 'star_ding': {
        // High sparkle ding for star award
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1046.5, now); // C6
        osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.15); // G6
        osc.frequency.exponentialRampToValueAtTime(2093.0, now + 0.35); // C7

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
        break;
      }

      case 'victory': {
        // 4-note victory trumpet fanfare: C5 -> E5 -> G5 -> C6
        const notes = [523.25, 659.25, 783.99, 1046.5];
        const times = [0, 0.15, 0.3, 0.45];
        const durations = [0.12, 0.12, 0.12, 0.6];

        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + times[i]);

          gain.gain.setValueAtTime(0.2, now + times[i]);
          gain.gain.exponentialRampToValueAtTime(0.001, now + times[i] + durations[i]);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + times[i]);
          osc.stop(now + times[i] + durations[i]);
        });
        break;
      }

      case 'buzzer': {
        // Low buzzer sound for incorrect answer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(110, now + 0.15);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
        break;
      }

      case 'applause':
      case 'confetti': {
        // Noise burst with rising cheering effect
        const bufferSize = ctx.sampleRate * 0.8;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.Q.setValueAtTime(3, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + 0.8);
        break;
      }

      case 'drumroll': {
        // Rapid snare-like tapping
        for (let i = 0; i < 12; i++) {
          const t = now + i * 0.06;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(180 + Math.random() * 40, t);

          gain.gain.setValueAtTime(0.15 + (i / 12) * 0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(t);
          osc.stop(t + 0.05);
        }
        break;
      }

      case 'wheel_click': {
        // Fast wood click for wheel spinning
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.03);
        break;
      }
    }
  } catch (err) {
    console.warn('Could not play sound effect:', err);
  }
}
