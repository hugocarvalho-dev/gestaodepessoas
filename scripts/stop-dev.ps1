$ErrorActionPreference = 'Stop'

$ports = @(3000, 3001, 3002, 3003)

foreach ($port in $ports) {
  $connections = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
  foreach ($connection in $connections) {
    $processId = $connection.OwningProcess
    if ($processId) {
      Write-Host "Parando processo $processId na porta $port..."
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
  }
}

Write-Host 'Aplicacoes Node paradas. PostgreSQL/pgAdmin continuam rodando no Docker.'
Write-Host 'Para parar banco e pgAdmin: docker compose down'
