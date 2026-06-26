import { useCallback, useEffect, useMemo, useState } from 'react'
import { SEED_ETAPAS, SEED_PLAYERS } from '../data/seed'
import { calcularRanking } from '../lib/scoring'

const STORAGE_KEY = 'ficha-no-pano'

function carregar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const dados = JSON.parse(raw)
      if (Array.isArray(dados.etapas) && Array.isArray(dados.players)) {
        return dados
      }
    }
  } catch (e) {
    console.warn('Falha ao ler localStorage, usando dados iniciais.', e)
  }
  return { etapas: SEED_ETAPAS, players: SEED_PLAYERS }
}

export function usePokerState() {
  const [etapas, setEtapas] = useState(() => carregar().etapas)
  const [players, setPlayers] = useState(() => carregar().players)

  // persistência
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ etapas, players }))
    } catch (e) {
      console.warn('Falha ao salvar no localStorage.', e)
    }
  }, [etapas, players])

  const proximoNum = useMemo(
    () => (etapas.length ? Math.max(...etapas.map((e) => e.num)) + 1 : 1),
    [etapas],
  )

  const addEtapa = useCallback((etapa) => {
    setEtapas((prev) =>
      [...prev, etapa].sort((a, b) => a.num - b.num),
    )
  }, [])

  const deleteEtapa = useCallback((num) => {
    setEtapas((prev) => prev.filter((e) => e.num !== num))
  }, [])

  const addPlayer = useCallback((nome) => {
    const name = nome.trim()
    if (!name) return false
    let ok = false
    setPlayers((prev) => {
      if (prev.some((p) => p.toLowerCase() === name.toLowerCase())) return prev
      ok = true
      return [...prev, name]
    })
    return ok
  }, [])

  const resetTudo = useCallback(() => {
    setEtapas(SEED_ETAPAS)
    setPlayers(SEED_PLAYERS)
  }, [])

  const ranking = useMemo(() => calcularRanking(etapas), [etapas])

  return {
    etapas, players, ranking, proximoNum,
    addEtapa, deleteEtapa, addPlayer, resetTudo,
  }
}
