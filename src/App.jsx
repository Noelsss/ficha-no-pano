import { useState } from 'react'
import { usePokerState } from './hooks/usePokerState'
import TabEtapa from './components/TabEtapa'
import TabRanking from './components/TabRanking'
import TabHistorico from './components/TabHistorico'

const TABS = [
  { id: 'ranking', label: 'Ranking' },
  { id: 'etapa', label: 'Nova Etapa' },
  { id: 'historico', label: 'Histórico' },
]

export default function App() {
  const {
    etapas, players, ranking, proximoNum,
    addEtapa, deleteEtapa, addPlayer, resetTudo,
  } = usePokerState()
  const [tab, setTab] = useState('ranking')

  return (
    <div className="app">
      <header className="topo">
        <div className="brand">
          <span className="suit">♠</span>
          <div>
            <h1>Ficha no Pano</h1>
            <p>30ª Temporada</p>
          </div>
          <span className="suit red">♥</span>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'tab on' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'ranking' && (
          <TabRanking ranking={ranking} totalEtapas={etapas.length} />
        )}
        {tab === 'etapa' && (
          <TabEtapa
            players={players}
            proximoNum={proximoNum}
            onSalvar={(e) => {
              addEtapa(e)
              setTab('historico')
            }}
            onAddPlayer={addPlayer}
          />
        )}
        {tab === 'historico' && (
          <TabHistorico etapas={etapas} onExcluir={deleteEtapa} />
        )}
      </main>

      <footer className="rodape">
        <button
          className="btn-reset"
          onClick={() => {
            if (confirm('Restaurar todos os dados originais da 30ª temporada? Isso apaga as alterações.')) {
              resetTudo()
            }
          }}
        >
          Restaurar dados originais
        </button>
      </footer>
    </div>
  )
}
