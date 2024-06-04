class Speaker {
  init(initialVolume = 0.01) {
    if (!this.audioCtx) {
      this.audioCtx = new window.AudioContext();

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.connect(this.audioCtx.destination);

      this.gainNode.gain.setValueAtTime(initialVolume, this.audioCtx.currentTime);

      this.isEmitting = false;
      this.isMuted = false;
      this.lastVol = 0;
    }
  }

  emit(freq = 440) {
    if (this.audioCtx && !this.oscillatorNode) {
      this.oscillatorNode = this.audioCtx.createOscillator();
      this.oscillatorNode.type = "square";
      this.oscillatorNode.connect(this.gainNode);

      this.oscillatorNode.frequency.setValueAtTime(
        freq,
        this.audioCtx.currentTime
      );

      this.oscillatorNode.start();

      this.isEmitting = true;
    }
  }

  setVolume(vol) {
    if (this.audioCtx) {
      const clampedVol = Math.min(Math.max(vol, 0), 1);
      this.gainNode.gain.setValueAtTime(clampedVol, this.audioCtx.currentTime);
    }
  }

  stop() {
    if (this.oscillatorNode) {
      this.oscillatorNode.stop();
      this.oscillatorNode.disconnect();
      this.oscillatorNode = null;

      this.isEmitting = false;
    }
  }

  mute() {
    if (!this.isMuted) {
      this.lastVol = this.gainNode.gain;
      this.setVolume(0);

      this.isMuted = true;
    }
  }

  unmute() {
    if (this.isMuted) {
      this.setVolume(this.lastVol);
      this.isMuted = false;
    }
  }
}

export default Speaker;
