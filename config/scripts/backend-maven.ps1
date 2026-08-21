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

$cleanRequiredGoals = @('compile', 'test', 'package', 'verify', 'install', 'spring-boot:run')
$hasCleanGoal = $MavenArgs -contains 'clean'
$needsCleanGoal = $MavenArgs | Where-Object { $cleanRequiredGoals -contains $_ } | Select-Object -First 1
if ($needsCleanGoal -and -not $hasCleanGoal) {
    $MavenArgs = @('clean') + $MavenArgs
}

Push-Location $backendDir
try {
    & $mavenCmd @MavenArgs
    $exitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

exit $exitCode
