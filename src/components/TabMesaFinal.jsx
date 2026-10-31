import { useMemo } from 'react'
import { regraMesaFinal } from '../lib/scoring'

const fmt = (n) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function TabMesaFinal({ etapas, calendario }) {
  const totalEtapas = calendario.filter((c) => c.num !== 'MF').length
  const regra = useMemo(() => regraMesaFinal(etapas, totalEtapas), [etapas, totalEtapas])
  const jogadas = etapas.filter((e) => e.num !== 'MF').length
  const temporadaAberta = jogadas < totalEtapas

  return (
    <div className="card">
      <h2>Mesa Final <span className="badge">quem pode jogar</span></h2>

      <p className="hint">
        Todo mundo que joga uma etapa contribui para a Mesa Final: R$20 de cada
        buy-in e R$10 de cada rebuy. Para ninguém aproveitar o acumulado sem ter
        contribuído:
      </p>
      <ul className="hint regra-mf">
        <li>
          Quem jogou <strong>pelo menos {regra.minEtapas} das {totalEtapas} etapas</strong>{' '}
          (metade, arredondando para cima) está classificado.
        </li>
        <li>
          O <strong>piso</strong> é a menor contribuição entre os classificados:{' '}
          <strong>{fmt(regra.piso)}</strong>
          {regra.definidoPor.length > 0 && <> ({regra.definidoPor.join(', ')})</>}.
        </li>
        <li>
          Quem jogou menos etapas também pode jogar, pagando o{' '}
          <strong>complemento</strong>, que é o que falta para chegar ao piso. Ele é
          cobrado junto com a entrada da Mesa Final e vai para a premiação dela.
        </li>
      </ul>

      {temporadaAberta && (
        <div className="alerta">
          ⏳ Ainda faltam {totalEtapas - jogadas} etapa(s). O piso e os
          complementos podem mudar até a última etapa.
        </div>
      )}
      {regra.divergentes.length > 0 && (
        <div className="alerta">
          ⚠️ Na(s) etapa(s) {regra.divergentes.map((d) => `#${d.num}`).join(', ')} a
          soma das contribuições por jogador não bate com o fundo gravado
          ({regra.divergentes.map((d) => `${fmt(d.somaJogadores)} × ${fmt(d.fundoFT)}`).join('; ')}).
          Provavelmente faltam rebuys por jogador. Confira antes de cobrar.
        </div>
      )}

      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th className="left">Jogador</th>
              <th>Et.</th>
              <th>Contribuiu</th>
              <th className="left">Situação</th>
            </tr>
          </thead>
          <tbody>
            {regra.jogadores.map((j) => (
              <tr key={j.name}>
                <td className="left nome">{j.name}</td>
                <td>{j.etapas}</td>
                <td>{fmt(j.contribuicao)}</td>
                <td className="left">
                  {j.classificado
                    ? <span className="pos">✅ classificado</span>
                    : j.complemento > 0
                      ? <span className="neg">💰 complemento de {fmt(j.complemento)}</span>
                      : <span className="pos">✅ já atinge o piso</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">
        Quem não jogou nenhuma etapa paga o piso inteiro ({fmt(regra.piso)}) como complemento.
      </p>
    </div>
  )
}
