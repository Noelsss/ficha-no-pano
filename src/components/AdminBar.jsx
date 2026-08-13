// Barra de sessão: quem está logado e o botão de sair.
// O formulário de entrada virou a tela `Login`, que agora é um portão.
export default function AdminBar({ isAdmin, me, session, erroRede, sair }) {
  return (
    <div className="admin-bar">
      <span className={isAdmin ? 'admin-ok' : 'admin-ro'}>
        {isAdmin ? '✓ Admin' : '👤'} · {me?.nome || session?.user?.email}
      </span>
      {erroRede && <span className="admin-erro">⚠️ Sem conexão com o servidor</span>}
      <button className="admin-link" onClick={sair}>Sair</button>
    </div>
  )
}
