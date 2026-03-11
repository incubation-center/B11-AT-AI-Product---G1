$connections = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
$processIds = @()

if ($connections) {
  $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($processId in $processIds) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Milliseconds 300
}

bun run dev
