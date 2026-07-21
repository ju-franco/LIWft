// Dicionário de tradução dos slugs que a API retorna (mantido apenas para traduzir o resultado final para o Português)
const SLUG_TO_PT = {
  'chest': 'Peito',
  'pecs': 'Peito',
  'triceps': 'Tríceps',
  'biceps': 'Bíceps',
  'quadriceps': 'Quadríceps',
  'quads': 'Quadríceps',
  'gluteal': 'Glúteo',
  'glutes': 'Glúteo',
  'gluteus': 'Glúteo',
  'latissimus': 'Costas',
  'lats': 'Costas',
  'upper-back': 'Costas',
  'lower-back': 'Lombar',
  'deltoids': 'Ombros',
  'shoulders': 'Ombros',
  'abs': 'Abdômen',
  'calves': 'Panturrilha',
  'calfs': 'Panturrilha',
  'hamstring': 'Posterior de Coxa',
  'hamstrings': 'Posterior de Coxa',
  'trapezius': 'Trapézio',
  'traps': 'Trapézio',
  'forearm': 'Antebraço',
  'obliques': 'Oblíquos',
  'adductors': 'Adutores',
  'abductors': 'Abdutores'
};

const DB = {
  setupDatalist() {
    // Mantido limpo
  },

  async fetchAnatomeData(exerciseName) {
    const cleanName = (exerciseName || '').trim();
    
    // Procura o exercício diretamente na lista unificada de defaults para ver se tem tradução em inglês
    const defaultDefs = typeof DEFAULT_EXERCISES !== 'undefined' ? DEFAULT_EXERCISES : [];
    const foundDefault = defaultDefs.find(item => item.name.toLowerCase() === cleanName.toLowerCase());
    
    // Se encontrou e tem 'en' preenchido, usa ele; senão usa o próprio nome em PT-BR
    const queryEn = (foundDefault && foundDefault.en) ? foundDefault.en : cleanName;

    try {
      const searchUrl = `https://api.anatome.dev/getExercise?name=${encodeURIComponent(queryEn)}`;
      const searchRes = await fetch(searchUrl);

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const exercise = searchData.exercise;

        if (exercise) {
          const primarySlugs = exercise.anatome_primary_slugs || exercise.primaryMuscles || [];
          const secondarySlugs = exercise.anatome_secondary_slugs || exercise.secondaryMuscles || [];

          let layersParam = '';
          if (exercise.anatome_layers_payload && exercise.anatome_layers_payload.length > 0) {
            layersParam = exercise.anatome_layers_payload
              .map(l => `${l.color.replace('#', '')}:${l.muscles.join(',')}`)
              .join('|');
          } else if (primarySlugs.length > 0) {
            layersParam = `DC2626:${primarySlugs.join(',')}`;
            if (secondarySlugs.length > 0) layersParam += `|F59E0B:${secondarySlugs.join(',')}`;
          }

          let anatomySvg = '';
          if (layersParam) {
            const imgUrl = `https://api.anatome.dev/generateImage?gender=male&view=dual&layers=${layersParam}&output=json`;
            const imgRes = await fetch(imgUrl);
            if (imgRes.ok) {
              const imgData = await imgRes.json();
              anatomySvg = imgData.svg || '';
            }
          }

          const rawSlugs = [...new Set([...primarySlugs, ...secondarySlugs])];
          const translatedTags = rawSlugs.map(slug => SLUG_TO_PT[slug.toLowerCase()] || slug);

          return {
            anatomy: anatomySvg,
            execution: exercise.gif_url || exercise.image_url || '',
            tags: translatedTags
          };
        }
      }
    } catch (err) {
      console.warn("Erro ao buscar Anatome:", err);
    }

    return { anatomy: '', execution: '', tags: [] };
  },

  getExerciseLibrary() {
    const userExercises = JSON.parse(localStorage.getItem('my_user_exercises') || '[]');
    const cachedDefaults = JSON.parse(localStorage.getItem('my_cached_defaults') || '[]');
    const defaultList = cachedDefaults.length > 0 ? cachedDefaults : (typeof DEFAULT_EXERCISES !== 'undefined' ? DEFAULT_EXERCISES : []);
    
    return [...defaultList, ...userExercises];
  },

  async initDefaultExercisesAnatomy() {
    const rawDefaults = typeof DEFAULT_EXERCISES !== 'undefined' ? DEFAULT_EXERCISES : [];
    const processedList = [];

    for (let i = 0; i < rawDefaults.length; i++) {
      const item = rawDefaults[i];
      
      // Se você preencheu manualmente no default-exercises.js, o app respeita e usa direto
      if (item.executionVideo || item.muscleImg || (item.tags && item.tags.length > 0)) {
        processedList.push({
          id: 'def-' + i,
          name: item.name,
          tags: item.tags || [],
          muscleImg: item.muscleImg || '',
          executionVideo: item.executionVideo || item.url || ''
        });
      } else {
        // Senão, busca automaticamente na API
        const anatomeData = await this.fetchAnatomeData(item.name);
        processedList.push({
          id: 'def-' + i,
          name: item.name,
          tags: anatomeData.tags || [],
          muscleImg: anatomeData.anatomy || '',
          executionVideo: anatomeData.execution || ''
        });
      }
    }

    localStorage.setItem('my_cached_defaults', JSON.stringify(processedList));
  },

  saveExercise(exercise) {
    const allExercises = this.getExerciseLibrary();
    const cleanName = exercise.name.trim().toLowerCase();

    const exists = allExercises.some(ex => ex.name.trim().toLowerCase() === cleanName);
    if (exists) {
      alert('Este exercício já está cadastrado na sua biblioteca ou nos padrões do aplicativo!');
      return false;
    }

    const userExercises = JSON.parse(localStorage.getItem('my_user_exercises') || '[]');
    exercise.id = 'usr-' + Date.now().toString();
    userExercises.push(exercise);
    localStorage.setItem('my_user_exercises', JSON.stringify(userExercises));
    return true;
  },

  deleteExercise(id) {
    let userExercises = JSON.parse(localStorage.getItem('my_user_exercises') || '[]');
    userExercises = userExercises.filter(ex => ex.id !== id);
    localStorage.setItem('my_user_exercises', JSON.stringify(userExercises));
  },

  getWorkouts() {
    return JSON.parse(localStorage.getItem('my_workouts') || '[]');
  },

  saveWorkout(workout) {
    let workouts = this.getWorkouts();
    if (workout.id) {
      const index = workouts.findIndex(w => w.id === workout.id);
      if (index !== -1) {
        workouts[index] = workout;
      } else {
        workouts.push(workout);
      }
    } else {
      workout.id = Date.now().toString();
      workouts.push(workout);
    }
    localStorage.setItem('my_workouts', JSON.stringify(workouts));
  },

  deleteWorkout(id) {
    let workouts = this.getWorkouts();
    workouts = workouts.filter(w => w.id !== id);
    localStorage.setItem('my_workouts', JSON.stringify(workouts));
  },

  getHistory() {
    return JSON.parse(localStorage.getItem('my_history') || '[]');
  },

  toggleWorkoutCompletion(dateString) {
    let history = this.getHistory();
    if (history.includes(dateString)) {
      history = history.filter(d => d !== dateString);
    } else {
      history.push(dateString);
    }
    localStorage.setItem('my_history', JSON.stringify(history));
  },

  getTrainingDays() {
    return JSON.parse(localStorage.getItem('my_training_days') || '["1","3","5"]');
  },

  saveTrainingDays(days) {
    localStorage.setItem('my_training_days', JSON.stringify(days));
  },

  calculateStreak() {
    const history = this.getHistory();
    const targetDays = new Set(this.getTrainingDays().map(String));

    if (targetDays.size === 0) return 0;

    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    const todayStr = checkDate.toISOString().split('T')[0];
    const todayDayOfWeek = checkDate.getDay().toString();

    if (targetDays.has(todayDayOfWeek)) {
      if (history.includes(todayStr)) {
        streak++;
      }
    }

    let daysBack = 1;
    daysBack <= 365 && (() => {
      let pastDate = new Date();
      pastDate.setHours(0, 0, 0, 0);
      pastDate.setDate(pastDate.getDate() - daysBack);

      const pastStr = pastDate.toISOString().split('T')[0];
      const pastDayOfWeek = pastDate.getDay().toString();

      if (targetDays.has(pastDayOfWeek)) {
        if (history.includes(pastStr)) {
          streak++;
        } else {
          return false;
        }
      }
      daysBack++;
    })();

    return streak;
  }
};