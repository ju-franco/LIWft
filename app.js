// Variáveis globais de controle de filtro e pesquisa da biblioteca
let currentSearchQuery = "";
let selectedTagsSet = new Set(["todos"]);
let weightChartInstance;
let weightProgressChartInstance;
let historyExpanded = false;

// Ícones SVG globais para acesso em qualquer função
const SVG_CHECK = `<svg class="status-icon-svg completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const SVG_CIRCLE = `<svg class="status-icon-svg pending" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg>`;
const SVG_TRASH = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
const SVG_PENCIL = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
const SVG_DOT_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

// NOVO: SVGs do timer de descanso
const SVG_PAUSE = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`;
const SVG_PLAY = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>`;
const SVG_REFRESH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`;

// Registra o Service Worker para habilitar o cache offline e PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        console.log("Service Worker registrado com sucesso! Escopo:", registration.scope);
      })
      .catch((error) => {
        console.log("Falha ao registrar o Service Worker:", error);
      });
  });
}

// Função para minimizar o treino
window.minimizeSession = function() {
  const modal = document.getElementById("modal-active-session");
  const minibar = document.getElementById("minimized-workout-bar");
  if (modal) modal.classList.add("hidden");
  if (minibar) minibar.classList.remove("hidden");
};

// Função para restaurar o treino
window.restoreSession = function() {
  const modal = document.getElementById("modal-active-session");
  const minibar = document.getElementById("minimized-workout-bar");
  if (modal) modal.classList.remove("hidden");
  if (minibar) minibar.classList.add("hidden");
};
window.restoreActiveSession = window.restoreSession;

// ============================================================
// TIMER DE DESCANSO FLUTUANTE (arrastável, não-bloqueante)
// ============================================================
const RestTimer = {
  totalSeconds: 90,
  remainingSeconds: 90,
  isRunning: false,
  intervalId: null,
  finished: false,
  bubbleEl: null,
  displayEl: null,
  progressEl: null,
  playPauseBtnEl: null,

  // Drag state
  isDragging: false,
  dragOffsetX: 0,
  dragOffsetY: 0,
  hasMoved: false,

  init() {
    this.bubbleEl = document.getElementById("rest-timer-bubble");
    this.displayEl = document.getElementById("rest-timer-display");
    this.progressEl = document.getElementById("rest-timer-progress-bar");
    this.playPauseBtnEl = document.getElementById("btn-rest-timer-playpause");

    if (!this.bubbleEl) return;

    document
      .getElementById("btn-close-rest-timer")
      ?.addEventListener("click", () => this.close());

    this.playPauseBtnEl?.addEventListener("click", () => {
      if (this.finished) {
        this.reset(this.totalSeconds);
      } else {
        this.togglePlayPause();
      }
    });

    this.bubbleEl.querySelectorAll(".rest-timer-btn[data-add]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const add = parseInt(btn.getAttribute("data-add"), 10) || 0;
        this.addSeconds(add);
      });
    });

    this.bubbleEl.querySelectorAll(".rest-timer-preset").forEach((btn) => {
      btn.addEventListener("click", () => {
        const preset = parseInt(btn.getAttribute("data-preset"), 10) || 90;
        this.start(preset);
      });
    });

    this.restorePosition();
    this.setupDrag();
    this.updateUI();

    window.addEventListener("resize", () => {
      if (!this.bubbleEl.classList.contains("hidden")) {
        this.clampToViewport();
      }
    });
  },

  restorePosition() {
    try {
      const saved = JSON.parse(localStorage.getItem("my_rest_timer_pos") || "null");
      if (saved && typeof saved.x === "number" && typeof saved.y === "number") {
        this.bubbleEl.style.left = `${saved.x}px`;
        this.bubbleEl.style.top = `${saved.y}px`;
        this.bubbleEl.style.right = "auto";
        this.bubbleEl.style.bottom = "auto";
      }
    } catch (e) {}
  },

  savePosition() {
    const rect = this.bubbleEl.getBoundingClientRect();
    localStorage.setItem("my_rest_timer_pos", JSON.stringify({
      x: Math.round(rect.left),
      y: Math.round(rect.top),
    }));
  },

  clampToViewport() {
    const rect = this.bubbleEl.getBoundingClientRect();
    const margin = 8;
    const maxX = window.innerWidth - rect.width - margin;
    const maxY = window.innerHeight - rect.height - margin;

    let newLeft = Math.min(Math.max(rect.left, margin), maxX);
    let newTop = Math.min(Math.max(rect.top, margin), maxY);

    this.bubbleEl.style.left = `${newLeft}px`;
    this.bubbleEl.style.top = `${newTop}px`;
    this.bubbleEl.style.right = "auto";
    this.bubbleEl.style.bottom = "auto";
  },

  setupDrag() {
    const header = this.bubbleEl.querySelector(".rest-timer-header");
    if (!header) return;

    const onPointerDown = (e) => {
      if (e.target.closest("button")) return;

      e.preventDefault();

      const rect = this.bubbleEl.getBoundingClientRect();
      const point = e.touches ? e.touches[0] : e;

      this.isDragging = true;
      this.hasMoved = false;
      this.dragOffsetX = point.clientX - rect.left;
      this.dragOffsetY = point.clientY - rect.top;

      this.bubbleEl.classList.add("dragging");

      this.bubbleEl.style.right = "auto";
      this.bubbleEl.style.bottom = "auto";
      this.bubbleEl.style.left = `${rect.left}px`;
      this.bubbleEl.style.top = `${rect.top}px`;

      document.addEventListener("mousemove", onPointerMove);
      document.addEventListener("mouseup", onPointerUp);
      document.addEventListener("touchmove", onPointerMove, { passive: false });
      document.addEventListener("touchend", onPointerUp);
      document.addEventListener("touchcancel", onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      e.preventDefault();

      const point = e.touches ? e.touches[0] : e;
      const rect = this.bubbleEl.getBoundingClientRect();
      const margin = 8;

      let newLeft = point.clientX - this.dragOffsetX;
      let newTop = point.clientY - this.dragOffsetY;

      newLeft = Math.min(Math.max(newLeft, margin), window.innerWidth - rect.width - margin);
      newTop = Math.min(Math.max(newTop, margin), window.innerHeight - rect.height - margin);

      this.bubbleEl.style.left = `${newLeft}px`;
      this.bubbleEl.style.top = `${newTop}px`;

      if (Math.abs(newLeft - rect.left) > 3 || Math.abs(newTop - rect.top) > 3) {
        this.hasMoved = true;
      }
    };

    const onPointerUp = () => {
      if (!this.isDragging) return;

      this.isDragging = false;
      this.bubbleEl.classList.remove("dragging");

      if (this.hasMoved) this.savePosition();

      document.removeEventListener("mousemove", onPointerMove);
      document.removeEventListener("mouseup", onPointerUp);
      document.removeEventListener("touchmove", onPointerMove);
      document.removeEventListener("touchend", onPointerUp);
      document.removeEventListener("touchcancel", onPointerUp);
    };

    header.addEventListener("mousedown", onPointerDown);
    header.addEventListener("touchstart", onPointerDown, { passive: false });
  },

  start(seconds) {
    this.totalSeconds = seconds;
    this.remainingSeconds = seconds;
    this.finished = false;
    this.isRunning = true;

    this.bubbleEl.querySelectorAll(".rest-timer-preset").forEach((b) => {
      b.classList.toggle("active", parseInt(b.getAttribute("data-preset"), 10) === seconds);
    });

    this.bubbleEl.classList.remove("hidden", "finished");

    if (!localStorage.getItem("my_rest_timer_pos")) {
      const rect = this.bubbleEl.getBoundingClientRect();
      const defaultX = window.innerWidth - rect.width - 16;
      const defaultY = window.innerHeight - rect.height - 100;
      this.bubbleEl.style.left = `${defaultX}px`;
      this.bubbleEl.style.top = `${defaultY}px`;
      this.bubbleEl.style.right = "auto";
      this.bubbleEl.style.bottom = "auto";
    } else {
      this.clampToViewport();
    }

    this.updateUI();
    this.startInterval();
  },

  startInterval() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      if (!this.isRunning) return;
      this.remainingSeconds -= 1;

      if (this.remainingSeconds <= 0) {
        this.remainingSeconds = 0;
        this.finish();
      }
      this.updateUI();
    }, 1000);
  },

  finish() {
    this.isRunning = false;
    this.finished = true;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.bubbleEl.classList.add("finished");

    if (navigator.vibrate) {
      try { navigator.vibrate([200, 100, 200, 100, 400]); } catch (e) {}
    }

    this.updateUI();
  },

  togglePlayPause() {
    if (this.finished) return;
    this.isRunning = !this.isRunning;
    this.updateUI();
  },

  addSeconds(sec) {
    this.remainingSeconds = Math.max(0, this.remainingSeconds + sec);
    this.totalSeconds = Math.max(this.totalSeconds, this.remainingSeconds);
    this.finished = false;
    this.bubbleEl.classList.remove("finished");
    if (this.remainingSeconds > 0 && !this.intervalId) {
      this.isRunning = true;
      this.startInterval();
    }
    this.updateUI();
  },

  reset(seconds) {
    this.start(seconds || this.totalSeconds);
  },

  close() {
    this.isRunning = false;
    this.finished = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.bubbleEl.classList.add("hidden");
    this.bubbleEl.classList.remove("finished");
  },

  updateUI() {
    if (!this.displayEl) return;

    const mins = String(Math.floor(this.remainingSeconds / 60)).padStart(2, "0");
    const secs = String(this.remainingSeconds % 60).padStart(2, "0");
    this.displayEl.textContent = `${mins}:${secs}`;

    if (this.progressEl) {
      const pct = this.totalSeconds > 0
        ? (this.remainingSeconds / this.totalSeconds) * 100
        : 0;
      this.progressEl.style.width = `${pct}%`;
    }

    // NOVO: usa SVG em vez de emoji
    if (this.playPauseBtnEl) {
      if (this.finished) {
        this.playPauseBtnEl.innerHTML = SVG_REFRESH;
      } else if (this.isRunning) {
        this.playPauseBtnEl.innerHTML = SVG_PAUSE;
      } else {
        this.playPauseBtnEl.innerHTML = SVG_PLAY;
      }
    }
  },

  triggerDefault() {
    if (!this.bubbleEl) return;
    this.start(this.totalSeconds || 90);
  },
};

