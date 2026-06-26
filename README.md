# ♠ Ficha no Pano — 30ª Temporada

App web para gerenciar o grupo de poker entre amigos: registra etapas, calcula
premiação em tempo real, pontuação e ranking geral. Dados ficam salvos no
navegador (`localStorage`).

## Funcionalidades

- **Nova Etapa** — registra buy-in/rebuy, quantidades e calcula a premiação
  60% / 30% / 10% ao vivo. Marca participantes e posições.
- **Ranking Geral** — pontos, etapas disputadas, vitórias e saldo financeiro.
- **Histórico** — todas as etapas com pódio e prêmios; permite excluir.
- Adicionar novos jogadores e restaurar os dados originais da temporada.

### Pontuação

| Posição | 1º | 2º | 3º | 4º | 5º | 6º | 7º | Demais |
|---------|----|----|----|----|----|----|----|--------|
| Pontos  | 10 | 8  | 6  | 5  | 4  | 3  | 2  | 1      |

## Rodando localmente

```bash
npm install
npm run dev
```

## Deploy no GitHub Pages

Há duas formas (escolha uma):

### Opção A — gh-pages (manual)

```bash
npm run deploy
```

Depois, em **Settings → Pages**, defina a fonte como branch `gh-pages`.

### Opção B — GitHub Actions (automático)

O workflow em `.github/workflows/deploy.yml` publica a cada push na `main`.
Em **Settings → Pages**, defina a fonte como **GitHub Actions**.

> O `base` em `vite.config.js` está como `/ficha-no-pano/`. Se o repositório
> tiver outro nome, ajuste lá.

## Stack

React 18 + Vite 6.
