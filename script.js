// ------------------------ PANTALLA DE CARGA ------------------------
window.addEventListener("DOMContentLoaded", () => {
  const fill = document.getElementById("progress-fill");
  const text = document.getElementById("progress-text");
  const bubble = document.getElementById("progress-bubble");
  let percent = 0;

  const interval = setInterval(() => {
    percent++;
    fill.style.width = percent + "%";
    text.innerText = percent + "%";
    bubble.style.left = percent + "%";

    if (percent >= 100) {
      clearInterval(interval);
      document.getElementById("loading").style.display = "none";
      document.getElementById("game").style.display = "flex";
    }
  }, 40);
});

// ------------------------ VARIABLES ------------------------
const premios = [
  { nombre: "100% BONO", angulo: 0 },
  { nombre: "150% BONO", angulo: 60 },
  { nombre: "200% BONO", angulo: 120 },
  { nombre: "OTRO GIRO", angulo: 180 },
  { nombre: "30% BONO", angulo: 240 },
  { nombre: "50% BONO", angulo: 300 }
];

const musica = document.getElementById("musica-fondo");
const sonidoRuleta = document.getElementById("sonido-ruleta");
const sonidoGanador = document.getElementById("sonido-ganador");

const hoy = new Date().toISOString().split("T")[0];
let permitirReintento = false;
let yaGiro = localStorage.getItem("ultimoGiro") === hoy;
let ruletaGirando = false;

// ------------------------ EFECTOS DE AUDIO ------------------------
function fadeOut(audio, duration = 1000) {
  let step = 0.05;
  const interval = setInterval(() => {
    if (audio.volume > step) {
      audio.volume = Math.max(0, audio.volume - step);
    } else {
      audio.volume = 0;
      audio.pause();
      clearInterval(interval);
    }
  }, duration * step);
}

function fadeIn(audio, volumeTarget = 0.4, duration = 1000) {
  audio.volume = 0;
  audio.play();
  let step = 0.05;
  const interval = setInterval(() => {
    if (audio.volume < volumeTarget - step) {
      audio.volume = Math.min(volumeTarget, audio.volume + step);
    } else {
      audio.volume = volumeTarget;
      clearInterval(interval);
    }
  }, duration * step);
}

// ------------------------ DETECCIÓN DE PREMIO ------------------------
function detectarPremioPorAngulo(angulo) {
  const ang = angulo % 360;
  if (ang >= 330 || ang < 30) return "100% BONO";
  if (ang >= 30 && ang < 90) return "50% BONO";
  if (ang >= 90 && ang < 150) return "30% BONO";
  if (ang >= 150 && ang < 210) return "OTRO GIRO";
  if (ang >= 210 && ang < 270) return "200% BONO";
  if (ang >= 270 && ang < 330) return "150% BONO";
}

// ------------------------ BOTÓN DE GIRO ------------------------
document.getElementById("girar-btn").addEventListener("click", () => {
  if (ruletaGirando) return;
  if (yaGiro && !permitirReintento) {
    mostrarPopupAviso(); // 🌊 mensaje personalizado
    return;
  }
  iniciarGiro();
});

