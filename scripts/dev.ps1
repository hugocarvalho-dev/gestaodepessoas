$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')

function Wait-PostgresTcp {
  Write-Host 'Verificando PostgreSQL em localhost:5432...'
  for ($attempt = 1; $attempt -le 20; $attempt++) {
    $ready = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($ready) {
      Write-Host 'PostgreSQL respondendo em localhost:5432.'
      return
    }
    Start-Sleep -Seconds 2
  }

  throw 'PostgreSQL nao respondeu em localhost:5432. Suba o Docker manualmente com: docker compose up -d postgres pgadmin'
}

function Test-PortInUse {
  param([int]$Port)

  $connection = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
  return [bool]$connection
}

function Start-AppWindow {
  param(
    [string]$Name,
    [string]$Path,
    [string]$NpmScript,
    [int]$Port
  )

  if (Test-PortInUse -Port $Port) {
    Write-Host "$Name ja parece estar rodando na porta $Port. Pulando."
    return
  }

  $command = "[Console]::Title = '$Name'; npm run $NpmScript"
  Start-Process powershell.exe `
    -WorkingDirectory $Path `
    -ArgumentList @('-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $command)

  Write-Host "$Name iniciando em nova janela na porta $Port."
}

Wait-PostgresTcp

Start-AppWindow -Name 'Gestao Backend API' -Path (Join-Path $root 'backend') -NpmScript 'dev' -Port 3000
Start-AppWindow -Name 'Gestao Frontend' -Path (Join-Path $root 'frontend') -NpmScript 'dev' -Port 3001
Start-AppWindow -Name 'Gestao Admin API' -Path (Join-Path $root 'admin') -NpmScript 'dev' -Port 3002
Start-AppWindow -Name 'Gestao Admin Frontend' -Path (Join-Path $root 'admin-frontend') -NpmScript 'dev' -Port 3003

Write-Host ''
Write-Host 'Ambiente iniciado.'
Write-Host 'App:          http://localhost:3001/login?tenant=acme'
Write-Host 'Backend:      http://localhost:3000/api'
Write-Host 'Admin:        http://localhost:3003/login'
Write-Host 'Admin API:    http://localhost:3002/api/admin'
Write-Host 'pgAdmin:      http://localhost:5050'
