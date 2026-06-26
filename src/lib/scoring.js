// Tabela de pontuação por posição
// 1º=10, 2º=8, 3º=6, 4º=5, 5º=4, 6º=3, 7º=2, demais participantes=1
const TABELA = { 1: 10, 2: 8, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2 }

// Quanto de cada entrada é desviado para o fundo da Mesa Final.
export const APORTE_FT_BUYIN = 20
export const APORTE_FT_REBUY = 10

export function pontosPorPosicao(pos) {
  return TABELA[pos] ?? 1
}

// Converte pontos de volta para o rótulo de posição (para exibição).
export function posLabel(pts) {
  switch (pts) {
    case 10: return '1º'
    case 8: return '2º'
    case 6: return '3º'
    case 5: return '4º'
    case 4: return '5º'
    case 3: return '6º'
    case 2: return '7º'
    default: return null // 1 = participou
  }
}

// Total arrecadado (buy-ins + rebuys)
export function calcularTotal(buyins, rebuys, buyin, rebuy) {
  return buyins * buyin + rebuys * rebuy
}

// Fundo da Mesa Final acumulado na etapa
export function calcularFundoFT(buyins, rebuys) {
  return buyins * APORTE_FT_BUYIN + rebuys * APORTE_FT_REBUY
}

// Bolão da etapa (o que sobra para premiar 1º/2º/3º)
export function calcularPoolEtapa(buyins, rebuys, buyin, rebuy) {
  return calcularTotal(buyins, rebuys, buyin, rebuy) - calcularFundoFT(buyins, rebuys)
}

// Premiação 60/30/10 sobre o bolão da etapa
export function calcularPremios(poolEtapa) {
  return [
    Math.round(poolEtapa * 0.6),
    Math.round(poolEtapa * 0.3),
    Math.round(poolEtapa * 0.1),
  ]
}

// Índice do prêmio (0=1º, 1=2º, 2=3º) a partir dos pontos; -1 se não pontuou no pódio.
export function indicePremio(pts) {
  if (pts === 10) return 0
  if (pts === 8) return 1
  if (pts === 6) return 2
  return -1
}

// Monta o ranking geral a partir das etapas.
export function calcularRanking(etapas) {
  const mapa = new Map()

  const garantir = (name) => {
    if (!mapa.has(name)) {
      mapa.set(name, {
        name, pontos: 0, etapas: 0,
        vitorias: 0, segundos: 0, terceiros: 0,
      })
    }
    return mapa.get(name)
  }

  for (const etapa of etapas) {
    for (const r of etapa.resultados) {
      const j = garantir(r.name)
      j.pontos += r.pts
      j.etapas += 1
      if (r.pts === 10) j.vitorias += 1
      if (r.pts === 8) j.segundos += 1
      if (r.pts === 6) j.terceiros += 1
    }
  }

  return [...mapa.values()].sort(
    (a, b) =>
      b.pontos - a.pontos ||
      b.vitorias - a.vitorias ||
      b.segundos - a.segundos ||
      b.terceiros - a.terceiros ||
      a.name.localeCompare(b.name, 'pt-BR'),
  )
}