// ------------------------ GIRO DE RULETA ------------------------
function iniciarGiro() {
  ruletaGirando = true;
  const premio = premios[Math.floor(Math.random() * premios.length)];
  const ruleta = document.getElementById("ruleta");

  fadeOut(musica);
  
  sonidoRuleta.currentTime = 0;
  sonidoRuleta.volume = 0.7;
  
  sonidoRuleta.play().then(() => {
    const duracion = sonidoRuleta.duration;
  
    // Dividimos el tiempo total en 70% rápido y 30% lento
    const porcentajeRapido = 0.7;
    const tiempoRapido = duracion * porcentajeRapido;
    const tiempoLento = duracion * (1 - porcentajeRapido);
  
    // Cálculo de grados según duración
    const vueltasRapidas = 6 * tiempoRapido; // vueltas por segundo
    const gradosRapidos = 360 * vueltasRapidas;
    const gradosLentos = 720; // siempre al menos 2 vueltas
    const gradosFinales = gradosRapidos + gradosLentos + premio.angulo;
  
    // Reset visual
    ruleta.style.transition = "none";
    ruleta.style.transform = "rotate(0deg)";
    void ruleta.offsetWidth;
  
    // Giro rápido
    ruleta.style.transition = `transform ${tiempoRapido}s linear`;
    ruleta.style.transform = `rotate(${gradosRapidos}deg)`;
  
    // Giro lento (desaceleración)
    setTimeout(() => {
      ruleta.style.transition = `transform ${tiempoLento}s cubic-bezier(0.1, 0.9, 0.3, 1)`;
      ruleta.style.transform = `rotate(${gradosFinales}deg)`;
    }, tiempoRapido * 1000);
  
    // Al finalizar todo el audio (duración total)
    setTimeout(() => {
      if (sonidoGanador) {
        sonidoGanador.currentTime = 0;
        sonidoGanador.volume = 0.9;
        sonidoGanador.play().catch(() => {});
      }
  
      const premioObtenido = detectarPremioPorAngulo(gradosFinales);
      localStorage.setItem("premioObtenido", premioObtenido);
      mostrarPopup(premioObtenido);
  
      if (premioObtenido === "OTRO GIRO") {
        permitirReintento = true;
      } else {
        localStorage.setItem("ultimoGiro", hoy);
        permitirReintento = false;
        yaGiro = true;
      }
  
      ruletaGirando = false;
    }, duracion * 1000);
  
  }).catch(err => {
    console.error("Error al reproducir el sonido de ruleta:", err);
  });
}

// ------------------------ MOSTRAR POPUP DE PREMIO ------------------------
function mostrarPopup(premioObtenido) {
  const popup = document.getElementById("popup-premio");
  const texto = document.getElementById("texto-premio");
  const fecha = document.getElementById("popup-fecha");

  // 🎯 Texto del premio
  texto.textContent = premioObtenido;

  // 🕒 Mostrar fecha y hora actual
  const ahora = new Date();
  const fechaStr = ahora.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  fecha.textContent = fechaStr;

  // 📦 Mostrar el popup
  popup.classList.remove("hidden");

  if (!sonidoRuleta.paused) {
    sonidoRuleta.pause();
    sonidoRuleta.currentTime = 0;
  }

  const popupBox = popup.querySelector(".popup");
  popupBox.style.animation = "none";
  void popupBox.offsetWidth;
  popupBox.style.animation = "popupEntrada 0.5s ease-out, popupPulse 1.5s ease-in-out infinite";

  // 🎉 Confetti
  confetti({
    particleCount: 150,
    spread: 90,
    startVelocity: 45,
    origin: { y: 0.6 },
    colors: ['#FFD700', '#000000', '#FFFFFF', '#C0C0C0'], // dorado, negro, blanco, plata
    zIndex: 1000
  });
}

// ------------------------ CERRAR POPUP DE PREMIO ------------------------
function cerrarPopup() {
  document.getElementById("popup-premio").classList.add("hidden");
  fadeIn(musica);
}

// ------------------------ MOSTRAR POPUP AVISO 🌊 ------------------------
function mostrarPopupAviso() {
  const popup = document.getElementById("popup-aviso");
  const mensaje = document.getElementById("mensaje-aviso");

  // Obtener premio y fecha del localStorage o definir por defecto
  const premio = localStorage.getItem("premioObtenido") || "un premio";
  const fechaHoy = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Insertar el mensaje personalizado
  mensaje.innerHTML = `¡Hola!<br>Hoy ${fechaHoy} ya ganaste <strong>${premio}</strong>.<br>Volvé mañana y probamos suerte de nuevo 🎲`;

  // Mostrar el popup con animación
  popup.classList.remove("hidden");
  const popupBox = popup.querySelector(".popup");
  popupBox.style.animation = "none";
  void popupBox.offsetWidth;
  popupBox.style.animation = "popupEntrada 0.5s ease-out, popupPulse 1.5s ease-in-out infinite";
}

// ------------------------ CERRAR POPUP AVISO ------------------------
function cerrarPopupAviso() {
  document.getElementById("popup-aviso").classList.add("hidden");
}

