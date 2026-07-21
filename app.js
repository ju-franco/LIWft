// Variáveis globais de controle de filtro e pesquisa da biblioteca
let currentSearchQuery = '';
let selectedTagsSet = new Set(['todos']);

document.addEventListener('DOMContentLoaded', () => {

  if (typeof DB !== 'undefined') {
    if (DB.setupDatalist) DB.setupDatalist();
    
    // Dispara a busca automática dos exercícios padrão em segundo plano
    if (DB.initDefaultExercisesAnatomy) {
      DB.initDefaultExercisesAnatomy().then(() => {
        renderExerciseLibrary();
      });
    }
  }

  // Ouvinte da barra de pesquisa em tempo real (responsivo a cada letra digitada)
  const searchInput = document.getElementById('input-search-exercise');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.toLowerCase().trim();
      renderExerciseLibrary();
    });
  }

  // Ouvintes dos botões de filtro de tags com suporte a múltipla seleção
  document.querySelectorAll('.tag-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tag = e.target.getAttribute('data-tag');

      if (tag === 'todos') {
        selectedTagsSet.clear();
        selectedTagsSet.add('todos');
        document.querySelectorAll('.tag-filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      } else {
        selectedTagsSet.delete('todos');
        document.querySelector('.tag-filter-btn[data-tag="todos"]')?.classList.remove('active');

        if (selectedTagsSet.has(tag)) {
          selectedTagsSet.delete(tag);
          e.target.classList.remove('active');
          
          if (selectedTagsSet.size === 0) {
            selectedTagsSet.add('todos');
            document.querySelector('.tag-filter-btn[data-tag="todos"]')?.classList.add('active');
          }
        } else {
          selectedTagsSet.add(tag);
          e.target.classList.add('active');
        }
      }

      renderExerciseLibrary();
    });
  });

  // Ícones SVG
  const SVG_CHECK = `<svg class="status-icon-svg completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const SVG_CIRCLE = `<svg class="status-icon-svg pending" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg>`;
  const SVG_TRASH = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

  // Ícones do Foco
  const SVG_SUPERIORES = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 11c1.5 0 3-1 3-3.5S16 4 14 4c-1.5 0-2.5.8-3.5 2C9.5 4.8 8.5 4 7 4 5 4 3 5.5 3 8s1.5 3.5 3 3.5c1.5 0 2.5-.8 3.5-2 1 1.2 2 2 3.5 2z"/><path d="M6 11.5V16a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-4.5"/><path d="M9 19v2"/><path d="M15 19v2"/></svg>`;
  const SVG_INFERIORES = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2a3 3 0 0 0-3 3v7a4 4 0 0 0 2.5 3.7L7 22h3.5l1.5-6h0.1l1.4 6H17l-1.5-6.3A4 4 0 0 0 18 12V5a3 3 0 0 0-3-3H9z"/></svg>`;
  const SVG_GERAL = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;

  let currentEditingWorkoutId = null;
  let activeSessionWorkout = null;

  // 1. NAVEGAÇÃO DE ABAS
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const pageTitle = document.getElementById('page-title');

  navItems.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = button.getAttribute('data-target');
      const title = button.getAttribute('data-title');

      navItems.forEach(item => item.classList.remove('active'));
      tabContents.forEach(tab => tab.classList.add('hidden'));

      button.classList.add('active');
      const targetTab = document.getElementById(targetId);
      if (targetTab) targetTab.classList.remove('hidden');
      if (pageTitle && title) pageTitle.textContent = title;

      if (targetId === 'tab-home') renderHome();
      if (targetId === 'tab-treinos') renderWorkouts();
      if (targetId === 'tab-exercicios') renderExerciseLibrary();
      if (targetId === 'tab-calendario') renderFullMonthCalendar();
    });
  });

  // 2. TELA HOME
  const dayNameFullMap = { '1': 'Segunda-feira', '2': 'Terça-feira', '3': 'Quarta-feira', '4': 'Quinta-feira', '5': 'Sexta-feira', '6': 'Sábado', '0': 'Domingo' };

  function getNextScheduledWorkout(today) {
    const workouts = DB.getWorkouts();
    if (workouts.length === 0) return null;

    let checkDate = new Date(today);
    for (let i = 1; i <= 7; i++) {
      checkDate.setDate(checkDate.getDate() + 1);
      const dayOfWeek = checkDate.getDay().toString();
      const found = workouts.find(w => w.days && w.days.includes(dayOfWeek));
      if (found) {
        return { workout: found, dayName: dayNameFullMap[dayOfWeek] };
      }
    }
    return null;
  }

  function renderHome() {
    const calendarEl = document.getElementById('weekly-calendar');
    if (!calendarEl) return;
    calendarEl.innerHTML = '';
    const today = new Date();
    const currentDayOfWeek = today.getDay();

    const monday = new Date(today);
    const distanceToMonday = (currentDayOfWeek === 0 ? -6 : 1) - currentDayOfWeek;
    monday.setDate(today.getDate() + distanceToMonday);

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const history = DB.getHistory();

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dateString = dayDate.toISOString().split('T')[0];

      const isToday = dayDate.toDateString() === today.toDateString();
      const isCompleted = history.includes(dateString);

      const dayCard = document.createElement('div');
      dayCard.className = `day-card ${isToday ? 'today' : ''}`;
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
    const container = document.getElementById('workout-of-the-day');
    if (!container) return;

    const dateString = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay().toString();
    const workouts = DB.getWorkouts();
    const history = DB.getHistory();

    const isCompleted = history.includes(dateString);
    const todayWorkout = workouts.find(w => w.days && w.days.includes(dayOfWeek));

    const nextInfo = getNextScheduledWorkout(today);
    let nextWorkoutHtml = '';
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

    const btnStart = document.getElementById('btn-start-today-session');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        openActiveSessionModal(todayWorkout);
      });
    }
  }

