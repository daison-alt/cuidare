# CUIDARE - Correção segura da instalação da Central de Backups
# Usa o pacote oficial já extraído; preserva arquivos existentes.
param([Parameter(Mandatory=$true)][string]$PastaInstalacao)
$ErrorActionPreference = 'Stop'
$raiz = 'C:\Users\fisio\OneDrive\Desktop\CUIDARE\Cuidare_Kit_VSCode_Windows\cuidare-fonte'
$kit = Split-Path -Path $raiz -Parent
$pacote = Join-Path $PastaInstalacao 'arquivos'
$integrador = Join-Path $PastaInstalacao 'aplicar_patch.py'
$originais = @('backend\app\main.py', 'cuidare\src\App.jsx', 'cuidare\src\pages\ControleClinica.jsx', 'backend\requirements.txt')
$novos = @('backend\app\backup_core.py', 'backend\app\routers\backups_clinica.py', 'cuidare\src\pages\BackupsClinica.jsx')
$operacao = @('09_RESTAURAR_CUIDARE.cmd', '09_RESTAURAR_CUIDARE.ps1')
if (!(Test-Path $raiz)) { throw 'Pasta da Cuidare nao encontrada.' }
if (!(Test-Path $integrador)) { throw 'Pacote extraido nao encontrado. Nenhuma alteracao realizada.' }
foreach ($rel in $originais) {
  if (!(Test-Path -LiteralPath (Join-Path $raiz $rel))) { throw "Arquivo original ausente: $rel" }
}
$fontes = [System.Collections.ArrayList]::new()
foreach ($rel in $novos) {
  $origem = Join-Path $pacote $rel; $destino = Join-Path $raiz $rel
  if (!(Test-Path -LiteralPath $origem)) { throw "Pacote incompleto: $rel" }
  [void]$fontes.Add([pscustomobject]@{ Origem=$origem; Destino=$destino; Rel=$rel })
}
foreach ($rel in $operacao) {
  $origem = Join-Path (Join-Path $pacote 'operacao') $rel; $destino = Join-Path $kit $rel
  if (!(Test-Path -LiteralPath $origem)) { throw "Pacote incompleto: $rel" }
  [void]$fontes.Add([pscustomobject]@{ Origem=$origem; Destino=$destino; Rel=$rel })
}
# Preserva arquivos existentes. Se o conteudo divergir, cancela e solicita avaliacao.
$adicionar = [System.Collections.ArrayList]::new()
$diferentes = [System.Collections.ArrayList]::new()
$iguais = [System.Collections.ArrayList]::new()
foreach ($arq in $fontes) {
  if (Test-Path -LiteralPath $arq.Destino) {
    $hOrigem = (Get-FileHash -LiteralPath $arq.Origem -Algorithm SHA256).Hash
    $hDestino = (Get-FileHash -LiteralPath $arq.Destino -Algorithm SHA256).Hash
    if ($hOrigem -eq $hDestino) { [void]$iguais.Add($arq.Rel) }
    else { [void]$diferentes.Add($arq.Rel) }
  } else { [void]$adicionar.Add($arq) }
}
Write-Host "Existentes identicos ao pacote: $($iguais.Count)" -ForegroundColor Cyan
Write-Host "Arquivos novos a instalar: $($adicionar.Count)" -ForegroundColor Cyan
if ($diferentes.Count -gt 0) {
  Write-Host 'Arquivos existentes diferentes do pacote:' -ForegroundColor Yellow
  foreach ($rel in $diferentes) { Write-Host "  - $rel" -ForegroundColor Yellow }
  throw 'Instalacao parada para preservar arquivos com alteracoes locais. Nao exclua esses arquivos.'
}
$mainTexto = [IO.File]::ReadAllText((Join-Path $raiz 'backend\app\main.py'))
$controleTexto = [IO.File]::ReadAllText((Join-Path $raiz 'cuidare\src\pages\ControleClinica.jsx'))
$appTexto = [IO.File]::ReadAllText((Join-Path $raiz 'cuidare\src\App.jsx'))
$jaMain = $mainTexto.Contains('CUIDARE_BACKUP_ADMIN_V1')
$jaControle = $controleTexto.Contains('CUIDARE_BACKUP_ADMIN_V1')
$jaApp = $appTexto.Contains('podeGerenciarBackups=')
$jaInstalado = $jaMain -and $jaControle -and $jaApp -and $mainTexto.Contains('app.include_router(backups_clinica_router)')
if (($jaMain -or $jaControle -or $jaApp) -and !$jaInstalado) {
  throw 'Foi detectada integracao parcial ou diferente. Nenhum arquivo foi alterado; e necessario examinar antes de continuar.'
}
$python = Join-Path $raiz 'backend\.venv\Scripts\python.exe'
if (!(Test-Path -LiteralPath $python)) {
  $cmd = Get-Command python.exe -ErrorAction SilentlyContinue
  if (!$cmd) { throw 'Python nao encontrado.' }
  $python = $cmd.Source
}
if (!$jaInstalado) {
  # Validar encaixes numa copia temporaria sem tocar no projeto.
  $ensaio = Join-Path $env:TEMP ('Cuidare_EnsaioBackup_' + [guid]::NewGuid().ToString('N'))
  foreach ($rel in @('backend\app\main.py','cuidare\src\App.jsx','cuidare\src\pages\ControleClinica.jsx')) {
    $destino = Join-Path $ensaio $rel
    New-Item -ItemType Directory -Path (Split-Path $destino) -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $raiz $rel) -Destination $destino
  }
  try {
    $env:CUIDARE_RAIZ = $ensaio
    & $python $integrador
    if ($LASTEXITCODE -ne 0) { throw 'Versao local incompativel com o integrador. Nenhum arquivo foi alterado.' }
  } finally { Remove-Item -Path $ensaio -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item Env:CUIDARE_RAIZ -ErrorAction SilentlyContinue }
}
# Backups completos ANTES de alterar arquivos.
$backup = Join-Path $env:LOCALAPPDATA ('Cuidare\BackupsCodigo\CentralBackupCorrecao_' + (Get-Date -Format 'yyyyMMdd_HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
foreach ($rel in $originais) {
  $dest = Join-Path $backup $rel
  New-Item -ItemType Directory -Path (Split-Path $dest) -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $raiz $rel) -Destination $dest -Force
}
$db = Join-Path $raiz 'backend\cuidare.db'
if (Test-Path -LiteralPath $db) {
  & $python -c 'import sqlite3,sys; a=sqlite3.connect(sys.argv[1]); b=sqlite3.connect(sys.argv[2]); a.backup(b); b.close(); a.close()' $db (Join-Path $backup 'cuidare.db')
  if ($LASTEXITCODE -ne 0) { throw 'Falha no backup preventivo do banco. Nao foi realizada a instalacao.' }
}
Write-Host "Copia preventiva: $backup" -ForegroundColor Cyan
$criados = [System.Collections.ArrayList]::new()
$modificados = $false
try {
  Write-Host '[1/3] Instalando apenas arquivos ausentes...' -ForegroundColor Cyan
  foreach ($arq in $adicionar) {
    New-Item -ItemType Directory -Path (Split-Path $arq.Destino) -Force | Out-Null
    Copy-Item -LiteralPath $arq.Origem -Destination $arq.Destino -ErrorAction Stop
    [void]$criados.Add($arq.Destino)
  }
  if (!$jaInstalado) {
    Write-Host '[2/3] Integrando modulo...' -ForegroundColor Cyan
    $modificados = $true
    $env:CUIDARE_RAIZ = $raiz
    & $python $integrador
    if ($LASTEXITCODE -ne 0) { throw 'Integracao falhou.' }
  } else { Write-Host '[2/3] Modulo ja integrado. Sem alteracao na interface.' -ForegroundColor Green }
  $req = Join-Path $raiz 'backend\requirements.txt'
  if (!(Select-String -LiteralPath $req -Pattern '^cryptography([<=>\[]|$)' -Quiet)) {
    Add-Content -LiteralPath $req -Value "`ncryptography>=43,<48" -Encoding UTF8
    $modificados = $true
  }
  & $python -c 'import cryptography'
  if ($LASTEXITCODE -ne 0) {
    & $python -m pip install 'cryptography>=43,<48'
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar dependencia cryptography.' }
  }
  Write-Host '[3/3] Validando Python e React...' -ForegroundColor Cyan
  & $python -m py_compile (Join-Path $raiz 'backend\app\backup_core.py') (Join-Path $raiz 'backend\app\routers\backups_clinica.py') (Join-Path $raiz 'backend\app\main.py')
  if ($LASTEXITCODE -ne 0) { throw 'Erro de sintaxe Python.' }
  & npm.cmd --prefix (Join-Path $raiz 'cuidare') run build
  if ($LASTEXITCODE -ne 0) { throw 'Falha na compilacao do frontend.' }
  Write-Host 'CENTRAL DE BACKUPS INSTALADA E VALIDADA!' -ForegroundColor Green
  Write-Host "Backup de seguranca: $backup"
  Write-Host 'Reinicie backend e frontend, depois abra Controle da Clinica > Backups.'
}
catch {
  if ($modificados) {
    foreach ($rel in $originais) { Copy-Item -LiteralPath (Join-Path $backup $rel) -Destination (Join-Path $raiz $rel) -Force }
  }
  foreach ($item in $criados) { Remove-Item -LiteralPath $item -Force -ErrorAction SilentlyContinue }
  Write-Host 'Instalacao revertida. Arquivos anteriores e banco preservados.' -ForegroundColor Yellow
  throw
}
finally { Remove-Item Env:CUIDARE_RAIZ -ErrorAction SilentlyContinue }
