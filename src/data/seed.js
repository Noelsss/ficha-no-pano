// Calendário da 30ª Temporada — "Ficha no Pano"
//
// Este arquivo é compilado para dentro do JS que o navegador baixa, então
// NÃO coloque aqui nada financeiro (valores, premiação, pagamentos) nem
// resultados por jogador. Esses dados vivem só no Supabase, protegidos por
// RLS. Os dados históricos das etapas já estão no banco.
//
// Regras da temporada (para referência):
//   Buy-in R$80 | Rebuy R$70
//   De cada buy-in, R$60 vão para o bolão da etapa e R$20 para a Mesa Final.
//   De cada rebuy,  R$60 vão para o bolão da etapa e R$10 para a Mesa Final.
//   Premiação da etapa: 60% / 30% / 10% sobre o bolão.
//   Pontuação: 1º=10, 2º=8, 3º=6, 4º=5, 5º=4, 6º=3, 7º=2, demais=1.

export const BUYIN = 80
export const REBUY = 70

// Datas e sede de cada etapa (a Mesa Final é a linha 'MF').
export const CALENDARIO = [
  { num: 1, data: '2026-02-26', sede: 'Glauber' },
  { num: 2, data: '2026-03-26', sede: 'Davi' },
  { num: 3, data: '2026-04-23', sede: 'Rui' },
  { num: 4, data: '2026-05-28', sede: 'Cícero' },
  { num: 5, data: '2026-06-25', sede: 'Luiz' },
  { num: 6, data: '2026-07-30', sede: 'Jorginho' },
  { num: 7, data: '2026-08-27', sede: 'Maicon' },
  { num: 8, data: '2026-09-24', sede: 'Bruno' },
  { num: 9, data: '2026-10-29', sede: 'Rafael' },
  { num: 'MF', label: 'Mesa Final', data: '2026-11-26', sede: 'Márcio' },
]
