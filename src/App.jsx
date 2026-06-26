import { useEffect, useState } from 'react'
import { usePokerState } from './hooks/usePokerState'
import { CALENDARIO } from './data/seed'
import TabEtapa from './components/TabEtapa'
import TabRanking from './components/TabRanking'
import TabHistorico from './components/TabHistorico'
import TabCalendario from './components/TabCalendario'
import AdminBar from './components/AdminBar'

export default function App() {
  const {
    etapas, players, ranking, proximoNum,
    addEtapa, deleteEtapa, addPlayer, resetTudo,
    session, isAdmin, carregando, online, entrar, sair,
  } = usePokerState()
  const [tab, setTab] = useState('ranking')

  const tabs = [
    { id: 'ranking', label: 'Ranking' },
    { id: 'calendario', label: 'Calendário' },
    ...(isAdmin ? [{ id: 'etapa', label: 'Nova Etapa' }] : []),
    { id: 'historico', label: 'Histórico' },
  ]

  // se o admin sair enquanto está na aba de edição, volta para o ranking
  useEffect(() => {
    if (tab === 'etapa' && !isAdmin) setTab('ranking')
  }, [tab, isAdmin])

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

      <AdminBar
        isAdmin={isAdmin}
        session={session}
        online={online}
        entrar={entrar}
        sair={sair}
      />

      <nav className="tabs">
        {tabs.map((t) => (
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
          <TabRanking ranking={ranking} totalEtapas={etapas.filter((e) => e.num !== 'MF').length} />
        )}
        {tab === 'calendario' && (
          <TabCalendario calendario={CALENDARIO} etapas={etapas} />
        )}
        {tab === 'etapa' && isAdmin && (
          <TabEtapa
            players={players}
            proximoNum={proximoNum}
            calendario={CALENDARIO}
            etapas={etapas}
            onSalvar={(e) => {
              addEtapa(e)
              setTab('historico')
            }}
            onAddPlayer={addPlayer}
          />
        )}
        {tab === 'historico' && (
          <TabHistorico etapas={etapas} onExcluir={deleteEtapa} canEdit={isAdmin} />
        )}
      </main>

      <footer className="rodape">
        {carregando && <span className="rodape-status">Carregando…</span>}
        {isAdmin && (
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
        )}
      </footer>
    </div>
  )
}
