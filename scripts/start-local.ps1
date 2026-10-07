param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot
$localDir = Join-Path $projectRoot '.local'
New-Item -ItemType Directory -Path $localDir -Force | Out-Null
$configFile = Join-Path $localDir 'runtime.json'
if (!(Test-Path -LiteralPath $configFile)) {
  $randomBytes = New-Object byte[] 48
  $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
  $generator.GetBytes($randomBytes)
  $generator.Dispose()
  @{jwt=[Convert]::ToBase64String($randomBytes)} | ConvertTo-Json | Set-Content -LiteralPath $configFile
}
$config = Get-Content -LiteralPath $configFile | ConvertFrom-Json
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
$pgBin = 'C:\Program Files\PostgreSQL\17\bin'
$pgData = Join-Path $localDir 'pgdata'
if (!(Test-Path -LiteralPath (Join-Path $pgData 'PG_VERSION'))) {
  & "$pgBin\initdb.exe" -D $pgData -U fitflix --auth=trust --encoding=UTF8 --no-locale
  if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL initialization failed' }
}
& "$pgBin\pg_ctl.exe" -D $pgData status *> $null
if ($LASTEXITCODE -ne 0) {
  & "$pgBin\pg_ctl.exe" -D $pgData -l "$localDir\postgres.log" -o '-h 127.0.0.1 -p 55432' start
  if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL did not start' }
}
$exists = & "$pgBin\psql.exe" -h 127.0.0.1 -p 55432 -U fitflix -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='fitflix'"
if ($exists -ne '1') { & "$pgBin\createdb.exe" -h 127.0.0.1 -p 55432 -U fitflix fitflix }
$env:DATABASE_URL = 'jdbc:postgresql://127.0.0.1:55432/fitflix'
$env:DATABASE_USER = 'fitflix'
$env:DATABASE_PASSWORD = 'local-loopback-only'
$env:JWT_SECRET = $config.jwt
$env:APP_ORIGIN = 'http://localhost:5173'
$env:SECURE_COOKIE = 'false'
$env:DEMO_MODE = 'false'
$env:MAIL_ENABLED = 'false'
$env:SERVER_ADDRESS = '127.0.0.1'
if (!$SkipBuild) {
  Push-Location backend
  $mavenCommand = Get-Command mvn.cmd -ErrorAction SilentlyContinue
  if ($mavenCommand) { $mavenExe = $mavenCommand.Source } else {
    $mavenExe = (Get-ChildItem "$env:USERPROFILE\.m2\wrapper\dists" -Filter mvn.cmd -Recurse | Select-Object -First 1).FullName
  }
  if (!$mavenExe) { throw 'Install Maven 3.9+ and add mvn.cmd to PATH' }
  & $mavenExe -B package -DskipTests
  if ($LASTEXITCODE -ne 0) { throw 'Backend build failed' }
  Pop-Location
}
$apiRunning = $false
if (Test-Path "$localDir\api.pid") {
  $existingApi = Get-CimInstance Win32_Process -Filter "ProcessId=$(Get-Content "$localDir\api.pid")"
  $apiRunning = $existingApi -and $existingApi.Name -eq 'java.exe' -and $existingApi.CommandLine -like '*backend/target/fitplix-api-1.0.0.jar*'
}
if (!$apiRunning) {
  $apiProcess = Start-Process -FilePath "$env:JAVA_HOME\bin\java.exe" -ArgumentList '-jar','backend/target/fitplix-api-1.0.0.jar' -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput "$localDir\api.log" -RedirectStandardError "$localDir\api-error.log" -PassThru
  $apiProcess.Id | Set-Content "$localDir\api.pid"
}
$webRunning = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like "*$projectRoot\frontend\node_modules*" -and $_.CommandLine -like '*vite*' }
if (!$webRunning) {
  $webProcess = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort' -WorkingDirectory "$projectRoot\frontend" -WindowStyle Hidden -RedirectStandardOutput "$localDir\web.log" -RedirectStandardError "$localDir\web-error.log" -PassThru
  $webProcess.Id | Set-Content "$localDir\web.pid"
}
Write-Output 'Fitflix processes started. Local URL: http://localhost:5173. Inspect .local/api.log and .local/web.log for readiness.'
