const fmt = (n) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtData = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const medalha = (pos) =>
  pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? 'bronze' : ''

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
        const posicionados = e.resultados
          .filter((r) => r.pos >= 1)
          .sort((a, b) => a.pos - b.pos)
        const demais = e.resultados.filter((r) => r.pos === 0)
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
              {e.buyins} buy-ins ({fmt(e.buyin)}) · {e.rebuys} rebuys ({fmt(e.rebuy)})
            </div>

            <ol className="resultados">
              {posicionados.map((r) => (
                <li key={r.name}>
                  <span className={`medal ${medalha(r.pos)}`}>{r.pos}º</span>
                  {r.name}
                  {r.pos <= 3 && (
                    <span className="premio-tag">{fmt(e.prizes[r.pos - 1])}</span>
                  )}
                </li>
              ))}
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
