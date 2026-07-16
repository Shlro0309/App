param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $MavenArgs
)

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$backendDir = Join-Path $projectRoot 'src\backend'
$javaHome = Join-Path $projectRoot 'config\tools\jdk-21.0.11+10'
$mavenHome = Join-Path $projectRoot 'config\tools\apache-maven-3.9.16'
$javaExe = Join-Path $javaHome 'bin\java.exe'
$mavenCmd = Join-Path $mavenHome 'bin\mvn.cmd'

if (-not (Test-Path $javaExe)) {
    throw "Java kit not found at $javaHome"
}

if (-not (Test-Path $mavenCmd)) {
    throw "Maven kit not found at $mavenHome"
}

$env:JAVA_HOME = $javaHome
$env:MAVEN_HOME = $mavenHome
$env:Path = "$javaHome\bin;$mavenHome\bin;$env:Path"

Push-Location $backendDir
try {
    & $mavenCmd @MavenArgs
    $exitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

exit $exitCode