// 3. EXECUÇÃO DO TREINO (SESSÃO ATIVA COM VALIDAÇÃO E ROTAÇÃO DE FILA)
  const modalSession = document.getElementById('modal-active-session');
  const closeBtnSession = document.querySelector('.close-modal-session');

  if (closeBtnSession && modalSession) {
    closeBtnSession.addEventListener('click', () => modalSession.classList.add('hidden'));
  }

  window.startWorkoutSession = function(workoutId) {
    const workouts = DB.getWorkouts();
    const workout = workouts.find(w => w.id === workoutId);
    if (workout) {
      openActiveSessionModal(workout);
    }
  };

  function openActiveSessionModal(workout) {
    activeSessionWorkout = workout;
    const library = DB.getExerciseLibrary();

    document.getElementById('session-workout-title').textContent = workout.name;
    document.getElementById('session-workout-subtitle').textContent = `${workout.exercises ? workout.exercises.length : 0} EXERCÍCIOS`;

    const container = document.getElementById('session-exercises-checklist');
    container.innerHTML = (workout.exercises || []).map((exItem, idx) => {
      const found = library.find(l => l.id === exItem.exerciseId);
      const cardId = `session-card-${idx}`;
      const totalSets = parseInt(exItem.sets) || 3;

      let anatomyContent = '<div class="media-placeholder">Sem Anatomia</div>';
      if (found && found.muscleImg) {
        if (found.muscleImg.startsWith('<svg')) {
          anatomyContent = found.muscleImg;
        } else {
          anatomyContent = `<img src="${found.muscleImg}" alt="Musculatura Alvo">`;
        }
      }

      let executionContent = '<div class="media-placeholder">Sem vídeo cadastrado</div>';
      if (found && found.executionVideo && found.executionVideo.length > 0) {
        if (found.executionVideo.endsWith('.mp4') || found.executionVideo.endsWith('.webm')) {
          executionContent = `<video src="${found.executionVideo}" controls loop playsinline></video>`;
        } else {
          executionContent = `<img src="${found.executionVideo}" alt="Demonstração do Exercício" style="max-height:100%; object-fit:contain;">`;
        }
      }

      const thumbUrl = (found && found.executionVideo && !found.executionVideo.endsWith('.mp4')) ? found.executionVideo : 'assets/img/peitoral.png';
      const tagsHtml = (found && found.tags ? found.tags.slice(0, 3) : []).map(t => `<span class="session-tag-pill">${t}</span>`).join('');

      let dotsHtml = '';
      for (let s = 1; s <= totalSets; s++) {
        const dotClass = s === 1 ? 'active' : '';
        dotsHtml += `<div class="series-dot ${dotClass}" data-step="${s}" onclick="window.toggleSeriesDot(event, this)">${s}</div>`;
      }

      return `
        <div class="session-exercise-card ${idx === 0 ? 'active-expanded' : ''}" id="${cardId}">
          <div class="session-card-compact" onclick="window.toggleSessionCard('${cardId}')">
            <div class="session-compact-left">
              <img src="${thumbUrl}" alt="Thumb" class="session-thumb-mini">
              <div class="session-compact-info">
                <strong>${found ? found.name : 'Exercício'}</strong>
                <div class="session-compact-tags">${tagsHtml}</div>
              </div>
            </div>
            <label class="switch" title="Marcar como concluído" onclick="event.stopPropagation()">
              <input type="checkbox" class="exercise-global-switch" onchange="window.toggleSessionDoneGlobal(this, '${cardId}')">
              <span class="slider"></span>
            </label>
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
              <div class="session-metric-box">
                <div class="session-metric-value">${exItem.weight || 0} kg</div>
                <div class="session-metric-label">Carga</div>
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
    }).join('');

    if (modalSession) modalSession.classList.remove('hidden');
  }

  window.toggleSessionCard = function(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
      card.classList.toggle('active-expanded');
    }
  };

  window.toggleSeriesDot = function(event, dotElement) {
    event.stopPropagation();
    const container = dotElement.closest('.series-dots-container');
    const dots = Array.from(container.querySelectorAll('.series-dot'));
    const currentIndex = dots.indexOf(dotElement);
    const card = dotElement.closest('.session-exercise-card');
    const switchInput = card.querySelector('.exercise-global-switch');

    if (dotElement.classList.contains('completed')) {
      for (let i = currentIndex; i < dots.length; i++) {
        dots[i].classList.remove('completed', 'active');
        dots[i].textContent = i + 1;
      }
      dotElement.classList.add('active');
      if (switchInput) switchInput.checked = false;
    } else if (dotElement.classList.contains('active')) {
      dotElement.classList.remove('active');
      dotElement.classList.add('completed');
      dotElement.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

      if (currentIndex + 1 < dots.length) {
        dots[currentIndex + 1].classList.add('active');
      } else {
        if (switchInput) switchInput.checked = true;
      }
    }
  };

  window.toggleSessionDoneGlobal = function(checkbox, cardId) {
    const card = document.getElementById(cardId);
    if (card) {
      const dots = card.querySelectorAll('.series-dot');
      if (checkbox.checked) {
        dots.forEach((d, idx) => {
          d.classList.remove('active');
          d.classList.add('completed');
          d.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        });
      } else {
        dots.forEach((d, idx) => {
          d.classList.remove('completed');
          d.textContent = idx + 1;
          if (idx === 0) d.classList.add('active');
          else d.classList.remove('active');
        });
      }
    }
  };

  // BOTÃO CONCLUIR TREINO COM VALIDAÇÃO, HISTÓRICO E SINCRONIZAÇÃO COMPLETA
  const btnFinishSession = document.getElementById('btn-finish-active-session');
  if (btnFinishSession) {
    btnFinishSession.addEventListener('click', () => {
      const cards = document.querySelectorAll('.session-exercise-card');
      let allDone = true;

      cards.forEach(card => {
        const dots = card.querySelectorAll('.series-dot');
        const allDotsCompleted = Array.from(dots).every(d => d.classList.contains('completed'));
        if (!allDotsCompleted) allDone = false;
      });

      if (!allDone) {
        alert('Você precisa concluir todas as séries de todos os exercícios antes de finalizar o treino!');
        return;
      }

      if (confirm(`Deseja realmente concluir e salvar o treino "${activeSessionWorkout.name}"?`)) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // 1. Registra no Histórico de Sessões Detalhado
        const sessionHistory = JSON.parse(localStorage.getItem('my_session_history') || '[]');
        sessionHistory.unshift({
          id: Date.now().toString(),
          workoutName: activeSessionWorkout.name,
          date: dateStr,
          time: timeStr,
          exercisesCount: activeSessionWorkout.exercises ? activeSessionWorkout.exercises.length : 0
        });
        localStorage.setItem('my_session_history', JSON.stringify(sessionHistory));

        // 2. Sincroniza com o Histórico Geral (Calendário e Streak)
        let history = DB.getHistory();
        if (!history.includes(dateStr)) {
          history.push(dateStr);
          localStorage.setItem('my_history', JSON.stringify(history));
        }

        // 3. Rotação da Fila de Treinos (Joga o treino concluído para o fim da fila)
        let workouts = DB.getWorkouts();
        const currentIndex = workouts.findIndex(w => w.id === activeSessionWorkout.id);
        if (currentIndex !== -1) {
          const completedWorkout = workouts.splice(currentIndex, 1)[0];
          workouts.push(completedWorkout);
          localStorage.setItem('my_workouts', JSON.stringify(workouts));
        }

        // Fecha o modal e atualiza todas as abas sincronizadas
        if (modalSession) modalSession.classList.add('hidden');
        renderHome();
        renderWorkouts();
        renderFullMonthCalendar();
      }
    });
  }

  // 4. RENDERIZAR TREINOS E HISTÓRICO EXPANSÍVEL NA ABA "TREINOS"
  function renderWorkouts() {
    const listEl = document.getElementById('workouts-list');
    const historyContainerEl = document.getElementById('workouts-history-container');
    if (!listEl) return;

    const workouts = DB.getWorkouts();
    const library = DB.getExerciseLibrary();

    if (workouts.length === 0) {
      listEl.innerHTML = '<div class="card-boas-vindas" style="grid-column: 1 / -1;"><p style="text-align:center; color:var(--text-muted);">Nenhum treino criado ainda.</p></div>';
    } else {
      const dayNameMap = { '1': 'SEG', '2': 'TER', '3': 'QUA', '4': 'QUI', '5': 'SEX', '6': 'SÁB', '0': 'DOM' };
      const categoryImages = {
        'peitoral': 'assets/img/peitoral.png',
        'costas': 'assets/img/costas.png',
        'pernas': 'assets/img/pernas.png',
        'gluteos': 'assets/img/gluteos.png',
        'geral': 'assets/img/full-body.png'
      };

      listEl.innerHTML = workouts.map(w => {
        let allWorkoutTags = [];
        (w.exercises || []).forEach(exItem => {
          const found = library.find(l => l.id === exItem.exerciseId);
          if (found && found.tags) allWorkoutTags.push(...found.tags);
        });

        const uniqueTags = Array.from(new Set(allWorkoutTags));
        const tagsHtml = uniqueTags.map(t => `<span class="tag-chip" style="border-color:var(--neon-accent); color:var(--neon-accent);">${t}</span>`).join(' ');
        const dayText = (w.days || []).map(d => dayNameMap[d] || d).join(', ') || 'SEM DIA';
        const bgImage = categoryImages[w.category] || 'assets/img/peitoral.png';
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
      }).join('');
    }

    // Renderizar o Histórico Expansível
    if (historyContainerEl) {
      const sessionHistory = JSON.parse(localStorage.getItem('my_session_history') || '[]');
      if (sessionHistory.length === 0) {
        historyContainerEl.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:10px;">Nenhuma sessão concluída ainda.</p>';
      } else {
        historyContainerEl.innerHTML = sessionHistory.map(item => {
          const formattedDate = item.date.split('-').reverse().join('/');
          return `
            <details class="history-accordion">
              <summary class="history-summary">
                <span>${item.workoutName}</span>
                <div class="history-summary-right">
                  <span class="history-badge-mini">${formattedDate}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </summary>
              <div class="history-details-body">
                <div>Data de Realização: <span>${formattedDate}</span></div>
                <div>Horário de Término: <span>${item.time}</span></div>
                <div>Exercícios no Bloco: <span>${item.exercisesCount || 0} exercícios</span></div>
              </div>
            </details>
          `;
        }).join('');
      }
    }
  }

  // 4. RENDERIZAR TREINOS E O HISTÓRICO DE SESSÕES NA ABA "TREINOS"
  function renderWorkouts() {
    const listEl = document.getElementById('workouts-list');
    const historyListEl = document.getElementById('workouts-history-list');
    if (!listEl) return;

    const workouts = DB.getWorkouts();
    const library = DB.getExerciseLibrary();

    if (workouts.length === 0) {
      listEl.innerHTML = '<div class="card-boas-vindas" style="grid-column: 1 / -1;"><p style="text-align:center; color:var(--text-muted);">Nenhum treino criado ainda.</p></div>';
    } else {
      const dayNameMap = { '1': 'SEG', '2': 'TER', '3': 'QUA', '4': 'QUI', '5': 'SEX', '6': 'SÁB', '0': 'DOM' };
      const categoryImages = {
        'peitoral': 'assets/img/peitoral.png',
        'costas': 'assets/img/costas.png',
        'pernas': 'assets/img/pernas.png',
        'gluteos': 'assets/img/gluteos.png',
        'geral': 'assets/img/full-body.png'
      };

      listEl.innerHTML = workouts.map(w => {
        let allWorkoutTags = [];
        (w.exercises || []).forEach(exItem => {
          const found = library.find(l => l.id === exItem.exerciseId);
          if (found && found.tags) allWorkoutTags.push(...found.tags);
        });

        const uniqueTags = Array.from(new Set(allWorkoutTags));
        const tagsHtml = uniqueTags.map(t => `<span class="tag-chip" style="border-color:var(--neon-accent); color:var(--neon-accent);">${t}</span>`).join(' ');
        const dayText = (w.days || []).map(d => dayNameMap[d] || d).join(', ') || 'SEM DIA';
        const bgImage = categoryImages[w.category] || 'assets/img/peitoral.png';
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
      }).join('');
    }

    // Renderizar o Histórico de Sessões abaixo dos treinos
    if (historyListEl) {
      const sessionHistory = JSON.parse(localStorage.getItem('my_session_history') || '[]');
      if (sessionHistory.length === 0) {
        historyListEl.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:10px;">Nenhuma sessão concluída ainda.</p>';
      } else {
        historyListEl.innerHTML = sessionHistory.map(item => `
          <div class="history-session-card">
            <div class="history-session-info">
              <h4>${item.workoutName}</h4>
              <p>Concluído em ${item.date.split('-').reverse().join('/')} às ${item.time}</p>
            </div>
            <span class="history-badge">Finalizado</span>
          </div>
        `).join('');
      }
    }
  }

  // Controle de expansão do card de exercício na sessão
  window.toggleSessionCard = function(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
      card.classList.toggle('active-expanded');
    }
  };

  // Lógica progressiva das bolinhas de série
  window.toggleSeriesDot = function(event, dotElement) {
    event.stopPropagation();
    
    // Se a bolinha estiver inativa (não clicável ainda), não faz nada
    if (!dotElement.classList.contains('active') && !dotElement.classList.contains('completed')) {
      return;
    }

    const container = dotElement.closest('.series-dots-container');
    const dots = Array.from(container.querySelectorAll('.series-dot'));
    const currentIndex = dots.indexOf(dotElement);

    if (dotElement.classList.contains('completed')) {
      // Se já estava completa, desfaz ela e todas as seguintes
      for (let i = currentIndex; i < dots.length; i++) {
        dots[i].classList.remove('completed', 'active');
      }
      dotElement.classList.add('active');
    } else {
      // Se estava ativa, marca como completa e ativa a próxima (se houver)
      dotElement.classList.remove('active');
      dotElement.classList.add('completed');

      if (currentIndex + 1 < dots.length) {
        dots[currentIndex + 1].classList.add('active');
      }
    }
  };

  window.toggleSessionDoneGlobal = function(checkbox, cardId) {
    const card = document.getElementById(cardId);
    if (card) {
      const dots = card.querySelectorAll('.series-dot');
      if (checkbox.checked) {
        card.classList.remove('active-expanded');
        dots.forEach(d => {
          d.classList.remove('active');
          d.classList.add('completed');
        });
      } else {
        dots.forEach((d, idx) => {
          d.classList.remove('completed');
          if (idx === 0) d.classList.add('active');
        });
      }
    }
  };
  
  // 4. LISTA DE TREINOS NA ABA "TREINOS"
  function renderWorkouts() {
    const listEl = document.getElementById('workouts-list');
    if (!listEl) return;

    const workouts = DB.getWorkouts();
    const library = DB.getExerciseLibrary();

    if (workouts.length === 0) {
      listEl.innerHTML = '<div class="card-boas-vindas"><p style="text-align:center; color:var(--text-muted);">Nenhum treino criado ainda.</p></div>';
      return;
    }

    const dayNameMap = { '1': 'SEG', '2': 'TER', '3': 'QUA', '4': 'QUI', '5': 'SEX', '6': 'SÁB', '0': 'DOM' };

    const categoryImages = {
      'peitoral': 'assets/img/peitoral.png',
      'costas': 'assets/img/costas.png',
      'pernas': 'assets/img/pernas.png',
      'gluteos': 'assets/img/gluteos.png',
      'geral': 'assets/img/full-body.png'
    };

    listEl.innerHTML = workouts.map(w => {
      let allWorkoutTags = [];
      (w.exercises || []).forEach(exItem => {
        const found = library.find(l => l.id === exItem.exerciseId);
        if (found && found.tags) {
          allWorkoutTags.push(...found.tags);
        }
      });

      const uniqueTags = Array.from(new Set(allWorkoutTags));
      const tagsHtml = uniqueTags.map(t => `<span class="tag-chip" style="border-color:var(--neon-accent); color:var(--neon-accent);">${t}</span>`).join(' ');
      
      const dayText = (w.days || []).map(d => dayNameMap[d] || d).join(', ') || 'SEM DIA';
      const bgImage = categoryImages[w.category] || 'assets/img/peitoral.png';
      
      const menuId = `menu-${w.id}`;
      const drawerId = `drawer-${w.id}`;

      return `
        <div class="workout-card-v2">
          <!-- Banner Principal com a Foto de Fundo -->
          <div class="workout-card-banner" style="background-image: url('${bgImage}');" onclick="window.toggleWorkoutDrawer(event, '${drawerId}')">
            
            <div class="workout-banner-top">
              <span class="workout-day-pill">${dayText}</span>
              
              <div style="position: relative;">
                <button class="workout-menu-trigger" onclick="window.toggleWorkoutMenu(event, '${menuId}')" title="Opções">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                
                <!-- Menu Dropdown (Editar / Excluir) -->
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

          <!-- Gaveta Expansível Isolada -->
          <div class="workout-muscles-drawer" id="${drawerId}">
            <p>Músculos Trabalhados</p>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              ${tagsHtml || '<span style="color:var(--text-muted); font-size:0.8rem;">Nenhum músculo mapeado</span>'}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Funções globais de controle isolado de treinos
  window.toggleWorkoutMenu = function(event, menuId) {
    event.stopPropagation();
    document.querySelectorAll('.workout-dropdown-menu').forEach(m => {
      if (m.id !== menuId) m.classList.remove('show');
    });
    const menu = document.getElementById(menuId);
    if (menu) menu.classList.toggle('show');
  };

  window.toggleWorkoutDrawer = function(event, drawerId) {
    event.stopPropagation();
    document.querySelectorAll('.workout-dropdown-menu').forEach(m => m.classList.remove('show'));
    
    document.querySelectorAll('.workout-muscles-drawer').forEach(d => {
      if (d.id !== drawerId) d.classList.remove('open');
    });

    const drawer = document.getElementById(drawerId);
    if (drawer) drawer.classList.toggle('open');
  };

  document.addEventListener('click', () => {
    document.querySelectorAll('.workout-dropdown-menu').forEach(m => m.classList.remove('show'));
  });

  // 5. CALENDÁRIO MENSAL E STREAK
  let currentCalendarDate = new Date();

  const btnPrev = document.getElementById('btn-prev-month');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      renderFullMonthCalendar();
    });
  }

  const btnNext = document.getElementById('btn-next-month');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      renderFullMonthCalendar();
    });
  }

  function renderFullMonthCalendar() {
    const grid = document.getElementById('full-month-calendar');
    if (!grid) return;
    grid.innerHTML = '';

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthNameEl = document.getElementById('calendar-month-name');
    if (monthNameEl) monthNameEl.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const history = DB.getHistory();
    const realToday = new Date();

    const streakCountEl = document.getElementById('streak-count');
    if (streakCountEl) streakCountEl.textContent = DB.calculateStreak();

    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'month-day-cell empty';
      grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateFormatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isCompleted = history.includes(dateFormatted);
      const isRealToday = day === realToday.getDate() && month === realToday.getMonth() && year === realToday.getFullYear();

      const cell = document.createElement('div');
      cell.className = `month-day-cell ${isCompleted ? 'completed' : ''} ${isRealToday ? 'today-cell' : ''}`;
      cell.textContent = day;

      cell.addEventListener('click', () => {
        DB.toggleWorkoutCompletion(dateFormatted);
        renderFullMonthCalendar();
        renderHome();
      });

      grid.appendChild(cell);
    }
  }

  // Modais de Dias de Ofensiva
  const modalConfigDays = document.getElementById('modal-config-days');
  const btnOpenConfigDays = document.getElementById('btn-open-config-days');
  const closeBtnConfigDays = document.querySelector('.close-modal-config-days');

  if (btnOpenConfigDays && modalConfigDays) {
    btnOpenConfigDays.addEventListener('click', () => {
      const savedDays = DB.getTrainingDays();
      const checkboxes = document.querySelectorAll('#config-target-days input');
      checkboxes.forEach(cb => {
        cb.checked = savedDays.includes(cb.value);
      });
      modalConfigDays.classList.remove('hidden');
    });
  }

  if (closeBtnConfigDays && modalConfigDays) {
    closeBtnConfigDays.addEventListener('click', () => modalConfigDays.classList.add('hidden'));
  }

  const formConfigDays = document.getElementById('form-config-days');
  if (formConfigDays) {
    formConfigDays.addEventListener('submit', (e) => {
      e.preventDefault();
      const selected = Array.from(document.querySelectorAll('#config-target-days input:checked')).map(cb => cb.value);
      DB.saveTrainingDays(selected);
      if (modalConfigDays) modalConfigDays.classList.add('hidden');
      renderFullMonthCalendar();
    });
  }

  let currentExerciseTags = [];
  const tagInput = document.getElementById('ex-tag-input');
  const btnAddTag = document.getElementById('btn-add-tag');
  const tagsContainer = document.getElementById('selected-tags-container');

  function addTagFromInput() {
    if (!tagInput) return;
    const val = tagInput.value.trim();
    if (val && !currentExerciseTags.includes(val)) {
      currentExerciseTags.push(val);
      renderTags();
      tagInput.value = '';
    }
  }

  function renderTags() {
    if (!tagsContainer) return;
    tagsContainer.innerHTML = currentExerciseTags.map((t, index) => `
      <span class="tag-chip">
        ${t}
        <button type="button" onclick="window.removeTag(${index})">&times;</button>
      </span>
    `).join('');
  }

  window.removeTag = function(index) {
    currentExerciseTags.splice(index, 1);
    renderTags();
  };

  if (btnAddTag) btnAddTag.addEventListener('click', addTagFromInput);

  const modalEx = document.getElementById('modal-add-exercise');
  const btnOpenEx = document.getElementById('btn-open-add-exercise');
  if (btnOpenEx) {
    btnOpenEx.addEventListener('click', () => {
      currentExerciseTags = [];
      renderTags();
      if (modalEx) modalEx.classList.remove('hidden');
    });
  }

  const closeBtnEx = document.querySelector('.close-modal-ex');
  if (closeBtnEx && modalEx) {
    closeBtnEx.addEventListener('click', () => modalEx.classList.add('hidden'));
  }

  const formEx = document.getElementById('form-exercise');
  if (formEx) {
    formEx.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = formEx.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : '';

      if (submitBtn) {
        submitBtn.textContent = 'Buscando Anatomia...';
        submitBtn.disabled = true;
      }

      try {
        const nameInput = document.getElementById('ex-name');
        const name = nameInput ? nameInput.value.trim() : '';

        const anatomeData = await DB.fetchAnatomeData(name);
        const mergedTags = Array.from(new Set([...currentExerciseTags, ...(anatomeData.tags || [])]));

        DB.saveExercise({
          name,
          tags: mergedTags,
          muscleImg: anatomeData.anatomy,
          executionVideo: anatomeData.execution
        });

        formEx.reset();
        currentExerciseTags = [];
        renderTags();
        if (modalEx) modalEx.classList.add('hidden');
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

  window.removeExercise = function(id) {
    if (confirm('Tem certeza que deseja apagar este exercício?')) {
      DB.deleteExercise(id);
      renderExerciseLibrary();
    }
  };

  const modalWorkout = document.getElementById('modal-add-workout');
  const containerExWorkout = document.getElementById('workout-exercises-container');
  const btnOpenWorkout = document.getElementById('btn-open-add-workout');
  const modalWorkoutTitle = document.getElementById('modal-workout-title');

  function addExerciseRowToForm(exData = null) {
    if (!containerExWorkout) return;
    const library = DB.getExerciseLibrary();

    const row = document.createElement('div');
    row.className = 'exercise-row-form';
    row.innerHTML = `
      <div class="exercise-row-header">
        <label>Exercício</label>
        <button type="button" class="btn-remove-ex">Remover</button>
      </div>
      <select class="select-exercise">
        ${library.map(ex => `<option value="${ex.id}" ${exData && exData.exerciseId === ex.id ? 'selected' : ''}>${ex.name}</option>`).join('')}
      </select>
      <div style="display:flex; gap:8px">
        <input type="text" placeholder="Séries (ex: 4)" class="workout-sets" value="${exData ? exData.sets : ''}" style="width:33%; padding:8px; background:var(--card-bg); border:1px solid var(--card-border); color:white; border-radius:6px;">
        <input type="text" placeholder="Reps (ex: 12)" class="workout-reps" value="${exData ? exData.reps : ''}" style="width:33%; padding:8px; background:var(--card-bg); border:1px solid var(--card-border); color:white; border-radius:6px;">
        <input type="text" placeholder="Carga (kg)" class="workout-weight" value="${exData ? exData.weight : ''}" style="width:33%; padding:8px; background:var(--card-bg); border:1px solid var(--card-border); color:white; border-radius:6px;">
      </div>
    `;

    row.querySelector('.btn-remove-ex').addEventListener('click', () => row.remove());
    containerExWorkout.appendChild(row);
  }

  if (btnOpenWorkout && modalWorkout) {
    btnOpenWorkout.addEventListener('click', () => {
      currentEditingWorkoutId = null;
      if (modalWorkoutTitle) modalWorkoutTitle.textContent = "Montar Treino";
      const formW = document.getElementById('form-workout');
      if (formW) formW.reset();
      if (containerExWorkout) containerExWorkout.innerHTML = '';
      modalWorkout.classList.remove('hidden');
    });
  }

  const closeBtnW = document.querySelector('.close-modal-workout');
  if (closeBtnW && modalWorkout) {
    closeBtnW.addEventListener('click', () => modalWorkout.classList.add('hidden'));
  }

  const btnAddExW = document.getElementById('btn-add-ex-to-workout');
  if (btnAddExW) {
    btnAddExW.addEventListener('click', () => addExerciseRowToForm());
  }

  const formW = document.getElementById('form-workout');
  if (formW) {
    formW.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('workout-name').value;
      const category = document.getElementById('workout-category').value;
      const days = Array.from(document.querySelectorAll('#form-days input:checked')).map(cb => cb.value);

      const rows = document.querySelectorAll('.exercise-row-form');
      const exercises = Array.from(rows).map(r => ({
        exerciseId: r.querySelector('.select-exercise').value,
        sets: r.querySelector('.workout-sets').value,
        reps: r.querySelector('.workout-reps').value,
        weight: r.querySelector('.workout-weight').value
      }));

      DB.saveWorkout({
        id: currentEditingWorkoutId,
        name,
        category,
        days,
        exercises
      });

      formW.reset();
      currentEditingWorkoutId = null;
      if (containerExWorkout) containerExWorkout.innerHTML = '';
      if (modalWorkout) modalWorkout.classList.add('hidden');
      renderWorkouts();
      renderHome();
    });
  }

  window.editWorkout = function(workoutId) {
    const workouts = DB.getWorkouts();
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;

    currentEditingWorkoutId = workout.id;
    if (modalWorkoutTitle) modalWorkoutTitle.textContent = "Editar Treino";

    document.getElementById('workout-name').value = workout.name || '';
    document.getElementById('workout-category').value = workout.category || 'geral';

    const dayCheckboxes = document.querySelectorAll('#form-days input');
    dayCheckboxes.forEach(cb => {
      cb.checked = workout.days && workout.days.includes(cb.value);
    });

    if (containerExWorkout) {
      containerExWorkout.innerHTML = '';
      if (workout.exercises && workout.exercises.length > 0) {
        workout.exercises.forEach(ex => addExerciseRowToForm(ex));
      }
    }

    if (modalWorkout) modalWorkout.classList.remove('hidden');
  };

  window.deleteWorkout = function(workoutId) {
    if (confirm('Tem certeza que deseja excluir este treino permanentemente?')) {
      DB.deleteWorkout(workoutId);
      renderWorkouts();
      renderHome();
    }
  };

  renderHome();
  renderExerciseLibrary();
});

