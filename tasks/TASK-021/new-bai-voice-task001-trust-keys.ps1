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
$aclRepair = Join-Path $PSScriptRoot 'repair-bai-voice-task001-trust-key-acl.ps1'
$canonicalKeyRoot = [System.IO.Path]::GetFullPath('C:\key').TrimEnd('\')
$resolvedKeyRoot = [System.IO.Path]::GetFullPath($KeyRoot).TrimEnd('\')

if (-not $resolvedKeyRoot.Equals($canonicalKeyRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Key provisioning is restricted to the exact Owner-authorized root: $canonicalKeyRoot"
}

if (-not (Test-Path -LiteralPath $privateBase -PathType Container)) {
  throw "Private key base directory is missing: $privateBase"
}
if (-not (Test-Path -LiteralPath $publicBase -PathType Container)) {
  throw "Public key base directory is missing: $publicBase"
}
if (-not (Test-Path -LiteralPath $generator -PathType Leaf)) {
  throw "Generator is missing: $generator"
}
if (-not (Test-Path -LiteralPath $aclRepair -PathType Leaf)) {
  throw "ACL repair and verifier is missing: $aclRepair"
}

& node $generator --private-dir $privateTarget --public-dir $publicTarget
if ($LASTEXITCODE -ne 0) {
  throw "Key generation failed with exit code $LASTEXITCODE"
}

& $aclRepair -KeyRoot $KeyRoot
if ($LASTEXITCODE -ne 0) {
  throw "Private key ACL hardening and verification failed with exit code $LASTEXITCODE"
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
