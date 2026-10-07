param([switch]$StopDatabase)
$projectRoot = Split-Path $PSScriptRoot -Parent
$localDir = Join-Path $projectRoot '.local'
if (Test-Path "$localDir\api.pid") {
  $apiProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$(Get-Content "$localDir\api.pid")"
  if ($apiProcess -and $apiProcess.Name -eq 'java.exe' -and $apiProcess.CommandLine -like '*backend/target/fitplix-api-1.0.0.jar*') {
    Stop-Process -Id $apiProcess.ProcessId
  }
}
Get-CimInstance Win32_Process | Where-Object {
  $_.Name -eq 'node.exe' -and $_.CommandLine -like "*$projectRoot\frontend\node_modules*" -and $_.CommandLine -like '*vite*'
} | ForEach-Object { Stop-Process -Id $_.ProcessId }
if ($StopDatabase -and (Test-Path "$localDir\pgdata\PG_VERSION")) {
  & 'C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe' -D "$localDir\pgdata" -m fast stop
}
Write-Output 'Stopped Fitflix app processes. Local database files are preserved.'
