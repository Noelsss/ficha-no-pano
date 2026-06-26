import { calcularAcerto } from './scoring'

// O Glauber é a banca: as transações dele (e o saldo dele) são internas.
export const BANCA = 'Glauber'

// Mapa nome-do-banco (normalizado) → jogador. Derivado do extrato do PicPay.
const ALIASES = [
  ['CICERO DIOGO MENEGUZZI METZ', 'Cícero'],
  ['MARCIO ROGERIO DE MEDEIROS', 'Márcio'],
  ['MARCIO ROGERIO MEDEIROS', 'Márcio'],
  ['LUIZ GUSTAVO LATOCHESKI', 'Luiz'],
  ['JORGE HENRIQUE GOULART SCHAEFER MARTINS', 'Jorginho'],
  ['BRUNO DUART RAMOS', 'Bruno'],
  ['DAVI PICCININI DOTTO', 'Davi'],
  ['RUI CESAR RIOS MACHADO', 'Rui'],
  ['FERNANDO KURTEN BITTENCOURT', 'Fernando'],
  ['ROGERIO PINTO DA LUZ', 'Rogério'],
  ['JEAN GOMES DE MELLO', 'Jean'],
  ['RAFAEL JORGE DA LUZ', 'Rafael'],
  ['EDSON GUAREZI BROLESE', 'Guarezi'],
  ['MAICON FRANCISCO DE MEDEIROS', 'Maicon'],
  ['GLAUBER MACHADO PINTO', 'Glauber'],
]

export function normalizar(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// Resolve o nome do banco para um jogador conhecido.
// 1º tenta alias exato; depois casa pelo primeiro nome contra a lista de jogadores.
export function resolverJogador(nomeBanco, players = []) {
  const n = normalizar(nomeBanco)
  for (const [alias, jogador] of ALIASES) {
    if (normalizar(alias) === n) return jogador
  }
  const primeiro = n.split(' ')[0]
  const achado = players.find((p) => normalizar(p).split(' ')[0] === primeiro)
  return achado || null
}

// Converte "−R$ 1.080,00" → -1080 ; "+R$ 80,00" → 80
function parseValor(s) {
  const neg = /[−-]/.test(s)
  const num = Number(
    String(s).replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.'),
  )
  if (Number.isNaN(num)) return 0
  return neg ? -num : num
}

// Quebra uma linha de CSV respeitando aspas.
function splitCSV(linha) {
  const out = []
  let cur = ''
  let dentro = false
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (c === '"') {
      if (dentro && linha[i + 1] === '"') { cur += '"'; i++ }
      else dentro = !dentro
    } else if (c === ',' && !dentro) {
      out.push(cur); cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur)
  return out
}

// Lê o CSV do extrato → [{data, nome, valor, tipo}] (ignora rendimentos).
export function parseExtrato(texto) {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim())
  const trans = []
  for (const linha of linhas) {
    const cols = splitCSV(linha)
    if (cols.length < 5) continue
    const [data, , tipo, nome, valor] = cols
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) continue // pula cabeçalho
    if (/rendimento/i.test(tipo)) continue
    trans.push({ data, tipo, nome, valor: parseValor(valor) })
  }
  return trans
}

// Lista de cobranças esperadas (deve/recebe) por jogador, exceto a banca.
export function cobrancasEsperadas(etapas) {
  const lista = []
  const ordem = [...etapas].sort((a, b) => {
    const k = (x) => (x === 'MF' ? Infinity : x)
    return k(a.num) - k(b.num)
  })
  for (const e of ordem) {
    if (e.num === 'MF') continue
    for (const a of calcularAcerto(e)) {
      if (a.name === BANCA || a.saldo === 0) continue
      lista.push({
        etapaNum: e.num,
        data: e.data,
        player: a.name,
        tipo: a.saldo < 0 ? 'deve' : 'recebe',
        valor: Math.abs(a.saldo),
      })
    }
  }
  return lista
}

// Concilia o extrato com as cobranças.
// Retorna { resultados, furos, naoCasadas, pagamentos } onde pagamentos é a
// lista pronta para gravar (status pago por etapa/jogador).
export function conciliar({ etapas, transacoes, players = [] }) {
  const cobrancas = cobrancasEsperadas(etapas)

  // transações por jogador (exclui a banca)
  const txPorJogador = {}
  const semDono = []
  for (const t of transacoes) {
    const jogador = resolverJogador(t.nome, players)
    if (!jogador) { semDono.push(t); continue }
    if (jogador === BANCA) continue
    ;(txPorJogador[jogador] ||= []).push({ ...t, usada: false })
  }
  for (const j of Object.keys(txPorJogador)) {
    txPorJogador[j].sort((a, b) => a.data.localeCompare(b.data))
  }

  const resultados = []
  // casa cada cobrança (em ordem de etapa) com a 1ª transação livre de mesmo sinal/valor
  for (const c of cobrancas) {
    const txs = txPorJogador[c.player] || []
    const sinal = c.tipo === 'deve' ? 1 : -1
    const match = txs.find(
      (t) => !t.usada && Math.sign(t.valor) === sinal && Math.abs(t.valor) === c.valor,
    )
    if (match) match.usada = true
    resultados.push({
      ...c,
      pago: !!match,
      dataPago: match ? match.data : null,
      valorPago: match ? Math.abs(match.valor) : null,
    })
  }

  // sobras: neutraliza depósito+devolução do mesmo jogador (+X e −X) → não é furo
  for (const j of Object.keys(txPorJogador)) {
    const livres = txPorJogador[j].filter((t) => !t.usada)
    for (const a of livres) {
      if (a.usada) continue
      const par = livres.find(
        (b) => !b.usada && b !== a && b.valor === -a.valor,
      )
      if (par) { a.usada = true; par.usada = true; a.neutra = true; par.neutra = true }
    }
  }

  const furos = resultados.filter((r) => r.tipo === 'deve' && !r.pago)
  const naoCasadas = [
    ...semDono.map((t) => ({ ...t, motivo: 'remetente não reconhecido' })),
    ...Object.values(txPorJogador).flat()
      .filter((t) => !t.usada && !t.neutra)
      .map((t) => ({ ...t, jogador: resolverJogador(t.nome, players) })),
  ]

  // pagamentos prontos para gravar (todas as cobranças viram status)
  const pagamentos = resultados.map((r) => ({
    etapaNum: r.etapaNum,
    player: r.player,
    pago: r.pago,
    valor: r.valorPago,
    dataPago: r.dataPago,
    fonte: 'extrato',
  }))

  return { resultados, furos, naoCasadas, pagamentos }
}
