# Run once in PowerShell **as Administrator** if your phone cannot reach the dev server.
# Allows inbound TCP on Vite ports (private networks only).

$ruleName = "Romstal Companion Vite Dev"
$ports = "5173-5180"

$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Firewall rule already exists: $ruleName"
    exit 0
}

try {
    New-NetFirewallRule -DisplayName $ruleName `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort $ports `
        -Profile Private -ErrorAction Stop
    Write-Host "OK: Allowed inbound TCP $ports on Private networks."
} catch {
    Write-Host "FAILED (run PowerShell as Administrator): $($_.Exception.Message)"
    exit 1
}
Write-Host "Restart npm run dev, then open the Network URL on your phone."
