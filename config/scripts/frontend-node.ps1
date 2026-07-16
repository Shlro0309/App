param(
    [Parameter(Mandatory = $true)]
    [string] $ScriptName
)

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$frontendDir = Join-Path $projectRoot 'src\frontend'
$nodeHome = Join-Path $projectRoot 'config\tools\node-v20.20.2-win-x64'
$npmCmd = Join-Path $nodeHome 'npm.cmd'

if (-not (Test-Path $npmCmd)) {
    throw "Node kit not found at $nodeHome"
}

$env:Path = "$nodeHome;$env:Path"

Push-Location $frontendDir
try {
    if ($ScriptName -eq 'install') {
        & $npmCmd install
    } else {
        & $npmCmd run $ScriptName
    }
    $exitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

exit $exitCode
