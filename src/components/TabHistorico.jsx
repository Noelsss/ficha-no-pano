import { useState } from 'react'
import { calcularAcerto, indicePremio, posLabel } from '../lib/scoring'

const fmt = (n) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtData = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const medalha = (idx) =>
  idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''

function EtapaItem({ e, onExcluir }) {
  const [verAcerto, setVerAcerto] = useState(false)
  const ehMF = e.num === 'MF'
  const ordenados = [...e.resultados].sort((a, b) => b.pts - a.pts)
  const pontuaram = ordenados.filter((r) => r.pts >= 2)
  const demais = ordenados.filter((r) => r.pts < 2)
  const acerto = e.detalhado ? calcularAcerto(e) : null
  const titulo = ehMF ? '🏆 Mesa Final' : `Etapa #${e.num}`

  return (
    <div className={`etapa-item ${ehMF ? 'mf' : ''}`}>
      <div className="etapa-head">
        <div>
          <strong>{titulo}</strong>
          <span className="etapa-data">{fmtData(e.data)}</span>
        </div>
        <div className="etapa-total">{fmt(ehMF ? e.poolEtapa : e.total)}</div>
        <button
          className="btn-del"
          title="Excluir"
          onClick={() => {
            if (confirm(`Excluir ${ehMF ? 'a Mesa Final' : `a etapa #${e.num}`}?`)) onExcluir(e.num)
          }}
        >
          Excluir
        </button>
      </div>

      <div className="etapa-meta">
        {e.sede && <>🏠 {e.sede} · </>}
        {ehMF ? (
          <>💰 {fmt(e.acumulado || 0)} acumulados distribuídos</>
        ) : (
          <>
            {e.buyins} buy-ins ({fmt(e.buyin)}) · {e.rebuys} rebuys ({fmt(e.rebuy)})
            {e.fundoFT != null && <> · 🏁 Mesa Final {fmt(e.fundoFT)}</>}
          </>
        )}
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

      {acerto && (
        <>
          <button className="link-acerto" onClick={() => setVerAcerto((v) => !v)}>
            {verAcerto ? '▾ ocultar acerto de contas' : '▸ ver acerto de contas'}
          </button>
          {verAcerto && (
            <div className="tabela-wrap">
              <table className="tabela compacta">
                <thead>
                  <tr>
                    <th className="left">Jogador</th>
                    <th>Rebuys</th>
                    <th>Pagou</th>
                    <th>Recebeu</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {acerto.map((a) => (
                    <tr key={a.name}>
                      <td className="left nome">{a.name}</td>
                      <td>{a.rebuys}</td>
                      <td>{fmt(a.pagou)}</td>
                      <td>{a.recebeu ? fmt(a.recebeu) : '—'}</td>
                      <td className={a.saldo >= 0 ? 'pos' : 'neg'}>{fmt(a.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function TabHistorico({ etapas, onExcluir }) {
  if (!etapas.length) {
    return (
      <div className="card">
        <h2>Histórico</h2>
        <p className="hint">Nenhuma etapa registrada ainda.</p>
      </div>
    )
  }

  const sortKey = (n) => (n === 'MF' ? Infinity : n)
  const ordenadas = [...etapas].sort((a, b) => sortKey(b.num) - sortKey(a.num))

  return (
    <div className="card">
      <h2>Histórico de Etapas</h2>
      {ordenadas.map((e) => (
        <EtapaItem key={e.num} e={e} onExcluir={onExcluir} />
      ))}
    </div>
  )
}
