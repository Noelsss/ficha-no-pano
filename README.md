# ♠ Ficha no Pano — 30ª Temporada

App web para gerenciar o grupo de poker entre amigos: registra etapas, calcula
premiação em tempo real, pontuação e ranking geral.

**O acesso é restrito.** Os dados ficam no Supabase e só são visíveis para
quem estiver na tabela `autorizados`. Não há modo de visualização público.

## Funcionalidades

- **Ranking Geral** — pontos, etapas disputadas e vitórias.
- **Calendário** — datas, sede de cada etapa e Mesa Final.
- **Nova Etapa** (admin) — registra buy-in/rebuy por jogador e calcula a
  premiação 60% / 30% / 10% ao vivo.
- **Acerto** (admin) — controle de pagamentos e conciliação com o extrato.
- **Histórico** — todas as etapas com pódio e prêmios; copiar acerto para o
  WhatsApp (admin).

### Pontuação

| Posição | 1º | 2º | 3º | 4º | 5º | 6º | 7º | Demais |
|---------|----|----|----|----|----|----|----|--------|
| Pontos  | 10 | 8  | 6  | 5  | 4  | 3  | 2  | 1      |

## Acesso e segurança

O controle é todo no servidor, via Row Level Security do Postgres:

- **Quem lê**: só e-mails presentes em `autorizados`.
- **Quem escreve**: só quem tem `admin = true` em `autorizados`.
- **O cadastro é aberto de propósito.** Qualquer um cria uma conta de login,
  mas não enxerga nada: a fronteira é `autorizados`, não o cadastro. Quem
  entra sem aprovação vê apenas a tela de "solicitar acesso".

Verificado no banco simulando cada tipo de visitante:

| Quem | Vê |
|---|---|
| Anônimo | nada |
| Logado, não aprovado | nada |
| Logado tentando se inserir em `autorizados` | bloqueado (`42501`) |
| Aprovado / admin | tudo |

> ⚠️ Nada de dado do grupo pode entrar em `src/` — o conteúdo de `src/` é
> compilado para o JS que qualquer pessoa baixa do site. Valores, pagamentos,
> resultados por jogador e a chave Pix ficam **só no banco**. O `seed.js`
> guarda apenas o calendário (datas e sede).

### Liberar um jogador

Tudo pelo app, sem abrir o painel:

1. Mande o link do site para a pessoa.
2. Ela entra com o e-mail dela, recebe o link mágico e pede acesso.
3. Você abre a aba **Acessos** (mostra a contagem de pendentes) e clica
   **Liberar**.

Para revogar, "Tirar acesso" na mesma aba: a conta de login continua
existindo, mas deixa de enxergar qualquer dado.

O `supabase/autorizar.sql` existe só como saída manual, caso precise liberar
alguém direto pelo SQL Editor.

### Primeira instalação

```
supabase/schema.sql         tabelas (projeto legado)
supabase/fix-seguranca.sql  fecha acesso público num projeto já existente
supabase/solicitacoes.sql   tabela de pedidos de acesso
supabase/autorizar.sql      liberar alguém manualmente
```

Para montar um projeto do zero, o arquivo `migrar-completo.sql` (gerado na
pasta de backup, fora deste repositório) faz tudo numa colada só e já nasce
com o RLS fechado.

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173/ficha-no-pano/`. Não é preciso `.env`: a URL e a
anon key ficam em `src/lib/supabaseClient.js`, protegidas por RLS.

Para configurar o projeto numa máquina nova, incluindo o que vem de fora do
git, ver [MAQUINA-NOVA.md](MAQUINA-NOVA.md).

## Deploy

O site é publicado no GitHub Pages a partir da branch `gh-pages`:

```bash
npm run deploy
```

O `base` em `vite.config.js` é `/ficha-no-pano/` e precisa bater com o nome do
repositório.

> O workflow em `.github/workflows/deploy.yml` falha a cada push, porque a
> fonte do Pages é a branch `gh-pages` e não "GitHub Actions". Ou apague o
> workflow, ou troque a fonte do Pages — não dá para manter os dois.

## Stack

React 18 + Vite 6 + Supabase.
