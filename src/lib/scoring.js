// Tabela de pontuação por posição
// 1º=10, 2º=8, 3º=6, 4º=5, 5º=4, 6º=3, 7º=2, demais participantes=1
const TABELA = { 1: 10, 2: 8, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2 }

// Quanto de cada entrada é desviado para o fundo da Mesa Final.
export const APORTE_FT_BUYIN = 20
export const APORTE_FT_REBUY = 10

export function pontosPorPosicao(pos) {
  return TABELA[pos] ?? 1
}

// Converte pontos de volta para a posição (0 = participou, sem colocação).
// Só funciona até o 7º: do 8º em diante todos valem 1 ponto, e a posição não
// dá para ser deduzida. Por isso existe o campo `pos`.
export function posicaoPorPontos(pts) {
  const achado = Object.entries(TABELA).find(([, v]) => v === pts)
  return achado ? Number(achado[0]) : 0
}

// A colocação de um jogador. Etapas gravadas antes do campo `pos` existir
// caem no fallback pelos pontos.
export function posicaoDoResultado(r) {
  return typeof r.pos === 'number' && r.pos > 0 ? r.pos : posicaoPorPontos(r.pts)
}

// Rótulo da colocação a partir da posição (não dos pontos), então funciona
// para qualquer lugar, inclusive do 8º em diante.
export function labelPosicao(pos) {
  return pos > 0 ? `${pos}º` : null
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

// Quanto um jogador recebe de prêmio.
// `premio` só existe quando houve acordo: os envolvidos combinam uma divisão
// diferente da tabela 60/30/10, mas as posições continuam valendo para o
// ranking. Sem acordo, o prêmio vem da posição.
export function premioDoJogador(r, prizes = []) {
  if (typeof r.premio === 'number') return r.premio
  const idx = indicePremio(r.pts)
  return idx >= 0 ? prizes[idx] || 0 : 0
}

// Acerto de contas de uma etapa: quanto cada jogador pagou e recebeu.
// pagou  = 1 buy-in + (rebuys do jogador × valor do rebuy)
// recebeu = prêmio da posição, ou o valor do acordo se houver
// saldo  = já é o líquido: quem ficou no pódio e ainda deve entra com a
//          diferença, não com o valor cheio da entrada.
export function calcularAcerto(etapa) {
  return etapa.resultados
    .map((r) => {
      const rb = r.rebuys || 0
      const pagou = etapa.buyin + rb * etapa.rebuy
      const recebeu = premioDoJogador(r, etapa.prizes)
      return {
        name: r.name, rebuys: rb, pts: r.pts,
        pagou, recebeu, saldo: recebeu - pagou,
        emAcordo: typeof r.premio === 'number',
      }
    })
    .sort((a, b) => b.saldo - a.saldo || b.recebeu - a.recebeu)
}

// Divide um bolo entre jogadores segundo pesos (ex.: [60, 40]).
// Ajusta o último para o total fechar exatamente, sem centavos perdidos.
export function dividirAcordo(total, pesos) {
  const soma = pesos.reduce((s, p) => s + p, 0)
  if (soma <= 0) return pesos.map(() => 0)
  const valores = pesos.map((p) => Math.round((total * p) / soma))
  const diff = total - valores.reduce((s, v) => s + v, 0)
  if (valores.length) valores[valores.length - 1] += diff
  return valores
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
    if (etapa.num === 'MF') continue // a Mesa Final não pontua no ranking da temporada
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
