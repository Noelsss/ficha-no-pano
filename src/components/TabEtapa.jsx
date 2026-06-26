import { useMemo, useState } from 'react'
import { calcularPremios, calcularTotal, pontosPorPosicao } from '../lib/scoring'

const fmt = (n) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function TabEtapa({ players, proximoNum, onSalvar, onAddPlayer }) {
  const hoje = new Date().toISOString().slice(0, 10)
  const [data, setData] = useState(hoje)
  const [buyin, setBuyin] = useState(80)
  const [rebuy, setRebuy] = useState(70)
  const [buyins, setBuyins] = useState(0)
  const [rebuys, setRebuys] = useState(0)
  // selecionados: { [name]: pos }  (pos 0 = participou sem pódio de pontos)
  const [sel, setSel] = useState({})
  const [novoJogador, setNovoJogador] = useState('')

  const total = calcularTotal(
    Number(buyins) || 0, Number(rebuys) || 0,
    Number(buyin) || 0, Number(rebuy) || 0,
  )
  const premios = calcularPremios(total)

  const participantes = useMemo(
    () => Object.keys(sel).filter((n) => sel[n] !== undefined),
    [sel],
  )

  // posições já usadas (para evitar duplicar 1º, 2º, etc.)
  const posUsadas = useMemo(() => {
    const m = {}
    for (const n of participantes) {
      const p = sel[n]
      if (p >= 1) m[p] = n
    }
    return m
  }, [sel, participantes])

  function toggle(name) {
    setSel((prev) => {
      const next = { ...prev }
      if (next[name] !== undefined) delete next[name]
      else next[name] = 0
      return next
    })
  }

  function setPos(name, pos) {
    setSel((prev) => ({ ...prev, [name]: pos }))
  }

  function adicionarJogador() {
    if (onAddPlayer(novoJogador)) setNovoJogador('')
  }

  function salvar() {
    if (participantes.length === 0) {
      alert('Marque pelo menos um participante.')
      return
    }
    const resultados = participantes.map((name) => ({ name, pos: sel[name] || 0 }))
    const etapa = {
      num: proximoNum,
      data,
      buyin: Number(buyin) || 0,
      rebuy: Number(rebuy) || 0,
      buyins: Number(buyins) || 0,
      rebuys: Number(rebuys) || 0,
      total,
      prizes: premios,
      resultados,
    }
    onSalvar(etapa)
    // reset parcial
    setBuyins(0)
    setRebuys(0)
    setSel({})
  }

  return (
    <div className="card">
      <h2>Nova Etapa <span className="badge">#{proximoNum}</span></h2>

      <div className="grid grid-2">
        <label>
          Data
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <div />
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
        <label>
          Qtd. de buy-ins
          <input type="number" min="0" value={buyins}
            onChange={(e) => setBuyins(e.target.value)} />
        </label>
        <label>
          Qtd. de rebuys
          <input type="number" min="0" value={rebuys}
            onChange={(e) => setRebuys(e.target.value)} />
        </label>
      </div>

      <div className="premio-box">
        <div className="premio-total">
          <span>Total arrecadado</span>
          <strong>{fmt(total)}</strong>
        </div>
        <div className="premio-linha">
          <div><span className="medal gold">1º</span> {fmt(premios[0])}</div>
          <div><span className="medal silver">2º</span> {fmt(premios[1])}</div>
          <div><span className="medal bronze">3º</span> {fmt(premios[2])}</div>
        </div>
      </div>

      <h3>Participantes &amp; posições</h3>
      <p className="hint">
        Marque quem jogou e escolha a posição final. Sem posição = participou
        (1 ponto).
      </p>

      <div className="jogadores">
        {players.map((name) => {
          const ativo = sel[name] !== undefined
          const pts = ativo ? pontosPorPosicao(sel[name]) : null
          return (
            <div key={name} className={`jogador ${ativo ? 'on' : ''}`}>
              <label className="check">
                <input type="checkbox" checked={ativo} onChange={() => toggle(name)} />
                <span>{name}</span>
              </label>
              {ativo && (
                <div className="pos-wrap">
                  <select value={sel[name]} onChange={(e) => setPos(name, Number(e.target.value))}>
                    <option value={0}>— participou</option>
                    {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                      <option key={p} value={p}
                        disabled={posUsadas[p] && posUsadas[p] !== name}>
                        {p}º lugar
                      </option>
                    ))}
                  </select>
                  <span className="pts">{pts} pt{pts > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          )
        })}
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

      <button className="btn-primary btn-block" onClick={salvar}>
        Salvar etapa #{proximoNum}
      </button>
    </div>
  )
}
