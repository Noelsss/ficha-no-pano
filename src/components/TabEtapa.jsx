import { useMemo, useState } from 'react'
import {
  calcularAcerto, calcularFundoFT, calcularPremios, calcularTotal,
  dividirAcordo, indicePremio, pontosPorPosicao, posicaoPorPontos,
} from '../lib/scoring'

const fmt = (n) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDataBR = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function TabEtapa({
  players, proximoNum, calendario = [], etapas = [], onSalvar, onAddPlayer,
  etapaEdit = null, onCancelarEdicao,
}) {
  const editando = !!etapaEdit
  const hoje = new Date().toISOString().slice(0, 10)

  // etapas/eventos agendados que ainda não foram realizados (inclui a Mesa Final)
  const playedNums = useMemo(() => new Set(etapas.map((e) => e.num)), [etapas])
  const agendadas = useMemo(
    () => calendario.filter((c) => !playedNums.has(c.num)),
    [calendario, playedNums],
  )
  const temAgenda = agendadas.length > 0
  const padrao = agendadas[0]

  // fundo acumulado sugerido p/ Mesa Final = soma dos fundos das etapas jogadas
  const acumuladoPadrao = useMemo(
    () => etapas
      .filter((e) => e.num !== 'MF')
      .reduce((s, e) => s + (e.fundoFT || 0), 0),
    [etapas],
  )

  const ehMFPadrao = padrao?.num === 'MF'
  const [num, setNum] = useState(() => etapaEdit?.num ?? padrao?.num ?? proximoNum)
  const [data, setData] = useState(() => etapaEdit?.data ?? padrao?.data ?? hoje)
  const [sede, setSede] = useState(() => etapaEdit?.sede ?? padrao?.sede ?? '')
  const [buyin, setBuyin] = useState(() => etapaEdit?.buyin ?? (ehMFPadrao ? 0 : 80))
  const [rebuy, setRebuy] = useState(() => etapaEdit?.rebuy ?? (ehMFPadrao ? 0 : 70))
  const [acumulado, setAcumulado] = useState(
    () => etapaEdit?.acumulado ?? (ehMFPadrao ? acumuladoPadrao : 0),
  )

  // jogadores na mesa + rebuys e posição por jogador
  const [mesa, setMesa] = useState(
    () => etapaEdit?.resultados.map((r) => r.name) ?? [],
  )
  const [rebuysByName, setRebuys] = useState(() => {
    const m = {}
    for (const r of etapaEdit?.resultados ?? []) m[r.name] = r.rebuys || 0
    return m
  })
  const [posByName, setPos] = useState(() => {
    const m = {}
    for (const r of etapaEdit?.resultados ?? []) m[r.name] = posicaoPorPontos(r.pts)
    return m
  })

  // acordo: quem entrou e com que peso na divisão
  const [acordo, setAcordo] = useState(
    () => etapaEdit?.resultados.filter((r) => typeof r.premio === 'number').map((r) => r.name) ?? [],
  )
  const [pesos, setPesos] = useState(() => {
    const m = {}
    for (const r of etapaEdit?.resultados ?? []) {
      if (typeof r.premio === 'number') m[r.name] = r.premio
    }
    return m
  })

  const [novoJogador, setNovoJogador] = useState('')

  const ehMF = num === 'MF'
  const vB = Number(buyin) || 0
  const vR = Number(rebuy) || 0
  const nB = mesa.length
  const nR = useMemo(
    () => mesa.reduce((s, n) => s + (rebuysByName[n] || 0), 0),
    [mesa, rebuysByName],
  )

  const total = calcularTotal(nB, nR, vB, vR)
  const fundoFT = ehMF ? 0 : calcularFundoFT(nB, nR)
  const acum = ehMF ? Number(acumulado) || 0 : 0
  const poolEtapa = total - fundoFT + acum
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

  const semPodio = mesa.length > 0 && !posUsadas[1]

  // --- acordo ---
  // O bolo é a soma do que os envolvidos receberiam pelas posições deles.
  const boloAcordo = useMemo(
    () => acordo.reduce((s, name) => {
      const idx = indicePremio(pontosPorPosicao(posByName[name] || 0))
      return s + (idx >= 0 ? premios[idx] || 0 : 0)
    }, 0),
    [acordo, posByName, premios],
  )

  const valoresAcordo = useMemo(() => {
    if (acordo.length < 2) return {}
    const lista = dividirAcordo(boloAcordo, acordo.map((n) => Number(pesos[n]) || 0))
    return Object.fromEntries(acordo.map((n, i) => [n, lista[i]]))
  }, [acordo, pesos, boloAcordo])

  const acordoValido = acordo.length >= 2
    && acordo.every((n) => (Number(pesos[n]) || 0) > 0)

  function toggleAcordo(name) {
    setAcordo((prev) => {
      if (prev.includes(name)) {
        const resto = prev.filter((n) => n !== name)
        return resto.length < 2 ? [] : resto
      }
      // peso inicial: a proporção da tabela (60/30/10) da posição da pessoa
      const idx = indicePremio(pontosPorPosicao(posByName[name] || 0))
      const padraoPeso = idx === 0 ? 60 : idx === 1 ? 30 : idx === 2 ? 10 : 0
      setPesos((p) => ({ ...p, [name]: p[name] ?? padraoPeso }))
      return [...prev, name]
    })
  }

  // monta os resultados (com prêmio de acordo quando houver)
  const montarResultados = () => mesa.map((name) => {
    const base = {
      name,
      pts: pontosPorPosicao(posByName[name] || 0),
      rebuys: rebuysByName[name] || 0,
    }
    if (acordoValido && acordo.includes(name)) {
      base.premio = valoresAcordo[name] ?? 0
    }
    return base
  })

  const etapaDraft = useMemo(() => ({
    buyin: vB, rebuy: vR, prizes: premios, resultados: montarResultados(),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [mesa, posByName, rebuysByName, vB, vR, premios, acordo, pesos, valoresAcordo, acordoValido])

  const acerto = useMemo(() => calcularAcerto(etapaDraft), [etapaDraft])

  function toggleMesa(name) {
    setMesa((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    )
  }
  function incRebuy(name, delta) {
    setRebuys((prev) => ({ ...prev, [name]: Math.max(0, (prev[name] || 0) + delta) }))
  }
  function setPosicao(name, pos) {
    setPos((prev) => ({ ...prev, [name]: pos }))
  }
  function escolherEtapa(n) {
    const e = agendadas.find((c) => String(c.num) === String(n))
    if (!e) return
    setNum(e.num)
    setData(e.data)
    setSede(e.sede)
    if (e.num === 'MF') {
      setBuyin(0); setRebuy(0); setAcumulado(acumuladoPadrao)
    } else {
      setBuyin(80); setRebuy(70); setAcumulado(0)
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
    if (semPodio && !confirm(
      'Nenhuma posição foi definida, então ninguém vai pontuar no ranking nem '
      + 'receber prêmio — todos aparecerão devendo o valor cheio.\n\nSalvar assim mesmo?',
    )) return

    onSalvar({
      num,
      data,
      sede: sede.trim(),
      buyin: vB, rebuy: vR,
      buyins: nB, rebuys: nR,
      total, fundoFT, poolEtapa, acumulado: acum,
      prizes: premios,
      resultados: montarResultados(),
      detalhado: true,
    })
    if (!editando) {
      setSede(''); setMesa([]); setRebuys({}); setPos({}); setAcordo([]); setPesos({})
    }
  }

  return (
    <div className="card">
      <h2>
        {editando
          ? <>Editar etapa <span className="badge">#{num}</span></>
          : ehMF
            ? <>Mesa Final <span className="badge">🏆 Grande Final</span></>
            : <>Nova Etapa <span className="badge">#{num}</span></>}
      </h2>

      {editando && (
        <p className="ajuda">
          Alterando uma etapa já salva. O ranking e o acerto são recalculados
          quando você salvar.{' '}
          <button className="admin-link" onClick={onCancelarEdicao}>Cancelar edição</button>
        </p>
      )}

      <div className="grid grid-2">
        {temAgenda && !editando ? (
          <label>
            Etapa
            <select value={String(num)} onChange={(e) => escolherEtapa(e.target.value)}>
              {agendadas.map((c) => (
                <option key={c.num} value={c.num}>
                  {c.num === 'MF' ? '🏆 Mesa Final' : `Etapa ${c.num}`} · {fmtDataBR(c.data)}
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

      {ehMF && (
        <label className="acumulado-field">
          💰 Dinheiro acumulado (entra na divisão)
          <input type="number" min="0" value={acumulado}
            onChange={(e) => setAcumulado(e.target.value)} />
          <small>Sugestão: {fmt(acumuladoPadrao)} — soma dos fundos das etapas jogadas.</small>
        </label>
      )}

      {/* 1) Quem está jogando */}
      <h3>1. {ehMF ? 'Quem está na mesa final?' : 'Quem está jogando?'}</h3>
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
              <span>
                {ehMF ? 'Premiação da Mesa Final' : 'Bolão da etapa'}{' '}
                <small>({nB} jogadores · {nR} rebuys · mesa {fmt(total)})</small>
              </span>
              <strong>{fmt(poolEtapa)}</strong>
            </div>
            <div className="premio-linha">
              <div><span className="medal gold">1º</span> {fmt(premios[0])}</div>
              <div><span className="medal silver">2º</span> {fmt(premios[1])}</div>
              <div><span className="medal bronze">3º</span> {fmt(premios[2])}</div>
            </div>
            <div className="ft-linha">
              {ehMF
                ? <>💰 Inclui acumulado de <strong>{fmt(acum)}</strong> na divisão</>
                : <>🏁 Fundo da Mesa Final: <strong>{fmt(fundoFT)}</strong></>}
            </div>
          </div>

          {/* 2) Rebuys */}
          <h3>2. Rebuys</h3>
          <p className="hint">Clique no + a cada rebuy.</p>
          <div className="mesa">
            {mesa.map((name) => {
              const rb = rebuysByName[name] || 0
              return (
                <div key={name} className="mesa-row">
                  <div className="mesa-top">
                    <strong className="mesa-nome">{name}</strong>
                    <span className="mesa-pagou">pagou {fmt(vB + rb * vR)}</span>
                  </div>
                  <div className="mesa-bottom">
                    <div className="rebuy-ctrl">
                      <button onClick={() => incRebuy(name, -1)} disabled={rb === 0}>−</button>
                      <span><strong>{rb}</strong> rebuy{rb === 1 ? '' : 's'}</span>
                      <button onClick={() => incRebuy(name, 1)}>+</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 3) Posições — em destaque, é o que define pontos e prêmio */}
          <h3>3. Posições <span className="badge">define pontos e prêmio</span></h3>
          {semPodio && (
            <div className="alerta">
              ⚠️ Ninguém tem colocação ainda. Sem definir ao menos o 1º lugar,
              ninguém pontua no ranking e todos aparecem devendo o valor cheio.
            </div>
          )}
          <div className="posicoes">
            {mesa.map((name) => {
              const p = posByName[name] || 0
              return (
                <div key={name} className={`pos-row ${p >= 1 && p <= 3 ? 'podio' : ''}`}>
                  <strong className="mesa-nome">{name}</strong>
                  <select
                    className="mesa-pos"
                    value={p}
                    onChange={(e) => setPosicao(name, Number(e.target.value))}
                  >
                    <option value={0}>— participou</option>
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <option key={n} value={n} disabled={posUsadas[n] && posUsadas[n] !== name}>
                        {n}º lugar
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>

          {/* 4) Acordo */}
          <h3>4. Acordo <span className="badge opcional">opcional</span></h3>
          <p className="hint">
            Quando dois ou mais combinam dividir a premiação de forma diferente.
            As posições continuam valendo para o ranking — muda só o dinheiro.
          </p>
          <div className="chips">
            {mesa.map((name) => (
              <button
                key={name}
                className={`chip ${acordo.includes(name) ? 'on' : ''}`}
                onClick={() => toggleAcordo(name)}
              >
                {name}
              </button>
            ))}
          </div>

          {acordo.length >= 2 && (
            <div className="acordo-box">
              <div className="acordo-bolo">
                Bolo do acordo: <strong>{fmt(boloAcordo)}</strong>
                <small> — soma dos prêmios das posições de quem entrou</small>
              </div>
              {acordo.map((name) => (
                <div key={name} className="acordo-linha">
                  <span className="mesa-nome">{name}</span>
                  <div className="acordo-peso">
                    <input
                      type="number" min="0" step="1"
                      value={pesos[name] ?? ''}
                      onChange={(e) => setPesos((p) => ({ ...p, [name]: e.target.value }))}
                    />
                    <span>%</span>
                  </div>
                  <strong className="pos">{fmt(valoresAcordo[name] ?? 0)}</strong>
                </div>
              ))}
              {!acordoValido && (
                <p className="portao-erro">Defina uma proporção maior que zero para cada um.</p>
              )}
            </div>
          )}

          {/* 5) Acerto de contas */}
          <h3>5. Acerto de contas</h3>
          <p className="hint">
            O saldo já é líquido: quem ficou no pódio e ainda deve entra só com
            a diferença.
          </p>
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
                    <td className="left nome">
                      {a.name}
                      {a.emAcordo && <span className="tag-acordo">acordo</span>}
                    </td>
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
                  <td className="muted">
                    {ehMF ? <>💰 {fmt(acum)}</> : <>🏁 {fmt(fundoFT)}</>}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <button className="btn-primary btn-block" onClick={salvar}>
            {editando
              ? `Salvar alterações da etapa #${num}`
              : ehMF ? 'Salvar Mesa Final 🏆' : `Salvar etapa #${num}`}
          </button>
        </>
      )}
    </div>
  )
}
