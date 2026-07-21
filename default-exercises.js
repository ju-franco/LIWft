const DEFAULT_EXERCISES = [
  /*
    // Exemplo: caso o exercício não tenha GIF da execução e/ou mapeamento dos músculos, ele pode ser colocado manualmente no campo "url" do objeto do exercício. 
  {
    name: "Stiff com Barra",

    en: ",
        // Propriedade 'en' (Opcional): Termo em inglês usado exclusivamente para buscar mídias na API externa (anatome.dev).
        // - Se você já forneceu 'executionVideo', 'muscleImg' e 'tags' manualmente, a API não é chamada e o campo 'en' é ignorado.
        // - Se deixou as mídias em branco para buscar automaticamente, use o 'en' caso a API não reconheça o nome em português.
        // - Se mantido em branco e sem mídias manuais, o app tentará buscar a API usando o próprio nome em português.
    
        executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2017_02/stiff-animacao.gif.7376656c15edc54c91518d6967d96a20.gif",

    // Essa url do muscleImg é gerada pelo site https://api.anatome.dev/ (o próprio site da API).
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Alower-back%7CF59E0B%3Acalves%2Cforearm%2Cgluteal%2Chamstring%2Cupper-back%2Cquadriceps%2Ctrapezius&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    
    tags: ["Posterior de Coxa", "Glúteo", "Lombar"]
  },

*/

  // PEITO                       // O nome do exercício em inglês é usado para buscar o GIF da execução e o mapeamento dos músculos trabalhados na API anatome.dev.
  { name: "Supino Reto com Barra", en: "Bench Press" },
  { name: "Supino Inclinado com Halteres", en: "Incline Dumbbell Press" },
  { name: "Supino Inclinado com Barra", en: "Incline Bench Press" },
  { name: "Crucifixo Reto", en: "Dumbbell Fly" },
  { name: "Peck Deck / Voador", en: "Butterfly" },
  { name: "Crossover na Polia High-to-Low", en: "Cable Crossover" },

  // COSTAS
  { name: "Puxada Alta Pronada", en: "Wide-Grip Lat Pulldown" },
  { name: "Remada Baixa", en: "Seated Cable Row" },
  { name: "Remada Curvada", en: "Bent Over Row" },
  { name: "Remada Unilateral (Serrote)", en: "Dumbbell Row" },
  { name: "Remada Cavalinho", en: "T-Bar Row" },

  // BÍCEPS E TRÍCEPS
  { name: "Rosca Direta na Polia", en: "Cable Curl" },
  { name: "Rosca Direta com Barra", en: "Barbell Curl" },
  { name: "Rosca Alternada com Halteres", en: "Dumbbell Curl" },
  { name: "Rosca Martelo", en: "Hammer Curl" },
  { name: "Rosca Scott", en: "Preacher Curl" },
  { name: "Tríceps Corda", en: "Triceps Pushdown" },
  { name: "Tríceps Testa", en: "Skullcrusher" },

  // PERNAS E GLÚTEOS
  { name: "Leg Press 45", en: "Leg Press" },
  { name: "Agachamento Livre", en: "Barbell Squat" },
  { name: "Cadeira Extensora", en: "Leg Extension" },
  { name: "Cadeira Flexora", en: "Seated Leg Curl" },
  { name: "Mesa Flexora", en: "Lying Leg Curl" },
  { name: "Elevação Pélvica", en: "Hip Thrust" },
  { name: "Panturrilha em Pé", en: "Standing Calf Raise" },
  { name: "Afundo com Halter", en: "Dumbbell Lunge" },
  { name: "Stiff com Barra", en: "Barbell Deadlift" },
  { name: "Cadeira Abdutora", en: "Thigh Abductor" },
  { name: "Cadeira Adutora", en: "Thigh Adductor" }, 
  {
    name: "Coice na Máquina",
    en: "",
    executionVideo: "https://karoldeliberato.com.br/wp-content/uploads/2023/04/image74.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Agluteal%7CF59E0B%3Ahamstring&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Posterior de Coxa", "Glúteo"]
  },

  // OMBROS
  { name: "Elevação Lateral", en: "Lateral Raise" },
  { name: "Elevação Frontal", en: "Front Raise" },
  { name: "Desenvolvimento com Halteres", en: "Dumbbell Shoulder Press" },
  { name: "Desenvolvimento Arnold", en: "Arnold Press" },
  { name: "Crucifixo Inverso", en: "Reverse Machine Flyes" },

  // ABDÔMEN
  { name: "Abdominal na Máquina", en: "Ab Crunch Machine" },
];
