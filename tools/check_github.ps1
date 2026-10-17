<#
.SYNOPSIS
Read GitHub Actions status using the already installed GitHub CLI.
.EXAMPLE
powershell -File tools/check_github.ps1 -UseStoredLogin
.EXAMPLE
powershell -File tools/check_github.ps1 -UseStoredLogin -RunId 39019222088 -FailedLogs
#>
[CmdletBinding()]
param(
    [string]$Repository = 'Jacoporusso/veloria',
    [ValidateRange(1, 20)][int]$Limit = 5,
    [long]$RunId = 0,
    [switch]$FailedLogs,
    [switch]$UseStoredLogin
)

$ErrorActionPreference = 'Stop'
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw 'GitHub CLI is not installed. Install it with: winget install --id GitHub.cli --exact'
}
if ($FailedLogs -and $RunId -le 0) {
    throw '-FailedLogs requires a positive -RunId.'
}

$savedOverrides = @{}
try {
    if ($UseStoredLogin) {
        foreach ($variableName in @('GH_TOKEN', 'GITHUB_TOKEN')) {
            $savedOverrides[$variableName] = [Environment]::GetEnvironmentVariable($variableName, 'Process')
            Remove-Item -LiteralPath "Env:$variableName" -ErrorAction SilentlyContinue
        }
    }

    & gh --version | Select-Object -First 1
    $githubLogin = & gh api user --jq '.login'
    if ($LASTEXITCODE -ne 0) { throw 'GitHub authentication failed. Run gh auth login or use -UseStoredLogin if an environment token overrides the stored login.' }
    Write-Output "Authenticated as $githubLogin"

    if ($RunId -gt 0) {
        & gh run view $RunId --repo $Repository --json databaseId,headSha,status,conclusion,url,jobs
        if ($LASTEXITCODE -ne 0) { throw "Could not read workflow run $RunId." }
        if ($FailedLogs) {
            & gh run view $RunId --repo $Repository --log-failed
            if ($LASTEXITCODE -ne 0) { throw 'Failed job logs are unavailable; the run may still be in progress.' }
        }
    } else {
        & gh run list --repo $Repository --limit $Limit --json databaseId,headSha,status,conclusion,displayTitle,url
        if ($LASTEXITCODE -ne 0) { throw 'Could not read workflow runs.' }
    }
} finally {
    foreach ($variableName in $savedOverrides.Keys) {
        if ($null -eq $savedOverrides[$variableName]) {
            Remove-Item -LiteralPath "Env:$variableName" -ErrorAction SilentlyContinue
        } else {
            [Environment]::SetEnvironmentVariable($variableName, $savedOverrides[$variableName], 'Process')
        }
    }
}
