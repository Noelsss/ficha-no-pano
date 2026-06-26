import { useMemo, useState } from 'react'
import {
  calcularAcerto, calcularFundoFT, calcularPoolEtapa, calcularPremios,
  calcularTotal, pontosPorPosicao,
} from '../lib/scoring'

const fmt = (n) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDataBR = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function TabEtapa({
  players, proximoNum, calendario = [], etapas = [], onSalvar, onAddPlayer,
}) {
  const hoje = new Date().toISOString().slice(0, 10)

  // etapas agendadas que ainda não foram realizadas (exclui a Mesa Final)
  const playedNums = useMemo(
    () => new Set(etapas.map((e) => e.num)),
    [etapas],
  )
  const agendadas = useMemo(
    () => calendario.filter(
      (c) => typeof c.num === 'number' && !playedNums.has(c.num),
    ),
    [calendario, playedNums],
  )
  const temAgenda = agendadas.length > 0
  const padrao = agendadas[0]

  const [num, setNum] = useState(() => padrao?.num ?? proximoNum)
  const [data, setData] = useState(() => padrao?.data ?? hoje)
  const [sede, setSede] = useState(() => padrao?.sede ?? '')
  const [buyin, setBuyin] = useState(80)
  const [rebuy, setRebuy] = useState(70)
  // jogadores na mesa (ordem de entrada) + rebuys e posição por jogador
  const [mesa, setMesa] = useState([])
  const [rebuysByName, setRebuys] = useState({})
  const [posByName, setPos] = useState({})
  const [novoJogador, setNovoJogador] = useState('')

  const vB = Number(buyin) || 0
  const vR = Number(rebuy) || 0
  const nB = mesa.length
  const nR = useMemo(
    () => mesa.reduce((s, n) => s + (rebuysByName[n] || 0), 0),
    [mesa, rebuysByName],
  )

  const total = calcularTotal(nB, nR, vB, vR)
  const fundoFT = calcularFundoFT(nB, nR)
  const poolEtapa = calcularPoolEtapa(nB, nR, vB, vR)
  const premios = calcularPremios(poolEtapa)

  // posições já usadas (para não duplicar 1º, 2º…)
  const posUsadas = useMemo(() => {
    const m = {}
    for (const n of mesa) {
      const p = posByName[n]
      if (p >= 1) m[p] = n
    }
    return m
  }, [mesa, posByName])

  // etapa "rascunho" para calcular o acerto ao vivo
  const etapaDraft = useMemo(() => ({
    buyin: vB, rebuy: vR, prizes: premios,
    resultados: mesa.map((name) => ({
      name,
      pts: pontosPorPosicao(posByName[name] || 0),
      rebuys: rebuysByName[name] || 0,
    })),
  }), [mesa, posByName, rebuysByName, vB, vR, premios])

  const acerto = useMemo(() => calcularAcerto(etapaDraft), [etapaDraft])

  function toggleMesa(name) {
    setMesa((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    )
  }
  function incRebuy(name, delta) {
    setRebuys((prev) => {
      const v = Math.max(0, (prev[name] || 0) + delta)
      return { ...prev, [name]: v }
    })
  }
  function setPosicao(name, pos) {
    setPos((prev) => ({ ...prev, [name]: pos }))
  }
  function escolherEtapa(n) {
    setNum(n)
    const e = agendadas.find((c) => c.num === n)
    if (e) {
      setData(e.data)
      setSede(e.sede)
    }
  }
  function adicionarJogador() {
    if (onAddPlayer(novoJogador)) setNovoJogador('')
  }

  function salvar() {
    if (mesa.length === 0) {
      alert('Selecione pelo menos um jogador na mesa.')
      return
    }
    const resultados = mesa.map((name) => ({
      name,
      pts: pontosPorPosicao(posByName[name] || 0),
      rebuys: rebuysByName[name] || 0,
    }))
    const etapa = {
      num,
      data,
      sede: sede.trim(),
      buyin: vB, rebuy: vR,
      buyins: nB, rebuys: nR,
      total, fundoFT, poolEtapa,
      prizes: premios,
      resultados,
      detalhado: true,
    }
    onSalvar(etapa)
    setSede('')
    setMesa([])
    setRebuys({})
    setPos({})
  }

  return (
    <div className="card">
      <h2>Nova Etapa <span className="badge">#{num}</span></h2>

      <div className="grid grid-2">
        {temAgenda ? (
          <label>
            Etapa
            <select value={num} onChange={(e) => escolherEtapa(Number(e.target.value))}>
              {agendadas.map((c) => (
                <option key={c.num} value={c.num}>
                  Etapa {c.num} · {fmtDataBR(c.data)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            Data
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </label>
        )}
        <label>
          Sede / responsável
          <input type="text" placeholder="Ex.: Glauber" value={sede}
            onChange={(e) => setSede(e.target.value)} />
        </label>
        <label>
          Valor do buy-in (R$)
          <input type="number" min="0" value={buyin}
            onChange={(e) => setBuyin(e.target.value)} />
        </label>
        <label>
          Valor do rebuy (R$)
          <input type="number" min="0" value={rebuy}
            onChange={(e) => setRebuy(e.target.value)} />
        </label>
      </div>

      {/* 1) Quem está jogando */}
      <h3>1. Quem está jogando?</h3>
      <p className="hint">Toque nos jogadores para colocá-los na mesa.</p>
      <div className="chips">
        {players.map((name) => (
          <button
            key={name}
            className={`chip ${mesa.includes(name) ? 'on' : ''}`}
            onClick={() => toggleMesa(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="add-player">
        <input
          placeholder="Adicionar novo jogador…"
          value={novoJogador}
          onChange={(e) => setNovoJogador(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && adicionarJogador()}
        />
        <button className="btn-ghost" onClick={adicionarJogador}>+ Jogador</button>
      </div>

      {mesa.length > 0 && (
        <>
          {/* Resumo do bolão ao vivo */}
          <div className="premio-box">
            <div className="premio-total">
              <span>Bolão da etapa <small>({nB} jogadores · {nR} rebuys · total {fmt(total)})</small></span>
              <strong>{fmt(poolEtapa)}</strong>
            </div>
            <div className="premio-linha">
              <div><span className="medal gold">1º</span> {fmt(premios[0])}</div>
              <div><span className="medal silver">2º</span> {fmt(premios[1])}</div>
              <div><span className="medal bronze">3º</span> {fmt(premios[2])}</div>
            </div>
            <div className="ft-linha">🏁 Fundo da Mesa Final: <strong>{fmt(fundoFT)}</strong></div>
          </div>

          {/* 2) Mesa: rebuys e posição */}
          <h3>2. Mesa &amp; rebuys</h3>
          <p className="hint">Clique no + a cada rebuy. No fim, escolha a posição.</p>
          <div className="mesa">
            {mesa.map((name) => {
              const rb = rebuysByName[name] || 0
              const pagou = vB + rb * vR
              return (
                <div key={name} className="mesa-row">
                  <div className="mesa-top">
                    <strong className="mesa-nome">{name}</strong>
                    <select
                      className="mesa-pos"
                      value={posByName[name] || 0}
                      onChange={(e) => setPosicao(name, Number(e.target.value))}
                    >
                      <option value={0}>— participou</option>
                      {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                        <option key={p} value={p}
                          disabled={posUsadas[p] && posUsadas[p] !== name}>
                          {p}º lugar
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mesa-bottom">
                    <div className="rebuy-ctrl">
                      <button onClick={() => incRebuy(name, -1)} disabled={rb === 0}>−</button>
                      <span><strong>{rb}</strong> rebuy{rb === 1 ? '' : 's'}</span>
                      <button onClick={() => incRebuy(name, 1)}>+</button>
                    </div>
                    <span className="mesa-pagou">pagou {fmt(pagou)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 3) Acerto de contas */}
          <h3>3. Acerto de contas</h3>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th className="left">Jogador</th>
                  <th>Pagou</th>
                  <th>Recebeu</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {acerto.map((a) => (
                  <tr key={a.name}>
                    <td className="left nome">{a.name}</td>
                    <td>{fmt(a.pagou)}</td>
                    <td>{a.recebeu ? fmt(a.recebeu) : '—'}</td>
                    <td className={a.saldo >= 0 ? 'pos' : 'neg'}>{fmt(a.saldo)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="left">Total</td>
                  <td>{fmt(total)}</td>
                  <td>{fmt(poolEtapa)}</td>
                  <td className="muted">🏁 {fmt(fundoFT)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="hint">
            A diferença ({fmt(fundoFT)}) é o que fica reservado para a Mesa Final.
          </p>

          <button className="btn-primary btn-block" onClick={salvar}>
            Salvar etapa #{num}
          </button>
        </>
      )}
    </div>
  )
}
