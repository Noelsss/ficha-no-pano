import { indicePremio, posLabel } from '../lib/scoring'

const fmt = (n) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtData = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const medalha = (idx) =>
  idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''

export default function TabHistorico({ etapas, onExcluir }) {
  if (!etapas.length) {
    return (
      <div className="card">
        <h2>Histórico</h2>
        <p className="hint">Nenhuma etapa registrada ainda.</p>
      </div>
    )
  }

  const ordenadas = [...etapas].sort((a, b) => b.num - a.num)

  return (
    <div className="card">
      <h2>Histórico de Etapas</h2>
      {ordenadas.map((e) => {
        const ordenados = [...e.resultados].sort((a, b) => b.pts - a.pts)
        const pontuaram = ordenados.filter((r) => r.pts >= 2)
        const demais = ordenados.filter((r) => r.pts < 2)
        return (
          <div key={e.num} className="etapa-item">
            <div className="etapa-head">
              <div>
                <strong>Etapa #{e.num}</strong>
                <span className="etapa-data">{fmtData(e.data)}</span>
              </div>
              <div className="etapa-total">{fmt(e.total)}</div>
              <button
                className="btn-del"
                title="Excluir etapa"
                onClick={() => {
                  if (confirm(`Excluir a etapa #${e.num}?`)) onExcluir(e.num)
                }}
              >
                Excluir
              </button>
            </div>

            <div className="etapa-meta">
              {e.sede && <>🏠 {e.sede} · </>}
              {e.buyins} buy-ins ({fmt(e.buyin)}) · {e.rebuys} rebuys ({fmt(e.rebuy)})
              {e.fundoFT != null && <> · 🏁 Mesa Final {fmt(e.fundoFT)}</>}
            </div>

            <ol className="resultados">
              {pontuaram.map((r) => {
                const idx = indicePremio(r.pts)
                return (
                  <li key={r.name}>
                    <span className={`medal ${medalha(idx)}`}>{posLabel(r.pts)}</span>
                    {r.name}
                    <span className="pts-tag">{r.pts} pts</span>
                    {idx >= 0 && (
                      <span className="premio-tag">{fmt(e.prizes[idx])}</span>
                    )}
                  </li>
                )
              })}
            </ol>
            {demais.length > 0 && (
              <div className="demais">
                Também jogaram: {demais.map((r) => r.name).join(', ')}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
