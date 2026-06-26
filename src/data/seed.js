// Dados iniciais da 30ª Temporada — "Ficha no Pano"
// Buy-in padrão: R$80 | Rebuy padrão: R$70
// Premiação: 60% / 30% / 10% do total arrecadado

export const SEED_PLAYERS = [
  'Gibran', 'Rui', 'Guarezi', 'Maicon', 'Rafael', 'Bruno', 'Ricardo',
  'Glauber', 'Rogério', 'Fonseca', 'Davi', 'Luiz', 'Prudente', 'Leonardo',
  'Luis Felipe', 'Cícero', 'Márcio', 'Jean', 'Mi', 'Fernando', 'Jorginho',
  'Marco Lopez', 'Luiz Henrique',
]

// helper para montar resultados de forma compacta:
// posicionados (em ordem) + participantes sem pódio de pontos (pos 0)
const etapa = (num, data, buyin, rebuy, buyins, rebuys, posicionados, participantes) => {
  const total = buyins * buyin + rebuys * rebuy
  const prizes = [
    Math.round(total * 0.6),
    Math.round(total * 0.3),
    Math.round(total * 0.1),
  ]
  const resultados = [
    ...posicionados.map((name, i) => ({ name, pos: i + 1 })),
    ...participantes.map((name) => ({ name, pos: 0 })),
  ]
  return { num, data, buyin, rebuy, buyins, rebuys, total, prizes, resultados }
}

export const SEED_ETAPAS = [
  etapa(1, '2025-02-26', 80, 70, 8, 2,
    ['Cícero', 'Luiz', 'Jean', 'Jorginho', 'Bruno', 'Márcio', 'Rafael'],
    ['Guarezi', 'Glauber']),
  etapa(2, '2025-03-26', 80, 70, 10, 4,
    ['Davi', 'Bruno', 'Glauber', 'Fernando', 'Márcio', 'Rafael', 'Rogério'],
    ['Rui', 'Luiz']),
  etapa(3, '2025-04-23', 80, 70, 11, 6,
    ['Davi', 'Rui', 'Cícero', 'Rafael', 'Bruno', 'Jean', 'Glauber'],
    ['Maicon', 'Guarezi']),
  etapa(4, '2025-05-28', 80, 70, 11, 5,
    ['Cícero', 'Luiz', 'Márcio', 'Davi', 'Jean', 'Rafael', 'Bruno'],
    ['Glauber', 'Rogério', 'Maicon']),
  etapa(5, '2025-06-25', 80, 70, 9, 2,
    ['Glauber', 'Luiz', 'Bruno', 'Márcio', 'Cícero', 'Jorginho', 'Rafael'],
    ['Maicon', 'Rui', 'Rogério']),
]
