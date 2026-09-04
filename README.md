# Nós

App privado de finanças e planejamento do casal. Sem cadastro público: só vocês dois.

## Fase 1 (pronta)

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Clientes Supabase (browser, server e proxy de sessão)
- Login por e-mail/senha, sem tela de cadastro
- Layout com navegação entre Início, Finanças, Metas, Viagens, Eventos e Configurações
- Dark mode

## Setup

1. Crie um projeto no [Supabase](https://supabase.com).
2. Em **Authentication → Providers → Email**, desative o cadastro público (*Allow new users to sign up*).
3. Crie **duas contas** em **Authentication → Users**.
4. Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
ALLOWED_EMAILS=voce@email.com,esposa@email.com
```

A chave pública aparece no painel como *publishable* ou *anon*.

5. Instale e rode:

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Sem sessão, o app redireciona para `/login`.

## Segurança

- Não existe rota de signup no app.
- O proxy protege todas as páginas, exceto `/login` e `/auth/callback`.
- `ALLOWED_EMAILS` é uma trava extra: mesmo que alguém crie um usuário no Auth, o login é recusado se o e-mail não estiver na lista.
- Sem `ALLOWED_EMAILS`, ninguém entra (lista fechada).
- As migrations em `supabase/migrations` ativam RLS em todas as tabelas.

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run start` — servidor de produção
- `npm run lint` — ESLint
# appfinancas
