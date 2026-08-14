# Configurar o projeto numa máquina nova

Roteiro para quando o repositório for clonado noutro computador. Feito em
14/08/2026, na mudança da máquina errada para o PC pessoal.

Nem tudo que o projeto precisa está aqui: três coisas ficam **fora do git** de
propósito e chegam por pendrive ou outra mídia. Os passos 3 a 5 são elas.

## 1. Trazer o código

```bash
git pull
```

A branch é `main`. Se `git status` acusar algo pendente antes do pull, resolver
primeiro — não deveria haver nada.

## 2. Instalar e rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173/ficha-no-pano/` — o caminho `/ficha-no-pano/` é
obrigatório, vem do `base` no `vite.config.js`. Sem ele a tela fica em branco.

**Não é preciso criar `.env`.** O app não lê nenhuma variável de ambiente: a
URL do Supabase e a anon key estão em `src/lib/supabaseClient.js`, o que é
seguro por desenho — a anon key sozinha não lê nada, as policies exigem estar
em `autorizados`. Só faz sentido criar um `.env` para usar a Management API do
Supabase, e nesse caso gerar um token novo em
https://supabase.com/dashboard/account/tokens em vez de reaproveitar um antigo.

## 3. Pasta de backup — a única coisa insubstituível

Na mídia de transferência, `ficha-no-pano-transfer\ficha-no-pano-backup\`.
Contém o export do Supabase e os SQL de restauração, inclusive o
`migrar-completo.sql` que monta um projeto do zero com o RLS já fechado.

Vai como pasta **irmã** do repositório, nunca dentro dele:

```
Documents\Glauber\ficha-no-pano\          <- este repositório (público)
Documents\Glauber\ficha-no-pano-backup\   <- a pasta de backup (fora do git)
```

Se ela entrar no repositório, dados financeiros do grupo vão para o ar no push
seguinte. O mesmo vale para `src/`: tudo ali é compilado para o JS que qualquer
pessoa baixa do site.

## 4. Memória do Claude Code

Em `ficha-no-pano-transfer\claude-memory\` — 6 arquivos com o contexto
acumulado do projeto. Sem eles o Claude recomeça do zero.

1. Abrir o Claude Code uma vez dentro da pasta do projeto.
2. Ver que pasta apareceu em `C:\Users\<usuario>\.claude\projects\`. O nome é
   derivado do caminho do projeto, então muda se o usuário do Windows for outro.
3. Copiar os 6 arquivos para dentro de `memory\` nessa pasta, o `MEMORY.md`
   incluído.

## 5. Permissões do Claude Code (opcional)

`ficha-no-pano-transfer\claude-settings\settings.local.json` vai em
`.claude\settings.local.json`. É só a allowlist que evita confirmação a cada
comando — o projeto funciona igual sem ela. O arquivo é gitignored e não tem
segredo dentro.

## 6. Deploy

```bash
npm run deploy
```

Publica na branch `gh-pages`, que é a fonte do GitHub Pages. Na primeira vez o
Git vai pedir credencial do GitHub (conta `Noelsss`) — o Credential Manager
guarda daí em diante. `gh auth login` resolve de uma vez se o `gh` estiver
instalado.

Lembrando que o workflow em `.github/workflows/deploy.yml` falha a cada push,
porque a fonte do Pages é a branch e não "GitHub Actions". Quem publica de fato
é o comando acima.

## Conferir no fim

- [ ] `npm run dev` abre o app e o login por link mágico funciona
- [ ] `ficha-no-pano-backup\` existe **ao lado** do repositório, não dentro
- [ ] `git status` limpo — em especial, nenhum arquivo de backup aparecendo
- [ ] o ranking carrega depois do login (prova que o Supabase respondeu)

Se o app abre mas não mostra nada depois do login, o e-mail usado não está em
`autorizados` — não é erro de instalação. Liberar pela aba **Acessos**.
