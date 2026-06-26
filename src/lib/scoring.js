// Tabela de pontuação por posição
// 1º=10, 2º=8, 3º=6, 4º=5, 5º=4, 6º=3, 7º=2, demais participantes=1
const TABELA = { 1: 10, 2: 8, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2 }

export function pontosPorPosicao(pos) {
  return TABELA[pos] ?? 1
}

// Calcula a premiação 60/30/10 a partir do total
export function calcularPremios(total) {
  return [
    Math.round(total * 0.6),
    Math.round(total * 0.3),
    Math.round(total * 0.1),
  ]
}

// Total arrecadado a partir das quantidades
export function calcularTotal(buyins, rebuys, buyin, rebuy) {
  return buyins * buyin + rebuys * rebuy
}

// Monta o ranking geral a partir das etapas.
// Saldo financeiro (aproximado): prêmios recebidos − (buy-in × participações).
// Obs.: rebuys não são atribuídos por jogador na planilha, então o custo
// considerado é apenas 1 buy-in por etapa disputada.
export function calcularRanking(etapas) {
  const mapa = new Map()

  const garantir = (name) => {
    if (!mapa.has(name)) {
      mapa.set(name, {
        name, pontos: 0, etapas: 0, vitorias: 0,
        segundos: 0, terceiros: 0,
        premios: 0, custo: 0, saldo: 0,
      })
    }
    return mapa.get(name)
  }

  for (const etapa of etapas) {
    const premios = etapa.prizes ?? calcularPremios(etapa.total)
    for (const r of etapa.resultados) {
      const j = garantir(r.name)
      j.pontos += pontosPorPosicao(r.pos)
      j.etapas += 1
      j.custo += etapa.buyin
      if (r.pos === 1) j.vitorias += 1
      if (r.pos === 2) j.segundos += 1
      if (r.pos === 3) j.terceiros += 1
      if (r.pos >= 1 && r.pos <= 3) j.premios += premios[r.pos - 1] ?? 0
    }
  }

  for (const j of mapa.values()) j.saldo = j.premios - j.custo

  return [...mapa.values()].sort(
    (a, b) =>
      b.pontos - a.pontos ||
      b.vitorias - a.vitorias ||
      b.saldo - a.saldo ||
      a.name.localeCompare(b.name, 'pt-BR'),
  )
}
