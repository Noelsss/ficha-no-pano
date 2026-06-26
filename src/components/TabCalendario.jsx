const fmt = (n) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtData = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const diaSemana = (iso) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })

export default function TabCalendario({ calendario, etapas }) {
  const hoje = new Date().toISOString().slice(0, 10)
  const realizadas = new Set(etapas.map((e) => e.num))
  const fundoAcumulado = etapas.reduce((s, e) => s + (e.fundoFT || 0), 0)

  // próxima etapa agendada (primeira no futuro que ainda não aconteceu)
  const proxima = calendario.find(
    (c) => c.data >= hoje && !realizadas.has(c.num),
  )

  return (
    <div className="card">
      <h2>Calendário da Temporada</h2>

      <div className="ft-resumo">
        <span>🏁 Fundo da Mesa Final acumulado</span>
        <strong>{fmt(fundoAcumulado)}</strong>
      </div>

      <div className="cal-lista">
        {calendario.map((c) => {
          const feita = realizadas.has(c.num)
          const ehProxima = proxima && c.num === proxima.num
          const ehMF = c.num === 'MF'
          const status = feita ? 'realizada' : ehProxima ? 'proxima' : 'agendada'
          return (
            <div key={c.num} className={`cal-item ${status} ${ehMF ? 'mf' : ''}`}>
              <div className="cal-num">{ehMF ? '🏆' : `#${c.num}`}</div>
              <div className="cal-info">
                <div className="cal-titulo">
                  {c.label || `Etapa ${c.num}`}
                  {ehProxima && <span className="tag-prox">PRÓXIMA</span>}
                </div>
                <div className="cal-data">
                  {fmtData(c.data)} · <span className="cap">{diaSemana(c.data)}</span>
                </div>
              </div>
              <div className="cal-sede">
                <span className="cal-sede-label">Sede</span>
                <strong>{c.sede}</strong>
              </div>
              <div className="cal-status">
                {feita ? '✅' : ehProxima ? '⏳' : '🗓️'}
              </div>
            </div>
          )
        })}
      </div>

      <p className="hint">
        ✅ realizada · ⏳ próxima · 🗓️ agendada. A Mesa Final reúne os líderes
        e premia com o fundo acumulado ao longo da temporada.
      </p>
    </div>
  )
}
