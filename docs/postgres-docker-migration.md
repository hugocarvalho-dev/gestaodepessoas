# Migracao PostgreSQL Para Docker

## Estado Atual

O ambiente local usa PostgreSQL via Docker Compose e pgAdmin web.

Bancos mantidos:

- `master_db`: cadastro dos tenants.
- `tenant_acme`: banco principal usado para login e testes da aplicacao.
- `postgres`: banco administrativo padrao do PostgreSQL.

O banco antigo `project_gestao` foi removido como database separado. Os dados foram preservados no schema `legacy_project_gestao` dentro de `tenant_acme` e tambem em dump local.

## Backup

Backups desta limpeza:

```text
.db-backups/cleanup-20260510-000257/
```

Esse diretorio nao deve ser versionado.

## PgAdmin

URL:

```text
http://localhost:5050
```

Login local:

```text
admin@local.dev
```

Senha local:

```text
admin123
```

## Aplicacao

O backend usa:

```text
DATABASE_URL=postgresql://hugo:admin@localhost:5432/tenant_acme?schema=public
MASTER_DATABASE_URL=postgresql://hugo:admin@localhost:5432/master_db?schema=public
```

Mesmo usando `localhost:5432`, a conexao vai para o PostgreSQL do container porque o Docker publica a porta no host.

## Validacao

Comandos usados para validar:

```powershell
docker compose ps
docker exec project_gestao_postgres psql -U hugo -d postgres -c "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;"
cd backend; npm test -- --runInBand
cd backend; npm run test:e2e
```
