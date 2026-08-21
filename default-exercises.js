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

/*
{
    name: "",
    en: "",
    executionVideo: "",
    muscleImg: "",
    tags: ["Posterior de Coxa", "Glúteo"]
  },
*/


 
  /* 
  // EXERCÍCIOS TEMPORARIAMENTE EXCLUÍDOS
  { name: "Supino Reto com Barra", en: "Bench Press" },
  { name: "Supino Inclinado com Halteres", en: "Incline Dumbbell Press" },
  { name: "Supino Inclinado com Barra", en: "Barbell Incline Bench Press - Medium Grip" },
  { name: "Remada Curvada", en: "Bent Over Row" },
  { name: "Remada Unilateral (Serrote)", en: "Dumbbell Row" },
  { name: "Remada Cavalinho", en: "T-Bar Row" },
  { name: "Desenvolvimento com Halteres", en: "Dumbbell Shoulder Press" },
  { name: "Desenvolvimento na Máquina", en: "Leverage Shoulder Press" },
  { name: "Desenvolvimento Arnold", en: "Arnold Press" },
  { name: "Rosca Direta com Barra", en: "Barbell Curl" },
  { name: "Rosca Concentrada", en: "Concentration Curls" },
  { name: "Rosca Alternada com Halteres", en: "Dumbbell Curl" },
  { name: "Tríceps Testa", en: "Skullcrusher" },
  { name: "Agachamento Livre com Barra", en: "Barbell Squat" },
  { name: "Elevação Pélvica", en: "Hip Thrust" },
  { name: "Panturrilha em Pé", en: "Standing Calf Raise" },
  { name: "Afundo com Halter", en: "Dumbbell Lunge" },
  { name: "Coice na Polia", en: "One-Legged Cable Kickback" },
  { name: "Agachamento Hack", en: "Hack Squat" },

*/

  // PEITO
  {
    name: "Supino na Máquina",
    en: "Leverage Chest Press",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2021_02/supino-na-maquina-animacao.gif.97fa92beb6ba85f35e375c21c04e3bf3.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Achest%7CF59E0B%3Adeltoids%2Ctriceps&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Peito", "Ombros", "Tríceps"]
  },
  {
    name: "Crucifixo na Máquina",
    en: "Dumbbell Fly",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2017_03/crucifixo-na-maquina-animacao.gif.5f9dbd30547fc0b027c0b92d7de69812.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Achest&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Peito"]
  },

  // OMBROS
  {
    name: "Crucifixo Inverso na Máquina",
    en: "Reverse Machine Flyes",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2017_03/crucifixo-invertido-na-maquina-pegada-pronada-animacao.gif.e607c780354327c7c589644dd9b472ff.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Adeltoids&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Ombros"]
  },
  {
    name: "Elevação Lateral",
    en: "Lateral Raise",
    executionVideo: "https://i.makeagif.com/media/11-08-2015/O1IT2O.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Adeltoids&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Ombros"]
  },
  {
    name: "Elevação Frontal",
    en: "Alternating Deltoid Raise",
    executionVideo: "https://image.tuasaude.com/media/article/sz/nf/elevacao-frontal_75624.gif?width=686&height=487",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Adeltoids&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Ombros"]
  },

  // COSTAS
  {
    name: "Puxada Alta Pronada",
    en: "Wide-Grip Lat Pulldown",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2017_03/puxada-pela-frente-pronada-animacao.gif.5af6bd6d06765d902c97ce1d96a17f78.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Aupper-back%7CF59E0B%3Abiceps%2Cdeltoids&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Costas", "Bíceps", "Ombros"]
  },
  {
    name: "Puxada Alta com Triângulo",
    en: "V-Bar Pulldown",
    executionVideo: "https://nexur-web.s3.us-east-2.amazonaws.com/exercicios/775-0.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Aupper-back%7CF59E0B%3Abiceps%2Cdeltoids&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Costas", "Bíceps", "Ombros"]
  },
  {
    name: "Remada Baixa",
    en: "Seated Cable Row",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2017_03/remada-neutra-no-cabo-animacao.gif.c5cd468a9328c76f3d6323201132c543.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Aupper-back%7CF59E0B%3Abiceps%2Cdeltoids&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Costas", "Bíceps", "Ombros"]
  },


  // BÍCEPS 
  {
    name: "Rosca Direta na Polia",
    en: "",
    executionVideo: "https://i.makeagif.com/media/3-05-2016/JXscRj.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Abiceps&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Bíceps"]
  },
  {
    name: "Rosca Inversa na Polia",
    en: "",
    executionVideo: "https://www.image2url.com/r2/default/gifs/1784742220458-d4262400-e5ed-4ac6-b376-b24456cb5a82.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Abiceps&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Bíceps"]
  },
  {
    name: "Rosca Martelo",
    en: "Hammer Curl",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2017_03/rosca-biceps-com-halteres-pegada-neutra-animaca.gif.9d43b846b8c1af6d868271e6ab0ac07d.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Abiceps&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Bíceps"]
  },
  {
    name: "Rosca Scott",
    en: "Preacher Curl",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2018_01/flexao-de-cotovelo-no-banco-scott-animacao.gif.c39fc6e27d046f9aca73db65376afd49.gif",
    muscleImg: " https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Abiceps&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Bíceps"]
  },

  // TRÍCEPS
  {
    name: "Tríceps Corda",
    en: "Triceps Pushdown",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2021_08/triceps-na-polia-com-a-corda-animacao.gif.2762a7b7deb84f5aec8b77fe4c64a09b.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Atriceps&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Tríceps"]
  },
  {
    name: "Tríceps na Máquina",
    en: "Dip Machine",
    executionVideo: "https://www.mundoboaforma.com.br/wp-content/uploads/2021/07/triceps-sentado-no-aparelho.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Atriceps%7CF59E0B%3Achest%2Cdeltoids&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Tríceps", "Peito", "Ombros"]
  },
  {
    name: "Tríceps Francês com Halter",
    en: "Decline Dumbbell Triceps Extension",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2017_03/triceps-frances-com-halter-bilateral-animacao.gif.ea6e5e979e74e57605440cf1f1bcabd0.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Atriceps&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Tríceps"]
  },

  // PERNAS E GLÚTEOS
  {
    name: "Leg Press",
    en: "Leg Press",
    executionVideo: "https://www.strengthlog.com/wp-content/uploads/2025/11/leg-press.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Aquadriceps%7CF59E0B%3Acalves%2Cgluteal%2Chamstring&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: []
  },
  {
    name: "Cadeira Extensora",
    en: "Leg Extension",
    executionVideo: "https://www.ferrosports.com.br/img_external/pernas/image29.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Aquadriceps&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: []
  },
 
  {
    name: "Cadeira Flexora",
    en: "Seated Leg Curl",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2017_03/cadeira-flexora-animacao.gif.90e391e83229726537404de3a3af9104.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Ahamstring&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Posterior de Coxa"]
  },
  {
    name: "Mesa Flexora",
    en: "Lying Leg Curl",
    executionVideo: "https://s2.glbimg.com/pTKwbtiyjUapkrGw8OspX1Zwnws=/top/e.glbimg.com/og/ed/f/original/2018/05/24/9.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Ahamstring&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Posterior de Coxa"]
  },
  {
    name: "Stiff com Barra",
    en: "Barbell Deadlift",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2017_02/stiff-animacao.gif.7376656c15edc54c91518d6967d96a20.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Alower-back%7CF59E0B%3Acalves%2Cforearm%2Cgluteal%2Chamstring%2Cupper-back%2Cquadriceps%2Ctrapezius&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Posterior de Coxa", "Glúteo"]
  },
  {
    name: "Cadeira Abdutora",
    en: "Thigh Abductor",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2017_03/cadeira-abdutora-animacao.gif.dda884999c6170fb40e329f99ea361ee.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Aadductors%7CF59E0B%3Agluteal&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Glúteo", "Adutores"]
  },
  {
    name: "Cadeira Adutora",
    en: "Thigh Adductor",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2017_03/cadeira-adutora-animacao.gif.563f462fcc55af95be418e63bf3298e5.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Aadductors%7CF59E0B%3Agluteal%2Chamstring&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Glúteo", "Adutores", "Posterior de Coxa"]
  },
  {
    name: "Panturrilha no Leg Press",
    en: "Calf Press On The Leg Press Machine",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2017_03/panturrilha-no-leg-press-45-animacao.gif.d24036d0cf1faf5b9514fe86f6635cbc.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Acalves&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Panturrilha"]
  },
  {
    name: "Coice na Máquina",
    en: "",
    executionVideo: "https://karoldeliberato.com.br/wp-content/uploads/2023/04/image74.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Agluteal%7CF59E0B%3Ahamstring&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Posterior de Coxa", "Glúteo"]
  },
  {
    name: "Leg Press Horizontal",
    en: "",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2017_03/leg-press-horizontal-animacao.gif.d9ac3b4d0e63b85884226242e3679564.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Aquadriceps%7CF59E0B%3Acalves%2Cgluteal%2Chamstring&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Quadríceps","Posterior de Coxa", "Glúteo", "Panturrilha"]
  },

  // ABDÔMEN
  {
    name: "Abdominal na Máquina",
    en: "Ab Crunch Machine",
    executionVideo: "https://cdn.fisiculturismo.com.br/monthly_2020_09/abdominal-na-maquina-animacao.gif.020179dbdd1e089f5c5bfe207d9bc88a.gif",
    muscleImg: "https://api.anatome.dev/generateImage?gender=male&view=dual&layers=DC2626%3Aabs&width=768&height=1024&output=raw&contour=on&contour_color=%23e5e7eb&contour_stroke=%23dadada&contour_width=2",
    tags: ["Abdômen"]
  },
];
