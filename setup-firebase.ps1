$jsonPath = Read-Host "Enter path to your Firebase service account JSON file"
$json = Get-Content $jsonPath -Raw | ConvertFrom-Json | ConvertTo-Json -Compress
$escaped = $json -replace '"', '\"'
$envLine = "FIREBASE_SERVICE_ACCOUNT_JSON=$escaped"
$envPath = Join-Path $PSScriptRoot "apps\backend\.env"
Add-Content -Path $envPath -Value "`n$envLine"
Write-Host "Done! FIREBASE_SERVICE_ACCOUNT_JSON added to backend .env"