window.RestTimer = RestTimer;

document.addEventListener("DOMContentLoaded", () => {
  RestTimer.init();

  if (typeof DB !== "undefined") {
    if (DB.setupDatalist) DB.setupDatalist();
    if (DB.migrateExerciseWeights) DB.migrateExerciseWeights();

    if (DB.initDefaultExercisesAnatomy) {
      DB.initDefaultExercisesAnatomy().then(() => {
        renderExerciseLibrary();
      });
    }
  }

  // ============================================================
  // EXPORT / IMPORT / WIPE DE DADOS
  // ============================================================
  const btnExportData = document.getElementById("btn-export-data");
  const btnImportData = document.getElementById("btn-import-data");
  const inputImportFile = document.getElementById("input-import-file");
  const btnWipeData = document.getElementById("btn-wipe-data");

  if (btnExportData) {
    btnExportData.addEventListener("click", () => {
      try {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("my_")) {
            data[key] = localStorage.getItem(key);
          }
        }

        const payload = {
          app: "LIWft",
          version: 1,
          exportedAt: new Date().toISOString(),
          data,
        };

        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const filename = `liwft-backup-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}.json`;

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(`Backup exportado com sucesso!\n\nArquivo: ${filename}`);
      } catch (err) {
        console.error("Erro ao exportar:", err);
        alert("Erro ao exportar os dados. Veja o console.");
      }
    });
  }

  if (btnImportData && inputImportFile) {
    btnImportData.addEventListener("click", () => {
      inputImportFile.click();
    });

    inputImportFile.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);

          if (!parsed || !parsed.data || typeof parsed.data !== "object") {
            alert("Arquivo inválido. Esperado um backup do LIWft.");
            inputImportFile.value = "";
            return;
          }

          const keys = Object.keys(parsed.data);
          if (keys.length === 0) {
            alert("O arquivo de backup está vazio.");
            inputImportFile.value = "";
            return;
          }

          const confirmed = confirm(
            `Isso vai SUBSTITUIR todos os seus dados atuais pelos dados do backup.\n\n` +
            `Exportado em: ${parsed.exportedAt || "data desconhecida"}\n` +
            `Chaves encontradas: ${keys.length}\n\n` +
            `Deseja continuar?`
          );

          if (!confirmed) {
            inputImportFile.value = "";
            return;
          }

          keys.forEach((key) => {
            if (key.startsWith("my_")) {
              localStorage.setItem(key, parsed.data[key]);
            }
          });

          alert("Backup restaurado com sucesso! O app será recarregado.");
          window.location.reload();
        } catch (err) {
          console.error("Erro ao importar:", err);
          alert("Erro ao ler o arquivo. Verifique se é um JSON válido do LIWft.");
          inputImportFile.value = "";
        }
      };
      reader.readAsText(file);
    });
  }

  if (btnWipeData) {
    btnWipeData.addEventListener("click", () => {
      const first = confirm(
        "⚠ ATENÇÃO: isso vai APAGAR TODOS os seus dados (treinos, histórico, perfil, biblioteca personalizada).\n\nDeseja continuar?"
      );
      if (!first) return;

      const second = confirm(
        "TEM CERTEZA? Essa ação não pode ser desfeita.\n\nRecomendamos exportar um backup antes."
      );
      if (!second) return;

      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("my_")) keysToRemove.push(key);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));

        alert("Todos os dados foram apagados. O app será recarregado.");
        window.location.reload();
      } catch (err) {
        console.error("Erro ao apagar:", err);
        alert("Erro ao apagar os dados.");
      }
    });
  }

  // MODAL DE PERFIL E GRÁFICO DE PESO
  const modalProfile = document.getElementById("modal-profile");
  const btnOpenProfile = document.getElementById("btn-open-profile");
  const closeBtnProfile = document.querySelector(".close-modal-profile");
  const formProfile = document.getElementById("form-profile");

  if (btnOpenProfile && modalProfile) {
    btnOpenProfile.addEventListener("click", () => {
      const profile = DB.getProfile();
      document.getElementById("profile-name").value = profile.name || "";
      document.getElementById("profile-gender").value = profile.gender || "Masculino";
      document.getElementById("profile-age").value = profile.age || "";
      document.getElementById("profile-goal").value = profile.goal || "";
      document.getElementById("profile-height").value = profile.height || "";
      document.getElementById("profile-weight").value = profile.weight || "";

      modalProfile.classList.remove("hidden");
      renderWeightChart();
    });
  }

  if (closeBtnProfile && modalProfile) {
    closeBtnProfile.addEventListener("click", () => modalProfile.classList.add("hidden"));
  }

  if (formProfile) {
    formProfile.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("profile-name").value;
      const gender = document.getElementById("profile-gender").value;
      const age = document.getElementById("profile-age").value;
      const goal = document.getElementById("profile-goal").value;
      const height = document.getElementById("profile-height").value;
      const weight = document.getElementById("profile-weight").value;

      DB.saveProfile({ name, gender, age, goal, height, weight });
      alert("Ficha técnica e perfil atualizados com sucesso!");
      renderWeightChart();
    });
  }

  function renderWeightChart() {
    const canvas = document.getElementById("weightChart");
    if (!canvas) return;

    const historyData = DB.getWeightHistory();

    if (weightChartInstance) weightChartInstance.destroy();

    const ctx = canvas.getContext("2d");
    weightChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: historyData.map((h) => h.date),
        datasets: [
          {
            label: "Peso (kg)",
            data: historyData.map((h) => h.weight),
            borderColor: "#cc00ff",
            backgroundColor: "rgba(204, 0, 255, 0.1)",
            borderWidth: 2,
            pointBackgroundColor: "#cc00ff",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#8e8f96", font: { size: 10 } } },
          y: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#8e8f96", font: { size: 10 } } },
        },
      },
    });
  }

  // MODAL DE HISTÓRICO DE CARGA
  const modalWeightProgress = document.getElementById("modal-weight-progress");
  const closeBtnWeightProgress = document.querySelector(".close-modal-weight-progress");

  if (closeBtnWeightProgress && modalWeightProgress) {
    closeBtnWeightProgress.addEventListener("click", () => {
      modalWeightProgress.classList.add("hidden");
    });
  }

  window.openWeightProgressModal = function (exerciseId, exerciseName) {
    if (!modalWeightProgress) return;

    const titleEl = document.getElementById("weight-progress-title");
    if (titleEl) titleEl.textContent = exerciseName || "Histórico de Carga";

    const entries = DB.getWeightProgress(exerciseId);

    const canvas = document.getElementById("weightProgressChart");
    if (canvas) {
      if (weightProgressChartInstance) weightProgressChartInstance.destroy();

      const labels = entries.map((e) => `${e.date}`);
      const data = entries.map((e) => e.weight);

      const ctx = canvas.getContext("2d");
      weightProgressChartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels.length > 0 ? labels : ["Sem registros"],
          datasets: [
            {
              label: "Carga (kg)",
              data: data.length > 0 ? data : [0],
              borderColor: "#cc00ff",
              backgroundColor: "rgba(204, 0, 255, 0.1)",
              borderWidth: 2,
              pointBackgroundColor: "#cc00ff",
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#8e8f96", font: { size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 5 } },
            y: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#8e8f96", font: { size: 10 } } },
          },
        },
      });
    }

    const listEl = document.getElementById("weight-progress-list");
    if (listEl) {
      if (entries.length === 0) {
        listEl.innerHTML = `
          <p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 10px;">
            Nenhum registro de carga ainda para este exercício.
          </p>
        `;
      } else {
        const reversed = [...entries].reverse();
        listEl.innerHTML = reversed
          .map((entry, idx) => {
            const previousEntry = reversed[idx + 1];
            let deltaHtml = "";

            if (previousEntry) {
              const delta = entry.weight - previousEntry.weight;
              if (delta > 0) {
                deltaHtml = `<span style="color: #22c55e; font-size: 0.75rem; font-weight: 700;">▲ +${delta.toFixed(1)} kg</span>`;
              } else if (delta < 0) {
                deltaHtml = `<span style="color: #ef4444; font-size: 0.75rem; font-weight: 700;">▼ ${delta.toFixed(1)} kg</span>`;
              } else {
                deltaHtml = `<span style="color: var(--text-muted); font-size: 0.75rem;">—</span>`;
              }
            }

            return `
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--card-bg, #1e293b); border: 1px solid var(--card-border, #334155); border-radius: 8px; padding: 10px 12px;">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span style="font-size: 0.85rem; font-weight: 700; color: #fff;">${entry.weight} kg</span>
                  <span style="font-size: 0.7rem; color: var(--text-muted);">${entry.date} • ${entry.time || ''}</span>
                </div>
                ${deltaHtml}
              </div>
            `;
          })
          .join("");
      }
    }

    modalWeightProgress.classList.remove("hidden");
  };

  // Pesquisa e filtros
  const searchInput = document.getElementById("input-search-exercise");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value.toLowerCase().trim();
      renderExerciseLibrary();
    });
  }

  document.querySelectorAll(".tag-filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const tag = e.target.getAttribute("data-tag");

      if (tag === "todos") {
        selectedTagsSet.clear();
        selectedTagsSet.add("todos");
        document.querySelectorAll(".tag-filter-btn").forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
      } else {
        selectedTagsSet.delete("todos");
        document.querySelector('.tag-filter-btn[data-tag="todos"]')?.classList.remove("active");

        if (selectedTagsSet.has(tag)) {
          selectedTagsSet.delete(tag);
          e.target.classList.remove("active");
          if (selectedTagsSet.size === 0) {
            selectedTagsSet.add("todos");
            document.querySelector('.tag-filter-btn[data-tag="todos"]')?.classList.add("active");
          }
        } else {
          selectedTagsSet.add(tag);
          e.target.classList.add("active");
        }
      }

      renderExerciseLibrary();
    });
  });

  let currentEditingWorkoutId = null;
  let activeSessionWorkout = null;
  let currentEditingSessionExerciseIndex = null;

  let activeSessionTimer = null;
  let sessionStartTime = null;
  let sessionExerciseProgress = {};

  function syncExerciseProgressFromCard(card) {
    const idx = parseInt(card.id.replace("session-card-", ""), 10);
    if (Number.isNaN(idx)) return;

    const dots = card.querySelectorAll(".series-dot");
    const switchInput = card.querySelector(".exercise-global-switch");
    const completedSets = Array.from(dots).filter((d) => d.classList.contains("completed")).length;

    sessionExerciseProgress[idx] = {
      completedSets,
      fullyDone: switchInput ? switchInput.checked : false,
    };
  }

  function captureAllSessionProgress() {
    document.querySelectorAll(".session-exercise-card").forEach((card) => {
      syncExerciseProgressFromCard(card);
    });
  }

  function applySessionProgress() {
    Object.entries(sessionExerciseProgress).forEach(([idxStr, progress]) => {
      const idx = parseInt(idxStr, 10);
      const card = document.getElementById(`session-card-${idx}`);
      if (!card) return;

      const dots = card.querySelectorAll(".series-dot");
      const switchInput = card.querySelector(".exercise-global-switch");
      const totalSets = dots.length;
      let completedSets = Math.min(progress.completedSets || 0, totalSets);

      if (progress.fullyDone) completedSets = totalSets;

      dots.forEach((dot, dotIdx) => {
        dot.classList.remove("active", "completed");
        dot.textContent = dotIdx + 1;

        if (dotIdx < completedSets) {
          dot.classList.add("completed");
          dot.innerHTML = SVG_DOT_CHECK;
        } else if (dotIdx === completedSets && completedSets < totalSets) {
          dot.classList.add("active");
        }
      });

      if (switchInput) {
        switchInput.checked = totalSets > 0 && completedSets >= totalSets;
      }
    });
  }

  const btnMinimizeSession = document.getElementById("btn-minimize-session");
  if (btnMinimizeSession) {
    btnMinimizeSession.addEventListener("click", () => {
      window.minimizeSession();
    });
  }

  // NAVEGAÇÃO
  const navItems = document.querySelectorAll(".nav-item");
  const tabContents = document.querySelectorAll(".tab-content");
  const pageTitle = document.getElementById("page-title");

  navItems.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = button.getAttribute("data-target");
      const title = button.getAttribute("data-title");

      navItems.forEach((item) => item.classList.remove("active"));
      tabContents.forEach((tab) => tab.classList.add("hidden"));

      button.classList.add("active");
      const targetTab = document.getElementById(targetId);
      if (targetTab) targetTab.classList.remove("hidden");
      if (pageTitle && title) pageTitle.textContent = title;

      if (targetId === "tab-home") renderHome();
      if (targetId === "tab-treinos") renderWorkouts();
      if (targetId === "tab-exercicios") renderExerciseLibrary();
      if (targetId === "tab-calendario") renderFullMonthCalendar();
    });
  });

  // HOME
  const dayNameFullMap = {
    1: "Segunda-feira", 2: "Terça-feira", 3: "Quarta-feira",
    4: "Quinta-feira", 5: "Sexta-feira", 6: "Sábado", 0: "Domingo",
  };

  function getNextScheduledWorkout(today) {
    const workouts = DB.getWorkouts();
    if (workouts.length === 0) return null;

    let checkDate = new Date(today);
    for (let i = 1; i <= 7; i++) {
      checkDate.setDate(checkDate.getDate() + 1);
      const dayOfWeek = checkDate.getDay().toString();
      const found = workouts.find((w) => w.days && w.days.includes(dayOfWeek));
      if (found) return { workout: found, dayName: dayNameFullMap[dayOfWeek] };
    }
    return null;
  }

  function renderHome() {
    const calendarEl = document.getElementById("weekly-calendar");
    if (!calendarEl) return;
    calendarEl.innerHTML = "";
    const today = new Date();
    const currentDayOfWeek = today.getDay();

    const monday = new Date(today);
    const distanceToMonday = (currentDayOfWeek === 0 ? -6 : 1) - currentDayOfWeek;
    monday.setDate(today.getDate() + distanceToMonday);

    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const history = DB.getHistory();

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dateString = dayDate.toISOString().split("T")[0];

      const isToday = dayDate.toDateString() === today.toDateString();
      const isCompleted = history.includes(dateString);

      const dayCard = document.createElement("div");
      dayCard.className = `day-card ${isToday ? "today" : ""}`;
      dayCard.innerHTML = `
        <span class="day-name">${dayNames[dayDate.getDay()]}</span>
        <span class="day-number">${dayDate.getDate()}</span>
        <span class="day-status">${isCompleted ? SVG_CHECK : SVG_CIRCLE}</span>
      `;
      calendarEl.appendChild(dayCard);
    }

    renderWorkoutToday(today);
  }

  function renderWorkoutToday(today) {
    const container = document.getElementById("workout-of-the-day");
    if (!container) return;

    const dateString = today.toISOString().split("T")[0];
    const dayOfWeek = today.getDay().toString();
    const workouts = DB.getWorkouts();
    const history = DB.getHistory();

    const isCompleted = history.includes(dateString);
    const todayWorkout = workouts.find((w) => w.days && w.days.includes(dayOfWeek));

    const nextInfo = getNextScheduledWorkout(today);
    let nextWorkoutHtml = "";
    if (nextInfo) {
      nextWorkoutHtml = `
        <div style="margin-top:20px; padding-top:16px; border-top:1px dashed var(--card-border);">
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Próximo Treino Agendado</span>
          <h4 style="margin-top:4px; font-size:1rem; color:#fff;">${nextInfo.workout.name} — <span style="color:var(--neon-accent);">${nextInfo.dayName}</span></h4>
        </div>
      `;
    }

    if (isCompleted) {
      container.innerHTML = `
        <h2>Treino Concluído</h2>
        <p style="color:var(--text-muted); margin-top:4px;">Você cumpriu a meta de hoje com sucesso!</p>
        ${nextWorkoutHtml}
      `;
      return;
    }

    if (!todayWorkout) {
      container.innerHTML = `
        <h2>Dia de Descanso</h2>
        <p style="color:var(--text-muted); margin-top:4px;">Nenhum treino agendado para hoje.</p>
        ${nextWorkoutHtml}
      `;
      return;
    }

    container.innerHTML = `
      <span style="font-size:0.75rem; color:var(--neon-accent); text-transform:uppercase; font-weight:800;">Treino de Hoje</span>
      <h2 style="margin-top:2px;">${todayWorkout.name}</h2>
      <p style="margin-top:4px; color:var(--text-muted)">${todayWorkout.exercises ? todayWorkout.exercises.length : 0} Exercícios no plano</p>
      <button class="btn-primary btn-full" style="margin-top:16px" id="btn-start-today-session">
        Iniciar Treino de Hoje
      </button>
      ${nextWorkoutHtml}
    `;

    const btnStart = document.getElementById("btn-start-today-session");
    if (btnStart) {
      btnStart.addEventListener("click", () => {
        openActiveSessionModal(todayWorkout);
      });
    }
  }

  // SESSÃO ATIVA
  const modalSession = document.getElementById("modal-active-session");
  const closeBtnSession = document.querySelector(".close-modal-session");

  if (closeBtnSession && modalSession) {
    closeBtnSession.addEventListener("click", () => {
      modalSession.classList.add("hidden");
      if (activeSessionTimer) {
        clearInterval(activeSessionTimer);
        activeSessionTimer = null;
      }
      sessionStartTime = null;
      sessionExerciseProgress = {};
    });
  }

  function openActiveSessionModal(workout) {
    const isNewSession = !sessionStartTime;
    let expandedExerciseIndices = [];

    if (!isNewSession) {
      captureAllSessionProgress();
      document.querySelectorAll(".session-exercise-card.active-expanded").forEach((card) => {
        const idx = parseInt(card.id.replace("session-card-", ""), 10);
        if (!Number.isNaN(idx)) expandedExerciseIndices.push(idx);
      });
    } else {
      sessionExerciseProgress = {};
    }

    activeSessionWorkout = workout;
    const library = DB.getExerciseLibrary();

    document.getElementById("session-workout-title").textContent = workout.name;
    document.getElementById("session-workout-subtitle").textContent =
      `${workout.exercises ? workout.exercises.length : 0} EXERCÍCIOS`;

    const timerEl = document.getElementById("session-timer");
    if (timerEl && isNewSession) timerEl.textContent = "00:00";
    if (isNewSession) sessionStartTime = Date.now();

    if (!activeSessionTimer) {
      activeSessionTimer = setInterval(() => {
        if (!sessionStartTime || !timerEl) return;
        const diffInSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
        const minutes = String(Math.floor(diffInSeconds / 60)).padStart(2, "0");
        const seconds = String(diffInSeconds % 60).padStart(2, "0");

        if (diffInSeconds >= 3600) {
          const hours = String(Math.floor(diffInSeconds / 3600)).padStart(2, "0");
          const remainingMins = String(Math.floor((diffInSeconds % 3600) / 60)).padStart(2, "0");
          timerEl.textContent = `${hours}:${remainingMins}:${seconds}`;
        } else {
          timerEl.textContent = `${minutes}:${seconds}`;
        }

        const miniTimerEl = document.getElementById("minibars-timer");
        if (miniTimerEl) miniTimerEl.textContent = timerEl.textContent;
      }, 1000);
    }

    const container = document.getElementById("session-exercises-checklist");
    container.innerHTML = (workout.exercises || [])
      .map((exItem, idx) => {
        const found = library.find((l) => l.id === exItem.exerciseId);
        const cardId = `session-card-${idx}`;
        const totalSets = parseInt(exItem.sets) || 3;

        let anatomyContent = '<div class="media-placeholder">Sem Anatomia</div>';
        if (found && found.muscleImg) {
          if (found.muscleImg.startsWith("<svg")) {
            anatomyContent = found.muscleImg;
          } else {
            anatomyContent = `<img src="${found.muscleImg}" alt="Musculatura Alvo">`;
          }
        }

        let executionContent = '<div class="media-placeholder">Sem vídeo cadastrado</div>';
        if (found && found.executionVideo && found.executionVideo.length > 0) {
          if (found.executionVideo.endsWith(".mp4") || found.executionVideo.endsWith(".webm")) {
            executionContent = `<video src="${found.executionVideo}" controls loop playsinline></video>`;
          } else {
            executionContent = `<img src="${found.executionVideo}" alt="Demonstração do Exercício" style="max-height:100%; object-fit:contain;">`;
          }
        }

        const thumbUrl = found && found.executionVideo && !found.executionVideo.endsWith(".mp4")
          ? found.executionVideo
          : "assets/img/peitoral.png";
        const tagsHtml = (found && found.tags ? found.tags.slice(0, 3) : [])
          .map((t) => `<span class="session-tag-pill">${t}</span>`)
          .join("");

        let dotsHtml = "";
        for (let s = 1; s <= totalSets; s++) {
          const dotClass = s === 1 ? "active" : "";
          dotsHtml += `<div class="series-dot ${dotClass}" data-step="${s}" onclick="window.toggleSeriesDot(event, this)">${s}</div>`;
        }

        const isExpanded = (isNewSession && idx === 0) ||
          (!isNewSession && expandedExerciseIndices.includes(idx));

        const currentWeight = DB.getExerciseWeight(exItem.exerciseId) || exItem.weight || 0;
        const exerciseName = found ? found.name : "Exercício";

        return `
        <div class="session-exercise-card ${isExpanded ? "active-expanded" : ""}" id="${cardId}">
          <div class="session-card-compact" onclick="window.toggleSessionCard('${cardId}')">
            <div class="session-compact-left">
              <img src="${thumbUrl}" alt="Thumb" class="session-thumb-mini">
              <div class="session-compact-info">
                <strong>${exerciseName}</strong>
                <div class="session-compact-tags">${tagsHtml}</div>
              </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px;">
              <button type="button" class="btn-edit-active-ex" onclick="window.editActiveSessionExercise(event, ${idx})" style="background: none; border: none; color: var(--neon-accent); cursor: pointer; display: flex; align-items: center; padding: 4px;" title="Editar Carga, Séries e Repetições">
                ${SVG_PENCIL}
              </button>
              
              <label class="switch" title="Marcar como concluído" onclick="event.stopPropagation()">
                <input type="checkbox" class="exercise-global-switch" onchange="window.toggleSessionDoneGlobal(this, '${cardId}')">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="session-card-expanded-body">
            <div class="exercise-media-grid" style="margin-top:14px;">
              <div class="exercise-media-box">
                <span>MÚSCULOS</span>
                <div class="media-container">${anatomyContent}</div>
              </div>
              <div class="exercise-media-box">
                <span>EXECUÇÃO</span>
                <div class="media-container">${executionContent}</div>
              </div>
            </div>

            <div class="series-dots-container">
              ${dotsHtml}
            </div>

            <div class="session-metrics-grid">
              <div class="session-metric-box" 
                   onclick="event.stopPropagation(); window.openWeightProgressModal('${exItem.exerciseId || ''}', '${exerciseName.replace(/'/g, "\\'")}')"
                   style="cursor: pointer;"
                   title="Ver histórico de carga">
                <div class="session-metric-value" style="color: var(--neon-accent);">${currentWeight} kg</div>
                <div class="session-metric-label">Carga ⓘ</div>
              </div>
              <div class="session-metric-box">
                <div class="session-metric-value">${exItem.sets || 0}</div>
                <div class="session-metric-label">Séries</div>
              </div>
              <div class="session-metric-box">
                <div class="session-metric-value">${exItem.reps || 0}</div>
                <div class="session-metric-label">Repetições</div>
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    applySessionProgress();

    if (modalSession) modalSession.classList.remove("hidden");
    const minibar = document.getElementById("minimized-workout-bar");
    if (minibar) minibar.classList.add("hidden");
  }

  window.toggleSessionCard = function (cardId) {
    const card = document.getElementById(cardId);
    if (card) card.classList.toggle("active-expanded");
  };

  window.toggleSeriesDot = function (event, dotElement) {
    event.stopPropagation();
    const container = dotElement.closest(".series-dots-container");
    const dots = Array.from(container.querySelectorAll(".series-dot"));
    const currentIndex = dots.indexOf(dotElement);
    const card = dotElement.closest(".session-exercise-card");
    const switchInput = card.querySelector(".exercise-global-switch");

    let startedRestTimer = false;

    if (dotElement.classList.contains("completed")) {
      for (let i = currentIndex; i < dots.length; i++) {
        dots[i].classList.remove("completed", "active");
        dots[i].textContent = i + 1;
      }
      dotElement.classList.add("active");
      if (switchInput) switchInput.checked = false;
    } else if (dotElement.classList.contains("active")) {
      dotElement.classList.remove("active");
      dotElement.classList.add("completed");
      dotElement.innerHTML = SVG_DOT_CHECK;

      if (currentIndex + 1 < dots.length) {
        dots[currentIndex + 1].classList.add("active");
      } else {
        if (switchInput) switchInput.checked = true;
      }

      startedRestTimer = true;
    }

    if (card) syncExerciseProgressFromCard(card);

    if (startedRestTimer && typeof RestTimer !== "undefined") {
      RestTimer.triggerDefault();
    }
  };

  window.toggleSessionDoneGlobal = function (checkbox, cardId) {
    const card = document.getElementById(cardId);
    if (card) {
      const dots = card.querySelectorAll(".series-dot");
      if (checkbox.checked) {
        dots.forEach((d) => {
          d.classList.remove("active");
          d.classList.add("completed");
          d.innerHTML = SVG_DOT_CHECK;
        });
        card.classList.remove("active-expanded");
      } else {
        dots.forEach((d, idx) => {
          d.classList.remove("completed");
          d.textContent = idx + 1;
          if (idx === 0) d.classList.add("active");
          else d.classList.remove("active");
        });
      }
      syncExerciseProgressFromCard(card);
    }
  };

  const modalEditActiveEx = document.getElementById('modal-edit-active-exercise');
  const closeBtnEditActive = document.querySelector('.close-modal-edit-active');
  const formEditActiveEx = document.getElementById('form-edit-active-exercise');

  if (closeBtnEditActive && modalEditActiveEx) {
    closeBtnEditActive.addEventListener('click', () => {
      modalEditActiveEx.classList.add('hidden');
    });
  }

  window.editActiveSessionExercise = function(event, idx) {
    event.stopPropagation();
    if (!activeSessionWorkout || !activeSessionWorkout.exercises[idx]) return;

    currentEditingSessionExerciseIndex = idx;
    const currentEx = activeSessionWorkout.exercises[idx];
    const sharedWeight = DB.getExerciseWeight(currentEx.exerciseId) || currentEx.weight || '';

    document.getElementById('edit-active-sets').value = currentEx.sets || '';
    document.getElementById('edit-active-reps').value = currentEx.reps || '';
    document.getElementById('edit-active-weight').value = sharedWeight;

    if (modalEditActiveEx) modalEditActiveEx.classList.remove('hidden');
  };

  if (formEditActiveEx) {
    formEditActiveEx.addEventListener('submit', (e) => {
      e.preventDefault();
      if (currentEditingSessionExerciseIndex === null || !activeSessionWorkout) return;

      const newSets = document.getElementById('edit-active-sets').value;
      const newReps = document.getElementById('edit-active-reps').value;
      const newWeight = document.getElementById('edit-active-weight').value;

      const editedIdx = currentEditingSessionExerciseIndex;
      const editedExercise = activeSessionWorkout.exercises[editedIdx];
      editedExercise.sets = newSets;
      editedExercise.reps = newReps;
      editedExercise.weight = newWeight;

      if (editedExercise.exerciseId) {
        DB.setExerciseWeight(editedExercise.exerciseId, newWeight);
        activeSessionWorkout.exercises.forEach((ex) => {
          if (ex.exerciseId === editedExercise.exerciseId) ex.weight = newWeight;
        });
      }

      const parsedSets = parseInt(newSets, 10) || 0;
      if (sessionExerciseProgress[editedIdx]) {
        sessionExerciseProgress[editedIdx].completedSets = Math.min(
          sessionExerciseProgress[editedIdx].completedSets,
          parsedSets,
        );
        sessionExerciseProgress[editedIdx].fullyDone =
          parsedSets > 0 && sessionExerciseProgress[editedIdx].completedSets >= parsedSets;
      }

      DB.updateWorkoutExercises(activeSessionWorkout.id, activeSessionWorkout.exercises);

      const refreshedWorkout = DB.getWorkouts().find((w) => w.id === activeSessionWorkout.id);
      if (refreshedWorkout) activeSessionWorkout = refreshedWorkout;

      if (modalEditActiveEx) modalEditActiveEx.classList.add('hidden');
      openActiveSessionModal(activeSessionWorkout);
    });
  }

  const btnFinishSession = document.getElementById("btn-finish-active-session");
  if (btnFinishSession) {
    btnFinishSession.addEventListener("click", () => {
      const cards = document.querySelectorAll(".session-exercise-card");
      let allDone = true;

      cards.forEach((card) => {
        const dots = card.querySelectorAll(".series-dot");
        const allDotsCompleted = Array.from(dots).every((d) => d.classList.contains("completed"));
        if (!allDotsCompleted) allDone = false;
      });

      if (!allDone) {
        alert("Você precisa concluir todas as séries de todos os exercícios antes de finalizar o treino!");
        return;
      }

      if (confirm(`Deseja realmente concluir e salvar o treino "${activeSessionWorkout.name}"?`)) {
        if (activeSessionTimer) {
          clearInterval(activeSessionTimer);
          activeSessionTimer = null;
        }
        sessionStartTime = null;
        sessionExerciseProgress = {};

        if (typeof RestTimer !== "undefined") RestTimer.close();

        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        const sessionHistory = JSON.parse(localStorage.getItem("my_session_history") || "[]");
        sessionHistory.unshift({
          id: Date.now().toString(),
          workoutName: activeSessionWorkout.name,
          date: dateStr,
          time: timeStr,
          exercisesCount: activeSessionWorkout.exercises ? activeSessionWorkout.exercises.length : 0,
        });
        localStorage.setItem("my_session_history", JSON.stringify(sessionHistory));

        let history = DB.getHistory();
        if (!history.includes(dateStr)) {
          history.push(dateStr);
          localStorage.setItem("my_history", JSON.stringify(history));
        }

        let workouts = DB.getWorkouts();
        const currentIndex = workouts.findIndex((w) => w.id === activeSessionWorkout.id);
        if (currentIndex !== -1) {
          workouts[currentIndex] = activeSessionWorkout;
          const completedWorkout = workouts.splice(currentIndex, 1)[0];
          workouts.push(completedWorkout);
          localStorage.setItem("my_workouts", JSON.stringify(workouts));
        }

        if (modalSession) modalSession.classList.add("hidden");
        renderHome();
        renderWorkouts();
        renderFullMonthCalendar();
      }
    });
  }

  window.startWorkoutSession = function (workoutId) {
    const workouts = DB.getWorkouts();
    const workout = workouts.find((w) => w.id === workoutId);
    if (workout) openActiveSessionModal(workout);
  };

  function renderWorkouts() {
    const listEl = document.getElementById("workouts-list");
    const historyContainerEl = document.getElementById("workouts-history-container");
    if (!listEl) return;

    const workouts = DB.getWorkouts();
    const library = DB.getExerciseLibrary();

    if (workouts.length === 0) {
      listEl.innerHTML =
        '<div class="card-boas-vindas" style="grid-column: 1 / -1;"><p style="text-align:center; color:var(--text-muted);">Nenhum treino criado ainda.</p></div>';
    } else {
      const dayNameMap = { 1: "SEG", 2: "TER", 3: "QUA", 4: "QUI", 5: "SEX", 6: "SÁB", 0: "DOM" };
      const categoryImages = {
        peitoral: "assets/img/peitoral.png", biceps: "assets/img/biceps.png",
        ombros: "assets/img/ombros.png", costas: "assets/img/costas.png",
        pernas: "assets/img/pernas.png", gluteos: "assets/img/gluteos.png",
        geral: "assets/img/full-body.png",
      };

      listEl.innerHTML = workouts
        .map((w) => {
          let allWorkoutTags = [];
          (w.exercises || []).forEach((exItem) => {
            const found = library.find((l) => l.id === exItem.exerciseId);
            if (found && found.tags) allWorkoutTags.push(...found.tags);
          });

          const uniqueTags = Array.from(new Set(allWorkoutTags));
          const tagsHtml = uniqueTags
            .map((t) => `<span class="tag-chip" style="border-color:var(--neon-accent); color:var(--neon-accent);">${t}</span>`)
            .join(" ");
          const dayText = (w.days || []).map((d) => dayNameMap[d] || d).join(", ") || "SEM DIA";
          const bgImage = categoryImages[w.category] || "assets/img/peitoral.png";
          const menuId = `menu-${w.id}`;
          const drawerId = `drawer-${w.id}`;

          return `
          <div class="workout-card-v2">
            <div class="workout-card-banner" style="background-image: url('${bgImage}');" onclick="window.toggleWorkoutDrawer(event, '${drawerId}')">
              <div class="workout-banner-top">
                <span class="workout-day-pill">${dayText}</span>
                <div style="position: relative;">
                  <button class="workout-menu-trigger" onclick="window.toggleWorkoutMenu(event, '${menuId}')" title="Opções">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                  </button>
                  <div class="workout-dropdown-menu" id="${menuId}">
                    <button class="workout-dropdown-item" onclick="window.editWorkout('${w.id}')">Editar Treino</button>
                    <button class="workout-dropdown-item delete" onclick="window.deleteWorkout('${w.id}')">Excluir</button>
                  </div>
                </div>
              </div>
              <div class="workout-banner-bottom">
                <h3 class="workout-title-large">${w.name}</h3>
                <button class="workout-start-btn-circle" onclick="window.startWorkoutSession('${w.id}'); event.stopPropagation();" title="Iniciar Treino">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#000" stroke="#000" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </button>
              </div>
            </div>
            <div class="workout-muscles-drawer" id="${drawerId}">
              <p>Músculos Trabalhados</p>
              <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${tagsHtml || '<span style="color:var(--text-muted); font-size:0.8rem;">Nenhum músculo mapeado</span>'}
              </div>
            </div>
          </div>
        `;
        })
        .join("");
    }

    if (historyContainerEl) {
      const sessionHistory = JSON.parse(localStorage.getItem("my_session_history") || "[]");

      if (sessionHistory.length === 0) {
        historyContainerEl.innerHTML =
          '<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:10px;">Nenhuma sessão concluída ainda.</p>';
      } else {
        const HISTORY_INITIAL_LIMIT = 3;
        const hasMoreThanLimit = sessionHistory.length > HISTORY_INITIAL_LIMIT;
        const visibleItems = historyExpanded || !hasMoreThanLimit
          ? sessionHistory
          : sessionHistory.slice(0, HISTORY_INITIAL_LIMIT);

        const itemsHtml = visibleItems
          .map((item) => {
            const formattedDate = item.date.split("-").reverse().join("/");
            return `
              <details class="history-accordion" style="background: var(--card-bg, #1e293b); border: 1px solid var(--card-border, #334155); border-radius: 8px; padding: 12px; color: #fff;">
                <summary class="history-summary" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: 600;">
                  <span>${item.workoutName}</span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 0.75rem; color: var(--neon-accent);">${formattedDate}</span>
                  </div>
                </summary>
                <div style="margin-top: 8px; font-size: 0.85rem; color: var(--text-muted, #94a3b8); border-top: 1px dashed var(--card-border, #334155); padding-top: 8px;">
                  <div>Data de Realização: <span style="color:#fff;">${formattedDate}</span></div>
                  <div>Horário de Término: <span style="color:#fff;">${item.time}</span></div>
                  <div>Exercícios no Bloco: <span style="color:#fff;">${item.exercisesCount || 0} exercícios</span></div>
                </div>
              </details>
            `;
          })
          .join("");

        let toggleButtonHtml = "";
        if (hasMoreThanLimit) {
          const hiddenCount = sessionHistory.length - HISTORY_INITIAL_LIMIT;
          toggleButtonHtml = historyExpanded
            ? `
              <button type="button" id="btn-toggle-history" class="btn-see-more-history" style="margin-top: 4px; padding: 10px 14px; background: transparent; border: 1px dashed var(--card-border, #334155); border-radius: 8px; color: var(--neon-accent, #cc00ff); font-weight: 700; font-size: 0.8rem; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px;">
                Ver menos ▲
              </button>
            `
            : `
              <button type="button" id="btn-toggle-history" class="btn-see-more-history" style="margin-top: 4px; padding: 10px 14px; background: transparent; border: 1px dashed var(--card-border, #334155); border-radius: 8px; color: var(--neon-accent, #cc00ff); font-weight: 700; font-size: 0.8rem; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px;">
                Ver mais (${hiddenCount} sessões) ▼
              </button>
            `;
        }

        historyContainerEl.innerHTML = itemsHtml + toggleButtonHtml;

        const toggleBtn = document.getElementById("btn-toggle-history");
        if (toggleBtn) {
          toggleBtn.addEventListener("click", () => {
            historyExpanded = !historyExpanded;
            renderWorkouts();
          });
        }
      }
    }
  }

  window.toggleWorkoutMenu = function (event, menuId) {
    event.stopPropagation();
    document.querySelectorAll(".workout-dropdown-menu").forEach((m) => {
      if (m.id !== menuId) m.classList.remove("show");
    });
    const menu = document.getElementById(menuId);
    if (menu) menu.classList.toggle("show");
  };

  window.toggleWorkoutDrawer = function (event, drawerId) {
    event.stopPropagation();
    document.querySelectorAll(".workout-dropdown-menu").forEach((m) => m.classList.remove("show"));
    document.querySelectorAll(".workout-muscles-drawer").forEach((d) => {
      if (d.id !== drawerId) d.classList.remove("open");
    });
    const drawer = document.getElementById(drawerId);
    if (drawer) drawer.classList.toggle("open");
  };

  document.addEventListener("click", () => {
    document.querySelectorAll(".workout-dropdown-menu").forEach((m) => m.classList.remove("show"));
  });

  // CALENDÁRIO
  let currentCalendarDate = new Date();

  const btnPrev = document.getElementById("btn-prev-month");
  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      renderFullMonthCalendar();
    });
  }

  const btnNext = document.getElementById("btn-next-month");
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      renderFullMonthCalendar();
    });
  }

  function renderFullMonthCalendar() {
    const grid = document.getElementById("full-month-calendar");
    if (!grid) return;
    grid.innerHTML = "";

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const monthNameEl = document.getElementById("calendar-month-name");
    if (monthNameEl) monthNameEl.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const history = DB.getHistory();
    const realToday = new Date();

    const streakCountEl = document.getElementById("streak-count");
    if (streakCountEl) streakCountEl.textContent = DB.calculateStreak();

    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "month-day-cell empty";
      grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateFormatted = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isCompleted = history.includes(dateFormatted);
      const isRealToday = day === realToday.getDate() && month === realToday.getMonth() && year === realToday.getFullYear();

      const cell = document.createElement("div");
      cell.className = `month-day-cell ${isCompleted ? "completed" : ""} ${isRealToday ? "today-cell" : ""}`;
      cell.textContent = day;

      cell.addEventListener("click", () => {
        DB.toggleWorkoutCompletion(dateFormatted);
        renderFullMonthCalendar();
        renderHome();
      });

      grid.appendChild(cell);
    }
  }

  const modalConfigDays = document.getElementById("modal-config-days");
  const btnOpenConfigDays = document.getElementById("btn-open-config-days");
  const closeBtnConfigDays = document.querySelector(".close-modal-config-days");

  if (btnOpenConfigDays && modalConfigDays) {
    btnOpenConfigDays.addEventListener("click", () => {
      const savedDays = DB.getTrainingDays();
      const checkboxes = document.querySelectorAll("#config-target-days input");
      checkboxes.forEach((cb) => cb.checked = savedDays.includes(cb.value));
      modalConfigDays.classList.remove("hidden");
    });
  }

  if (closeBtnConfigDays && modalConfigDays) {
    closeBtnConfigDays.addEventListener("click", () => modalConfigDays.classList.add("hidden"));
  }

  const formConfigDays = document.getElementById("form-config-days");
  if (formConfigDays) {
    formConfigDays.addEventListener("submit", (e) => {
      e.preventDefault();
      const selected = Array.from(document.querySelectorAll("#config-target-days input:checked")).map((cb) => cb.value);
      DB.saveTrainingDays(selected);
      if (modalConfigDays) modalConfigDays.classList.add("hidden");
      renderFullMonthCalendar();
    });
  }

  let currentExerciseTags = [];
  const tagInput = document.getElementById("ex-tag-input");
  const btnAddTag = document.getElementById("btn-add-tag");
  const tagsContainer = document.getElementById("selected-tags-container");

  function addTagFromInput() {
    if (!tagInput) return;
    const val = tagInput.value.trim();
    if (val && !currentExerciseTags.includes(val)) {
      currentExerciseTags.push(val);
      renderTags();
      tagInput.value = "";
    }
  }

  function renderTags() {
    if (!tagsContainer) return;
    tagsContainer.innerHTML = currentExerciseTags
      .map((t, index) => `
      <span class="tag-chip">
        ${t}
        <button type="button" onclick="window.removeTag(${index})">&times;</button>
      </span>
    `).join("");
  }

  window.removeTag = function (index) {
    currentExerciseTags.splice(index, 1);
    renderTags();
  };

  if (btnAddTag) btnAddTag.addEventListener("click", addTagFromInput);

  const modalEx = document.getElementById("modal-add-exercise");
  const btnOpenEx = document.getElementById("btn-open-add-exercise");
  if (btnOpenEx) {
    btnOpenEx.addEventListener("click", () => {
      currentExerciseTags = [];
      renderTags();
      if (modalEx) modalEx.classList.remove("hidden");
    });
  }

  const closeBtnEx = document.querySelector(".close-modal-ex");
  if (closeBtnEx && modalEx) {
    closeBtnEx.addEventListener("click", () => modalEx.classList.add("hidden"));
  }

  const formEx = document.getElementById("form-exercise");
  if (formEx) {
    formEx.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = formEx.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : "";

      if (submitBtn) {
        submitBtn.textContent = "Buscando Anatomia...";
        submitBtn.disabled = true;
      }

      try {
        const nameInput = document.getElementById("ex-name");
        const name = nameInput ? nameInput.value.trim() : "";

        const anatomeData = await DB.fetchAnatomeData(name);
        const mergedTags = Array.from(new Set([...currentExerciseTags, ...(anatomeData.tags || [])]));

        DB.saveExercise({
          name,
          tags: mergedTags,
          muscleImg: anatomeData.anatomy,
          executionVideo: anatomeData.execution,
        });

        formEx.reset();
        currentExerciseTags = [];
        renderTags();
        if (modalEx) modalEx.classList.add("hidden");
        renderExerciseLibrary();
      } catch (err) {
        console.error("Erro ao cadastrar exercício:", err);
      } finally {
        if (submitBtn) {
          submitBtn.textContent = originalBtnText;
          submitBtn.disabled = false;
        }
      }
    });
  }

  window.removeExercise = function (id) {
    if (confirm("Tem certeza que deseja apagar este exercício?")) {
      DB.deleteExercise(id);
      renderExerciseLibrary();
    }
  };

  const modalWorkout = document.getElementById("modal-add-workout");
  const containerExWorkout = document.getElementById("workout-exercises-container");
  const btnOpenWorkout = document.getElementById("btn-open-add-workout");
  const modalWorkoutTitle = document.getElementById("modal-workout-title");

  function addExerciseRowToForm(exData = null) {
    if (!containerExWorkout) return;
    const library = DB.getExerciseLibrary();
    const sortedLibrary = [...library].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    const initialExerciseId = exData ? exData.exerciseId : sortedLibrary[0]?.id;
    const initialWeight = initialExerciseId
      ? DB.getExerciseWeight(initialExerciseId) || (exData ? exData.weight : "")
      : exData ? exData.weight : "";

    const row = document.createElement("div");
    row.className = "exercise-row-form";
    row.innerHTML = `
      <div class="exercise-row-header">
        <label>Exercício</label>
        <button type="button" class="btn-remove-ex">Remover</button>
      </div>
      <select class="select-exercise">
        ${sortedLibrary.map((ex) => `<option value="${ex.id}" ${exData && exData.exerciseId === ex.id ? "selected" : ""}>${ex.name}</option>`).join("")}
      </select>
      <div style="display:flex; gap:8px">
        <input type="text" placeholder="Séries (ex: 4)" class="workout-sets" value="${exData ? exData.sets : ""}" style="width:33%; padding:8px; background:var(--card-bg); border:1px solid var(--card-border); color:white; border-radius:6px;">
        <input type="text" placeholder="Reps (ex: 12)" class="workout-reps" value="${exData ? exData.reps : ""}" style="width:33%; padding:8px; background:var(--card-bg); border:1px solid var(--card-border); color:white; border-radius:6px;">
        <input type="text" placeholder="Carga (kg)" class="workout-weight" value="${initialWeight}" style="width:33%; padding:8px; background:var(--card-bg); border:1px solid var(--card-border); color:white; border-radius:6px;">
      </div>
    `;

    const selectExercise = row.querySelector(".select-exercise");
    const weightInput = row.querySelector(".workout-weight");

    const syncWeightFieldFromStore = () => {
      const storedWeight = DB.getExerciseWeight(selectExercise.value);
      if (storedWeight !== "") weightInput.value = storedWeight;
    };

    selectExercise.addEventListener("change", syncWeightFieldFromStore);

    weightInput.addEventListener("change", () => {
      const exerciseId = selectExercise.value;
      if (exerciseId) DB.setExerciseWeight(exerciseId, weightInput.value);
    });

    row.querySelector(".btn-remove-ex").addEventListener("click", () => row.remove());
    containerExWorkout.appendChild(row);
  }

  if (btnOpenWorkout && modalWorkout) {
    btnOpenWorkout.addEventListener("click", () => {
      currentEditingWorkoutId = null;
      if (modalWorkoutTitle) modalWorkoutTitle.textContent = "Montar Treino";
      const formW = document.getElementById("form-workout");
      if (formW) formW.reset();
      if (containerExWorkout) containerExWorkout.innerHTML = "";
      modalWorkout.classList.remove("hidden");
    });
  }

  const closeBtnW = document.querySelector(".close-modal-workout");
  if (closeBtnW && modalWorkout) {
    closeBtnW.addEventListener("click", () => modalWorkout.classList.add("hidden"));
  }

  const btnAddExW = document.getElementById("btn-add-ex-to-workout");
  if (btnAddExW) btnAddExW.addEventListener("click", () => addExerciseRowToForm());

  const formW = document.getElementById("form-workout");
  if (formW) {
    formW.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("workout-name").value;
      const category = document.getElementById("workout-category").value;
      const days = Array.from(document.querySelectorAll("#form-days input:checked")).map((cb) => cb.value);

      const rows = document.querySelectorAll(".exercise-row-form");
      rows.forEach((r) => {
        const exerciseId = r.querySelector(".select-exercise").value;
        const weight = r.querySelector(".workout-weight").value;
        if (exerciseId) DB.setExerciseWeight(exerciseId, weight);
      });

      const exercises = Array.from(rows).map((r) => ({
        exerciseId: r.querySelector(".select-exercise").value,
        sets: r.querySelector(".workout-sets").value,
        reps: r.querySelector(".workout-reps").value,
        weight: r.querySelector(".workout-weight").value,
      }));

      DB.saveWorkout({ id: currentEditingWorkoutId, name, category, days, exercises });

      formW.reset();
      currentEditingWorkoutId = null;
      if (containerExWorkout) containerExWorkout.innerHTML = "";
      if (modalWorkout) modalWorkout.classList.add("hidden");
      renderWorkouts();
      renderHome();
    });
  }

  window.editWorkout = function (workoutId) {
    const workouts = DB.getWorkouts();
    const workout = workouts.find((w) => w.id === workoutId);
    if (!workout) return;

    currentEditingWorkoutId = workout.id;
    if (modalWorkoutTitle) modalWorkoutTitle.textContent = "Editar Treino";

    document.getElementById("workout-name").value = workout.name || "";
    document.getElementById("workout-category").value = workout.category || "geral";

    const dayCheckboxes = document.querySelectorAll("#form-days input");
    dayCheckboxes.forEach((cb) => {
      cb.checked = workout.days && workout.days.includes(cb.value);
    });

    if (containerExWorkout) {
      containerExWorkout.innerHTML = "";
      if (workout.exercises && workout.exercises.length > 0) {
        workout.exercises.forEach((ex) => addExerciseRowToForm(ex));
      }
    }

    if (modalWorkout) modalWorkout.classList.remove("hidden");
  };

  window.deleteWorkout = function (workoutId) {
    if (confirm("Tem certeza que deseja excluir este treino permanentemente?")) {
      DB.deleteWorkout(workoutId);
      renderWorkouts();
      renderHome();
    }
  };

  renderHome();
  renderExerciseLibrary();
});

function renderExerciseLibrary() {
  const listEl = document.getElementById("exercises-library-list");
  if (!listEl) return;

  const allExercises = DB.getExerciseLibrary();

  const exercises = allExercises.filter((ex) => {
    const matchesName = ex.name.toLowerCase().includes(currentSearchQuery);

    let matchesTags = true;
    if (!selectedTagsSet.has("todos") && selectedTagsSet.size > 0) {
      const exTags = (ex.tags || []).map((t) => t.toLowerCase());
      matchesTags = Array.from(selectedTagsSet).every((selectedTag) =>
        exTags.includes(selectedTag.toLowerCase()),
      );
    }

    return matchesName && matchesTags;
  });

  if (exercises.length === 0) {
    listEl.innerHTML =
      '<div class="card-boas-vindas"><p style="text-align:center; color:var(--text-muted);">Nenhum exercício encontrado.</p></div>';
    return;
  }

  listEl.innerHTML = exercises
    .map((ex) => {
      const tagsHtml = (ex.tags || []).map((t) => `<span class="tag-chip">${t}</span>`).join(" ");
      const hasMedia = ex.executionVideo && ex.executionVideo.length > 0;

      let anatomyContent = '<div class="media-placeholder">Sem Anatomia</div>';
      if (ex.muscleImg) {
        if (ex.muscleImg.startsWith("<svg")) {
          anatomyContent = ex.muscleImg;
        } else {
          anatomyContent = `<img src="${ex.muscleImg}" alt="Musculatura Alvo" style="max-height:100%; object-fit:contain;">`;
        }
      }

      let executionContent = '<div class="media-placeholder">Sem vídeo cadastrado</div>';
      if (hasMedia) {
        if (ex.executionVideo.endsWith(".mp4") || ex.executionVideo.endsWith(".webm")) {
          executionContent = `<video src="${ex.executionVideo}" controls loop playsinline></video>`;
        } else {
          executionContent = `<img src="${ex.executionVideo}" alt="Demonstração do Exercício" style="max-height:100%; object-fit:contain;">`;
        }
      }

      const isUserExercise = ex.id && ex.id.startsWith("usr-");
      const deleteBtnHtml = isUserExercise
        ? `<button onclick="window.removeExercise('${ex.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; float:right; display:flex; align-items:center; padding:4px;" title="Excluir exercício">${SVG_TRASH}</button>`
        : "";

      return `
      <div class="card-boas-vindas" id="ex-card-${ex.id}">
        ${deleteBtnHtml}
        <h3>${ex.name}</h3>
        <div style="margin-top:8px; margin-bottom:14px;">${tagsHtml || '<span style="color:var(--text-muted); font-size:0.8rem">Sem tags</span>'}</div>

        <div class="exercise-media-grid">
          <div class="exercise-media-box">
            <span>MÚSCULOS</span>
            <div class="media-container">${anatomyContent}</div>
          </div>
          <div class="exercise-media-box">
            <span>EXECUÇÃO</span>
            <div class="media-container">${executionContent}</div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}