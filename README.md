# Project Gestao

Sistema de gestao/RH com API principal, frontend do cliente, API admin, painel admin, PostgreSQL e pgAdmin.

## Infraestrutura Local

O PostgreSQL local do projeto roda via Docker Compose.

Servicos:

- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`
- pgAdmin login: `admin@local.dev`
- pgAdmin senha: `admin123`

O `docker-compose.yml` usa credenciais padrao locais compativeis com o `backend/.env`. Se no futuro essas credenciais mudarem, rode os comandos com `--env-file backend/.env`.

Como o container publica a porta `5432` no host, os `.env` da aplicacao continuam usando `localhost:5432`. Isso e intencional: o sistema continua funcionando com as mesmas URLs de banco, mas agora quem atende a porta e o PostgreSQL do Docker.

Importante: se o servico Windows `postgresql-x64-18` for iniciado novamente antes de ser desinstalado/desabilitado, ele pode ocupar a porta `5432` e impedir o container de subir.

## Subir Banco E PgAdmin

```powershell
docker compose up -d postgres pgadmin
```

Verificar status:

```powershell
docker compose ps
```

Parar:

```powershell
docker compose down
```

## Subir Tudo Em Desenvolvimento

O projeto tambem tem um comando raiz para subir somente as aplicacoes:

```powershell
npm run dev
```

Esse comando:

- verifica se existe PostgreSQL respondendo em `localhost:5432`
- abre uma janela PowerShell para cada app

O Docker e o pgAdmin ficam manuais:

```powershell
docker compose up -d postgres pgadmin
```

URLs:

```text
App:       http://localhost:3001/login?tenant=acme
Backend:   http://localhost:3000/api
Admin:     http://localhost:3003/login
Admin API: http://localhost:3002/api/admin
pgAdmin:   http://localhost:5050
```

Para parar as aplicacoes Node nas portas `3000` a `3003`:

```powershell
npm run stop
```

## Aplicacao Principal

Backend:

```powershell
cd backend
npm run dev
```

Frontend:

```powershell
cd frontend
npm run dev
```

Abrir:

```text
http://localhost:3001/login?tenant=acme
```

## Painel Admin

Admin API:

```powershell
cd admin
npm run dev
```

Admin frontend:

```powershell
cd admin-frontend
npm run dev
```

Abrir:

```text
http://localhost:3003/login
```

## Bancos Migrados

O ambiente local foi reduzido para manter apenas os bancos usados nesta fase de teste:

- `master_db`
- `postgres`
- `tenant_acme`

O banco antigo `project_gestao` foi removido como database separado. Seus dados foram preservados em duas formas:

- dump em `.db-backups/cleanup-20260510-000257/`
- schema `legacy_project_gestao` dentro de `tenant_acme`

Backups ficam em `.db-backups/` e nao devem ser versionados.

Detalhes da migracao para Docker estao em `docs/postgres-docker-migration.md`.
