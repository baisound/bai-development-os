[CmdletBinding()]
param(
  [string]$KeyRoot = 'C:\key',
  [switch]$VerifyOnly,
  [switch]$PreflightOnly,
  [switch]$AllowTestRoot,
  [ValidateRange(0, 9)] [int]$TestFailMutationAt = 0,
  [string]$TestExpectedOwnerSid = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if (-not (Get-Command Get-Acl -ErrorAction SilentlyContinue)) {
  $securityModulePath = Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Security\Microsoft.PowerShell.Security.psd1'
  Import-Module $securityModulePath -ErrorAction Stop
}

$roles = @(
  'owner-signer',
  'independent-verifier',
  'canonical-store-binding',
  'snapshot-coordinator'
)
$privateBase = Join-Path $KeyRoot 'Private'
$privateTarget = Join-Path $privateBase 'bai-voice-app-task-001'
$canonicalKeyRoot = [System.IO.Path]::GetFullPath('C:\key').TrimEnd('\')
$resolvedKeyRoot = [System.IO.Path]::GetFullPath($KeyRoot).TrimEnd('\')
$systemDirectory = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::System)
$icaclsPath = Join-Path $systemDirectory 'icacls.exe'
foreach ($nativeTool in @($icaclsPath)) {
  if (-not (Test-Path -LiteralPath $nativeTool -PathType Leaf)) {
    throw "Required System32 executable is missing: $nativeTool"
  }
}

if (-not ('BaiTask021FileIdentity' -as [type])) {
  Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;

public static class BaiTask021FileIdentity {
  [StructLayout(LayoutKind.Sequential)]
  private struct BY_HANDLE_FILE_INFORMATION {
    public uint FileAttributes;
    public System.Runtime.InteropServices.ComTypes.FILETIME CreationTime;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastAccessTime;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWriteTime;
    public uint VolumeSerialNumber;
    public uint FileSizeHigh;
    public uint FileSizeLow;
    public uint NumberOfLinks;
    public uint FileIndexHigh;
    public uint FileIndexLow;
  }

  [StructLayout(LayoutKind.Sequential)]
  private struct LUID {
    public uint LowPart;
    public int HighPart;
  }

  [StructLayout(LayoutKind.Sequential)]
  private struct TOKEN_PRIVILEGES {
    public uint PrivilegeCount;
    public LUID Luid;
    public uint Attributes;
  }

  [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  private static extern SafeFileHandle CreateFile(
    string fileName,
    uint desiredAccess,
    uint shareMode,
    IntPtr securityAttributes,
    uint creationDisposition,
    uint flagsAndAttributes,
    IntPtr templateFile
  );

  [DllImport("kernel32.dll", SetLastError = true)]
  private static extern bool GetFileInformationByHandle(
    SafeFileHandle file,
    out BY_HANDLE_FILE_INFORMATION information
  );

  [DllImport("kernel32.dll")]
  private static extern IntPtr GetCurrentProcess();

  [DllImport("advapi32.dll", SetLastError = true)]
  private static extern bool OpenProcessToken(
    IntPtr processHandle,
    uint desiredAccess,
    out IntPtr tokenHandle
  );

  [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  private static extern bool LookupPrivilegeValue(
    string systemName,
    string name,
    out LUID luid
  );

  [DllImport("advapi32.dll", SetLastError = true)]
  private static extern bool AdjustTokenPrivileges(
    IntPtr tokenHandle,
    bool disableAllPrivileges,
    ref TOKEN_PRIVILEGES newState,
    uint bufferLength,
    IntPtr previousState,
    IntPtr returnLength
  );

  [DllImport("kernel32.dll", SetLastError = true)]
  private static extern bool CloseHandle(IntPtr handle);

  private static void EnableBackupPrivilege() {
    const uint TOKEN_ADJUST_PRIVILEGES = 0x0020;
    const uint TOKEN_QUERY = 0x0008;
    const uint SE_PRIVILEGE_ENABLED = 0x0002;
    const int ERROR_NOT_ALL_ASSIGNED = 1300;
    IntPtr tokenHandle;
    if (!OpenProcessToken(GetCurrentProcess(), TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, out tokenHandle)) {
      throw new Win32Exception(Marshal.GetLastWin32Error(), "Could not open elevated process token");
    }
    try {
      LUID luid;
      if (!LookupPrivilegeValue(null, "SeBackupPrivilege", out luid)) {
        throw new Win32Exception(Marshal.GetLastWin32Error(), "Could not resolve SeBackupPrivilege");
      }
      TOKEN_PRIVILEGES privileges = new TOKEN_PRIVILEGES();
      privileges.PrivilegeCount = 1;
      privileges.Luid = luid;
      privileges.Attributes = SE_PRIVILEGE_ENABLED;
      if (!AdjustTokenPrivileges(tokenHandle, false, ref privileges, 0, IntPtr.Zero, IntPtr.Zero)) {
        throw new Win32Exception(Marshal.GetLastWin32Error(), "Could not enable SeBackupPrivilege");
      }
      int error = Marshal.GetLastWin32Error();
      if (error == ERROR_NOT_ALL_ASSIGNED) {
        throw new Win32Exception(error, "SeBackupPrivilege is not assigned to this token");
      }
    } finally {
      CloseHandle(tokenHandle);
    }
  }

  private static uint GetLinkCountCore(string path, uint desiredAccess, uint flagsAndAttributes) {
    const uint SHARE_READ_WRITE_DELETE = 0x00000007;
    const uint OPEN_EXISTING = 3;
    SafeFileHandle handle = CreateFile(
      path,
      desiredAccess,
      SHARE_READ_WRITE_DELETE,
      IntPtr.Zero,
      OPEN_EXISTING,
      flagsAndAttributes,
      IntPtr.Zero
    );
    if (handle.IsInvalid) {
      throw new Win32Exception(Marshal.GetLastWin32Error(), "Could not open file identity handle");
    }
    try {
      BY_HANDLE_FILE_INFORMATION information;
      if (!GetFileInformationByHandle(handle, out information)) {
        throw new Win32Exception(Marshal.GetLastWin32Error(), "Could not query file identity");
      }
      return information.NumberOfLinks;
    } finally {
      handle.Dispose();
    }
  }

  public static uint GetLinkCount(string path) {
    const uint METADATA_ONLY_ACCESS = 0;
    return GetLinkCountCore(path, METADATA_ONLY_ACCESS, 0);
  }

  public static uint GetLinkCountWithBackupPrivilege(string path) {
    const uint FILE_READ_ATTRIBUTES = 0x00000080;
    const uint FILE_FLAG_BACKUP_SEMANTICS = 0x02000000;
    EnableBackupPrivilege();
    return GetLinkCountCore(path, FILE_READ_ATTRIBUTES, FILE_FLAG_BACKUP_SEMANTICS);
  }
}
'@
}

if (-not $resolvedKeyRoot.Equals($canonicalKeyRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  $systemTempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\')
  $testPrefix = "$systemTempRoot\bai-task021-acl-"
  if (-not $AllowTestRoot -or -not $resolvedKeyRoot.StartsWith($testPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Production ACL repair is restricted to the exact Owner-authorized root: $canonicalKeyRoot"
  }
}
if ($TestFailMutationAt -ne 0 -and
    (-not $AllowTestRoot -or $resolvedKeyRoot.Equals($canonicalKeyRoot, [System.StringComparison]::OrdinalIgnoreCase))) {
  throw 'The mutation-failure fixture hook is restricted to an explicitly allowed non-production test root.'
}
if ($VerifyOnly -and $PreflightOnly) {
  throw 'VerifyOnly and PreflightOnly are mutually exclusive.'
}
if (-not [string]::IsNullOrWhiteSpace($TestExpectedOwnerSid) -and
    (-not $AllowTestRoot -or $resolvedKeyRoot.Equals($canonicalKeyRoot, [System.StringComparison]::OrdinalIgnoreCase))) {
  throw 'The expected-owner fixture hook is restricted to an explicitly allowed non-production test root.'
}

function Assert-NotReparsePoint {
  param(
    [Parameter(Mandatory)] [string]$Path,
    [Parameter(Mandatory)] [string]$Label
  )

  $item = Get-Item -LiteralPath $Path -Force
  if (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
    throw "Reparse point is forbidden: $Label"
  }
}

function Assert-SingleLinkFile {
  param(
    [Parameter(Mandatory)] [string]$Path,
    [Parameter(Mandatory)] [string]$Label
  )

  try {
    $linkCount = [BaiTask021FileIdentity]::GetLinkCount($Path)
  } catch {
    $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [System.Security.Principal.WindowsPrincipal]::new($identity)
    $isAdministrator = $principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdministrator) {
      throw "Private key link metadata is inaccessible without elevation; rerun from an Administrator PowerShell: $Label"
    }
    $linkCount = [BaiTask021FileIdentity]::GetLinkCountWithBackupPrivilege($Path)
    Write-Output "HARDLINK_ELEVATED_METADATA=$Label"
  }
  if ($linkCount -ne 1) {
    throw "Private key file must have exactly one hardlink: $Label count=$linkCount"
  }
}

function Assert-PathIdentity {
  param(
    [Parameter(Mandatory)] [string]$Path,
    [Parameter(Mandatory)] [bool]$IsDirectory,
    [Parameter(Mandatory)] [string]$Label
  )

  $fullPath = [System.IO.Path]::GetFullPath($Path)
  $privatePrefix = [System.IO.Path]::GetFullPath($privateTarget).TrimEnd('\') + '\'
  $privateRootPath = [System.IO.Path]::GetFullPath($privateTarget).TrimEnd('\')
  if (-not $fullPath.Equals($privateRootPath, [System.StringComparison]::OrdinalIgnoreCase) -and
      -not $fullPath.StartsWith($privatePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Target escapes the exact private root: $Label"
  }
  Assert-NotReparsePoint -Path $Path -Label $Label
  if (-not $IsDirectory) {
    Assert-SingleLinkFile -Path $Path -Label $Label
  }
}

if (-not (Test-Path -LiteralPath $privateBase -PathType Container)) {
  throw "Private key base directory is missing: $privateBase"
}
if (-not (Test-Path -LiteralPath $privateTarget -PathType Container)) {
  throw "Private key target directory is missing: $privateTarget"
}
Assert-NotReparsePoint -Path $resolvedKeyRoot -Label 'key-root'
Assert-NotReparsePoint -Path $privateBase -Label 'private-base'
Assert-NotReparsePoint -Path $privateTarget -Label 'private-root'

$privateBaseOwner = (Get-Acl -LiteralPath $privateBase).Owner
if ([string]::IsNullOrWhiteSpace($privateBaseOwner)) {
  throw 'Could not resolve the existing Private directory owner.'
}
$ownerSid = ([System.Security.Principal.NTAccount]$privateBaseOwner).Translate(
  [System.Security.Principal.SecurityIdentifier]
)
if (-not [string]::IsNullOrWhiteSpace($TestExpectedOwnerSid)) {
  $ownerSid = [System.Security.Principal.SecurityIdentifier]::new($TestExpectedOwnerSid)
}
$expectedSids = @(
  $ownerSid,
  [System.Security.Principal.SecurityIdentifier]::new('S-1-5-18'),
  [System.Security.Principal.SecurityIdentifier]::new('S-1-5-32-544')
)
$expectedSidValues = @($expectedSids | ForEach-Object Value | Sort-Object)

$targets = [System.Collections.Generic.List[object]]::new()
$targets.Add([pscustomobject]@{ Path = $privateTarget; IsDirectory = $true; Label = 'private-root' })
foreach ($role in $roles) {
  $roleDirectory = Join-Path $privateTarget $role
  $keyFile = Join-Path $roleDirectory 'key.ed25519.pkcs8.pem'
  if (-not (Test-Path -LiteralPath $roleDirectory -PathType Container)) {
    throw "Expected private role directory is missing: $roleDirectory"
  }
  if (-not (Test-Path -LiteralPath $keyFile -PathType Leaf)) {
    throw "Expected private key file is missing: $keyFile"
  }
  $targets.Add([pscustomobject]@{ Path = $roleDirectory; IsDirectory = $true; Label = "role:$role" })
  $targets.Add([pscustomobject]@{ Path = $keyFile; IsDirectory = $false; Label = "key:$role" })
}

$expectedPaths = @($targets | Where-Object { $_.Label -ne 'private-root' } | ForEach-Object { [System.IO.Path]::GetFullPath($_.Path) } | Sort-Object)
$actualPaths = [System.Collections.Generic.List[string]]::new()
$pendingDirectories = [System.Collections.Generic.Stack[string]]::new()
$pendingDirectories.Push($privateTarget)
while ($pendingDirectories.Count -gt 0) {
  $currentDirectory = $pendingDirectories.Pop()
  foreach ($entry in @(Get-ChildItem -LiteralPath $currentDirectory -Force)) {
    $entryPath = [System.IO.Path]::GetFullPath($entry.FullName)
    $actualPaths.Add($entryPath)
    if (($entry.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw "Reparse point is forbidden in the private subtree: $entryPath"
    }
    if ($entry.PSIsContainer) {
      $pendingDirectories.Push($entryPath)
    }
  }
}
if (@(Compare-Object $expectedPaths @($actualPaths | Sort-Object)).Count -ne 0) {
  throw 'Unexpected private subtree topology; refusing any ACL mutation.'
}
foreach ($target in $targets) {
  Assert-PathIdentity -Path $target.Path -IsDirectory $target.IsDirectory -Label $target.Label
}

function Set-ExactAcl {
  param(
    [Parameter(Mandatory)] [string]$Path,
    [Parameter(Mandatory)] [bool]$IsDirectory
  )

  $permission = if ($IsDirectory) { '(OI)(CI)F' } else { 'F' }
  $grantArguments = @(
    $Path,
    '/inheritance:r',
    '/grant:r',
    "*$($ownerSid.Value):$permission",
    "*S-1-5-18:$permission",
    "*S-1-5-32-544:$permission",
    '/Q'
  )
  & $icaclsPath @grantArguments | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Exact ACL grant failed with exit code $LASTEXITCODE"
  }
}

function Assert-PreMutationAcl {
  param(
    [Parameter(Mandatory)] [string]$Path,
    [Parameter(Mandatory)] [string]$Label
  )

  $acl = Get-Acl -LiteralPath $Path
  $actualOwnerSid = ([System.Security.Principal.NTAccount]$acl.Owner).Translate(
    [System.Security.Principal.SecurityIdentifier]
  )
  if ($actualOwnerSid.Value -ne $ownerSid.Value) {
    throw "ACL owner differs from the existing Private directory owner: $Label"
  }
  $currentRules = @($acl.GetAccessRules($true, $true, [System.Security.Principal.SecurityIdentifier]))
  foreach ($rule in @($currentRules | Where-Object { -not $_.IsInherited })) {
    if ($rule.AccessControlType -ne [System.Security.AccessControl.AccessControlType]::Allow) {
      throw "Refusing to replace an explicit deny rule: $Label"
    }
    if ($expectedSidValues -notcontains $rule.IdentityReference.Value) {
      throw "Refusing to replace an explicit rule outside the exact allowlist: $Label"
    }
  }
}

foreach ($target in $targets) {
  Assert-PreMutationAcl -Path $target.Path -Label $target.Label
}

if ($PreflightOnly) {
  Write-Output 'ACL_PREFLIGHT_PASS'
  Write-Output "PRIVATE_DIRECTORY=$privateTarget"
  Write-Output 'PRIVATE_KEY_CONTENT_READ=NO'
  return
}

$mutationIndex = 0
foreach ($target in $targets) {
  if (-not $VerifyOnly) {
    $mutationIndex++
    Assert-PathIdentity -Path $target.Path -IsDirectory $target.IsDirectory -Label $target.Label
    if ($TestFailMutationAt -eq $mutationIndex) {
      throw "Injected test-only ACL mutation failure at target $mutationIndex"
    }
    Set-ExactAcl -Path $target.Path -IsDirectory $target.IsDirectory
  }
}

foreach ($target in $targets) {
  Assert-PathIdentity -Path $target.Path -IsDirectory $target.IsDirectory -Label $target.Label
  $acl = Get-Acl -LiteralPath $target.Path
  if (-not $acl.AreAccessRulesProtected) {
    throw "ACL inheritance remains enabled: $($target.Label)"
  }
  $actualOwnerSid = ([System.Security.Principal.NTAccount]$acl.Owner).Translate(
    [System.Security.Principal.SecurityIdentifier]
  )
  if ($actualOwnerSid.Value -ne $ownerSid.Value) {
    throw "ACL owner differs from the existing Private directory owner: $($target.Label)"
  }
  $rules = @($acl.GetAccessRules($true, $true, [System.Security.Principal.SecurityIdentifier]))
  if ($rules.Count -ne 3) {
    throw "ACL rule count is not exactly three: $($target.Label) count=$($rules.Count)"
  }
  $actualSidValues = @($rules | ForEach-Object { $_.IdentityReference.Value } | Sort-Object)
  if (@(Compare-Object $expectedSidValues $actualSidValues).Count -ne 0) {
    throw "ACL principals differ from the exact allowlist: $($target.Label)"
  }
  foreach ($rule in $rules) {
    if ($rule.IsInherited) {
      throw "Inherited ACL rule found: $($target.Label)"
    }
    if ($rule.AccessControlType -ne [System.Security.AccessControl.AccessControlType]::Allow) {
      throw "Non-allow ACL rule found: $($target.Label)"
    }
    if ($rule.FileSystemRights -ne [System.Security.AccessControl.FileSystemRights]::FullControl) {
      throw "ACL rule is not exact FullControl: $($target.Label)"
    }
    $expectedInheritance = if ($target.IsDirectory) {
      [System.Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [System.Security.AccessControl.InheritanceFlags]::ObjectInherit
    } else {
      [System.Security.AccessControl.InheritanceFlags]::None
    }
    if ($rule.InheritanceFlags -ne $expectedInheritance) {
      throw "ACL inheritance flags differ from the object-specific policy: $($target.Label)"
    }
    if ($rule.PropagationFlags -ne [System.Security.AccessControl.PropagationFlags]::None) {
      throw "Unexpected ACL propagation flags: $($target.Label)"
    }
  }
  Write-Output "ACL_VERIFIED=$($target.Label)"
}

foreach ($role in $roles) {
  $keyPath = Join-Path (Join-Path $privateTarget $role) 'key.ed25519.pkcs8.pem'
  Assert-PathIdentity -Path $keyPath -IsDirectory $false -Label "key:$role"
  $handle = [System.IO.File]::Open(
    $keyPath,
    [System.IO.FileMode]::Open,
    [System.IO.FileAccess]::Read,
    [System.IO.FileShare]::Read
  )
  try {
  } finally {
    $handle.Dispose()
  }
  Write-Output "READ_HANDLE_VERIFIED=key:$role"
}

if ($VerifyOnly) {
  Write-Output 'ACL_VERIFICATION_PASS'
} else {
  Write-Output 'ACL_REPAIR_PASS'
}
Write-Output "PRIVATE_DIRECTORY=$privateTarget"
Write-Output 'PRIVATE_KEY_CONTENT_READ=NO'