// Função global fora do DOMContentLoaded para garantir acesso universal e responsivo à busca/filtros
function renderExerciseLibrary() {
  const listEl = document.getElementById('exercises-library-list');
  if (!listEl) return;

  const allExercises = DB.getExerciseLibrary();

  const exercises = allExercises.filter(ex => {
    // 1. Busca textual instantânea (ex: digitar "halt" encontra "halteres")
    const matchesName = ex.name.toLowerCase().includes(currentSearchQuery);

    // 2. Filtro de múltiplas tags de músculos selecionadas simultaneamente
    let matchesTags = true;
    if (!selectedTagsSet.has('todos') && selectedTagsSet.size > 0) {
      const exTags = (ex.tags || []).map(t => t.toLowerCase());
      matchesTags = Array.from(selectedTagsSet).every(selectedTag => 
        exTags.includes(selectedTag.toLowerCase())
      );
    }

    return matchesName && matchesTags;
  });

  if (exercises.length === 0) {
    listEl.innerHTML = '<div class="card-boas-vindas"><p style="text-align:center; color:var(--text-muted);">Nenhum exercício encontrado.</p></div>';
    return;
  }

  listEl.innerHTML = exercises.map(ex => {
    const tagsHtml = (ex.tags || []).map(t => `<span class="tag-chip">${t}</span>`).join(' ');
    const hasMedia = ex.executionVideo && ex.executionVideo.length > 0;

    let anatomyContent = '<div class="media-placeholder">Sem Anatomia</div>';
    if (ex.muscleImg) {
      if (ex.muscleImg.startsWith('<svg')) {
        anatomyContent = ex.muscleImg;
      } else {
        anatomyContent = `<img src="${ex.muscleImg}" alt="Musculatura Alvo" style="max-height:100%; object-fit:contain;">`;
      }
    }

    let executionContent = '<div class="media-placeholder">Sem vídeo cadastrado</div>';
    if (hasMedia) {
      if (ex.executionVideo.endsWith('.mp4') || ex.executionVideo.endsWith('.webm')) {
        executionContent = `<video src="${ex.executionVideo}" controls loop playsinline></video>`;
      } else {
        executionContent = `<img src="${ex.executionVideo}" alt="Demonstração do Exercício" style="max-height:100%; object-fit:contain;">`;
      }
    }

    const isUserExercise = ex.id && ex.id.startsWith('usr-');
    const deleteBtnHtml = isUserExercise 
      ? `<button onclick="window.removeExercise('${ex.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; float:right; display:flex; align-items:center; padding:4px;" title="Excluir exercício">${SVG_TRASH}</button>` 
      : '';

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
  }).join('');
}