let contextoAudio = null;

export function prepararSomAviso() {
  try {
    const AudioContexto = window.AudioContext || window.webkitAudioContext;
    if (!AudioContexto) return;
    if (!contextoAudio) contextoAudio = new AudioContexto();
    if (contextoAudio.state === "suspended") contextoAudio.resume().catch(() => {});
  } catch {
    // O aviso visual funciona mesmo sem áudio.
  }
}

export function tocarSomAviso() {
  if (!contextoAudio || contextoAudio.state !== "running") return;

  try {
    const inicio = contextoAudio.currentTime + 0.02;
    [587.33, 440].forEach((frequencia, indice) => {
      const tempo = inicio + indice * 0.16;
      const oscilador = contextoAudio.createOscillator();
      const volume = contextoAudio.createGain();
      oscilador.type = "sine";
      oscilador.frequency.value = frequencia;
      volume.gain.setValueAtTime(0.0001, tempo);
      volume.gain.exponentialRampToValueAtTime(0.20, tempo + 0.025);
      volume.gain.exponentialRampToValueAtTime(0.0001, tempo + 0.19);
      oscilador.connect(volume);
      volume.connect(contextoAudio.destination);
      oscilador.start(tempo);
      oscilador.stop(tempo + 0.2);
    });
  } catch {
    // Não impede a exibição do aviso.
  }
}
