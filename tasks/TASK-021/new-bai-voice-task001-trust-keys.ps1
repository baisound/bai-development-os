[CmdletBinding()]
param(
  [string]$KeyRoot = 'C:\key'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$privateBase = Join-Path $KeyRoot 'Private'
$publicBase = Join-Path $KeyRoot 'Public'
$privateTarget = Join-Path $privateBase 'bai-voice-app-task-001'
$publicTarget = Join-Path $publicBase 'bai-voice-app-task-001'
$generator = Join-Path $PSScriptRoot 'generate-bai-voice-task001-trust-keys.mjs'

if (-not (Test-Path -LiteralPath $privateBase -PathType Container)) {
  throw "Private key base directory is missing: $privateBase"
}
if (-not (Test-Path -LiteralPath $publicBase -PathType Container)) {
  throw "Public key base directory is missing: $publicBase"
}
if (-not (Test-Path -LiteralPath $generator -PathType Leaf)) {
  throw "Generator is missing: $generator"
}

$privateBaseOwner = (Get-Acl -LiteralPath $privateBase).Owner
if ([string]::IsNullOrWhiteSpace($privateBaseOwner)) {
  throw 'Could not resolve the existing Private directory owner.'
}

& node $generator --private-dir $privateTarget --public-dir $publicTarget
if ($LASTEXITCODE -ne 0) {
  throw "Key generation failed with exit code $LASTEXITCODE"
}

$aclArguments = @(
  $privateTarget,
  '/inheritance:r',
  '/grant:r',
  "${privateBaseOwner}:(OI)(CI)F",
  '*S-1-5-18:(OI)(CI)F',
  '*S-1-5-32-544:(OI)(CI)F',
  '/T',
  '/C'
)
& icacls.exe @aclArguments | Out-Host
if ($LASTEXITCODE -ne 0) {
  throw "Private key ACL hardening failed with exit code $LASTEXITCODE"
}

$privateFiles = @(Get-ChildItem -LiteralPath $privateTarget -Recurse -File -Filter '*.pem')
$publicFiles = @(Get-ChildItem -LiteralPath $publicTarget -Recurse -File -Filter '*.pem')
if ($privateFiles.Count -ne 4 -or $publicFiles.Count -ne 4) {
  throw "Unexpected key count. private=$($privateFiles.Count), public=$($publicFiles.Count)"
}

Write-Output 'KEY_PROVISIONING_PASS'
Write-Output "PRIVATE_DIRECTORY=$privateTarget"
Write-Output "PUBLIC_DIRECTORY=$publicTarget"
Write-Output "PRIVATE_KEY_COUNT=$($privateFiles.Count)"
Write-Output "PUBLIC_KEY_COUNT=$($publicFiles.Count)"
Write-Output "PUBLIC_MANIFEST=$(Join-Path $publicTarget 'trust-manifest.json')"
