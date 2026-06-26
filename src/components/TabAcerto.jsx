import { useMemo, useRef, useState } from 'react'
import { cobrancasEsperadas, conciliar, parseExtrato } from '../lib/reconcile'

const fmt = (n) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtData = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}`
}

export default function TabAcerto({
  etapas, players, pagamentos, setPagamento, aplicarPagamentos,
}) {
  const [previa, setPrevia] = useState(null)
  const inputRef = useRef(null)

  const cobrancas = useMemo(() => cobrancasEsperadas(etapas), [etapas])
  const statusMap = useMemo(() => {
    const m = {}
    for (const p of pagamentos) m[`${p.etapaNum}|${p.player}`] = p
    return m
  }, [pagamentos])

  const estaPago = (c) => !!statusMap[`${c.etapaNum}|${c.player}`]?.pago

  const furos = cobrancas.filter((c) => c.tipo === 'deve' && !estaPago(c))
  const aPagar = cobrancas.filter((c) => c.tipo === 'recebe' && !estaPago(c))
  const totalFuros = furos.reduce((s, c) => s + c.valor, 0)

  const porEtapa = useMemo(() => {
    const g = {}
    for (const c of cobrancas) (g[c.etapaNum] ||= []).push(c)
    return Object.entries(g).sort((a, b) => Number(b[0]) - Number(a[0]))
  }, [cobrancas])

  function togglePago(c) {
    setPagamento({
      etapaNum: c.etapaNum, player: c.player, pago: !estaPago(c),
      valor: c.valor, dataPago: null, fonte: 'manual',
    })
  }

  function aoEscolherArquivo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const trans = parseExtrato(String(reader.result))
      setPrevia(conciliar({ etapas, transacoes: trans, players }))
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  async function aplicar() {
    if (previa) await aplicarPagamentos(previa.pagamentos)
    setPrevia(null)
  }

  return (
    <div className="card">
      <h2>Acerto de Contas</h2>

      <div className="acerto-acoes">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={aoEscolherArquivo}
        />
        <button className="btn-primary" onClick={() => inputRef.current?.click()}>
          📥 Importar extrato (.csv)
        </button>
      </div>

      {/* Prévia da conciliação */}
      {previa && (
        <div className="previa">
          <h3>Prévia da importação</h3>
          <p className="hint">
            {previa.resultados.filter((r) => r.pago).length} casados ·{' '}
            {previa.furos.length} furos · {previa.naoCasadas.length} não casadas
          </p>
          {previa.furos.length > 0 && (
            <div className="previa-bloco furos">
              <strong>❌ Quem deve e não pagou:</strong>
              {previa.furos.map((f) => (
                <div key={`${f.etapaNum}-${f.player}`}>
                  {f.player} — etapa {f.etapaNum} — <b>{fmt(f.valor)}</b>
                </div>
              ))}
            </div>
          )}
          {previa.naoCasadas.length > 0 && (
            <div className="previa-bloco">
              <strong>❓ Transações não casadas:</strong>
              {previa.naoCasadas.map((t, i) => (
                <div key={i}>
                  {fmtData(t.data)} · {t.jogador || t.nome} · {fmt(t.valor)}
                  {t.motivo ? ` (${t.motivo})` : ''}
                </div>
              ))}
            </div>
          )}
          <div className="previa-botoes">
            <button className="btn-primary" onClick={aplicar}>Aplicar</button>
            <button className="btn-ghost" onClick={() => setPrevia(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Furos da temporada */}
      {furos.length > 0 ? (
        <div className="furos-banner">
          <div className="furos-titulo">⚠️ Faltando receber: <strong>{fmt(totalFuros)}</strong></div>
          {furos.map((c) => (
            <div key={`${c.etapaNum}-${c.player}`} className="furo-linha">
              <span>{c.player}</span>
              <span className="furo-et">etapa {c.etapaNum}</span>
              <span className="neg">{fmt(c.valor)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="hint">✅ Nenhuma pendência de recebimento.</p>
      )}

      {aPagar.length > 0 && (
        <p className="hint">
          💸 Prêmios ainda a pagar: {aPagar.map((c) => `${c.player} (${fmt(c.valor)})`).join(', ')}.
        </p>
      )}

      {/* Detalhe por etapa */}
      {porEtapa.map(([num, lista]) => {
        const quit = lista.filter(estaPago).length
        return (
          <div key={num} className="acerto-etapa">
            <h3>Etapa #{num} <span className="badge">{quit}/{lista.length} quitados</span></h3>
            <div className="tabela-wrap">
              <table className="tabela compacta">
                <thead>
                  <tr><th className="left">Jogador</th><th>Situação</th><th>Valor</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {lista.sort((a, b) => b.valor - a.valor).map((c) => {
                    const pago = estaPago(c)
                    return (
                      <tr key={c.player}>
                        <td className="left nome">{c.player}</td>
                        <td>{c.tipo === 'deve' ? 'deve' : 'recebe'}</td>
                        <td className={c.tipo === 'deve' ? 'neg' : 'pos'}>{fmt(c.valor)}</td>
                        <td>
                          <button
                            className={`pago-toggle ${pago ? 'on' : ''}`}
                            onClick={() => togglePago(c)}
                          >
                            {pago ? '✅ pago' : '⬜ pendente'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
