[CmdletBinding()]
param(
    [ValidateSet("bootstrap", "verify", "help")]
    [string] $Command = "help"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$RepoRoot = $PSScriptRoot
$OriginalLocation = Get-Location
$OriginalNodeOptions = $env:NODE_OPTIONS

function ConvertTo-StatusJson {
    param([object] $Value)
    $Value | ConvertTo-Json -Depth 8
}

function New-Summary {
    param(
        [string] $CommandName,
        [array] $Checks,
        [int] $TestCount = 0
    )

    $scenarioCheck = @($Checks | Where-Object { $_.name -eq "node scripts/validate-resource-scenarios.mjs" } | Select-Object -Last 1)
    $expectedNegativeCheck = @($Checks | Where-Object { $_.name -eq "expected invalid scenario fixture" } | Select-Object -Last 1)
    $scenarioStatus = if ($scenarioCheck.Count -eq 0) { "not_run" } elseif ($scenarioCheck[0].status -eq "passed") { "passed" } else { "failed" }
    $expectedNegativeStatus = if ($expectedNegativeCheck.Count -eq 0) { "not_run" } elseif ($expectedNegativeCheck[0].status -eq "passed") { "passed" } else { "failed" }

    [ordered]@{
        command = $CommandName
        verification_status = if (@($Checks | Where-Object { $_.status -eq "failed" }).Count -eq 0) { "passed" } else { "failed" }
        charter_status = "incubation"
        skeleton_status = "skeleton"
        test_count = $TestCount
        legacy_source_status = "preserved_not_executed"
        dependency_installation = "not_required"
        external_service_calls = "none"
        simulation_kernel = "not_implemented"
        bitcoin_behavior = "not_implemented"
        ai_behavior = "not_implemented"
        scenario_contract = $scenarioStatus
        scenario_fixtures = $scenarioStatus
        expected_negative_tests = $expectedNegativeStatus
        checks = $Checks
    }
}

function Invoke-Check {
    param(
        [string] $Name,
        [scriptblock] $Action
    )

    $output = @(& $Action 2>&1 | ForEach-Object { "$_" })
    $code = if ($null -eq $LASTEXITCODE) { 0 } else { $LASTEXITCODE }
    [ordered]@{
        name = $Name
        status = if ($code -eq 0) { "passed" } else { "failed" }
        exit_code = $code
        output = $output
    }
}

function Get-NodeMajor {
    param([string] $Version)
    if ($Version -notmatch '^v?(\d+)') {
        return -1
    }
    [int]$Matches[1]
}

function Invoke-BootstrapChecks {
    $checks = @()

    $checks += Invoke-Check -Name "git --version" -Action {
        & git --version
    }

    $checks += [ordered]@{
        name = "powershell version"
        status = "passed"
        exit_code = 0
        output = @($PSVersionTable.PSVersion.ToString())
    }

    $nodeVersionCheck = Invoke-Check -Name "node --version" -Action {
        & node --version
    }
    if ($nodeVersionCheck.status -eq "passed") {
        $major = Get-NodeMajor -Version $nodeVersionCheck.output[0]
        if ($major -lt 22) {
            $nodeVersionCheck.status = "failed"
            $nodeVersionCheck.output += "Node.js 22 or newer is required."
        }
    }
    $checks += $nodeVersionCheck

    $legacyDoc = Join-Path $RepoRoot "docs/legacy-source-access.md"
    if ((Test-Path -LiteralPath $legacyDoc) -and ((Get-Content -Raw -LiteralPath $legacyDoc) -match "legacy/pre-orbital-compute-lab")) {
        $checks += [ordered]@{
            name = "legacy branch documentation"
            status = "passed"
            exit_code = 0
            output = @("legacy/pre-orbital-compute-lab documented")
        }
    } else {
        $checks += [ordered]@{
            name = "legacy branch documentation"
            status = "failed"
            exit_code = 1
            output = @("docs/legacy-source-access.md must document legacy/pre-orbital-compute-lab")
        }
    }

    $checks
}

try {
    Set-Location -LiteralPath $RepoRoot
    $env:NODE_OPTIONS = $null

    switch ($Command) {
        "bootstrap" {
            $checks = Invoke-BootstrapChecks
            $summary = New-Summary -CommandName "bootstrap" -Checks $checks
            ConvertTo-StatusJson $summary
            if ($summary.verification_status -eq "passed") { exit 0 }
            exit 1
        }
        "verify" {
            $checks = @()
            $checks += Invoke-BootstrapChecks
            if (@($checks | Where-Object { $_.status -eq "failed" }).Count -gt 0) {
                ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks)
                exit 1
            }

            $checks += Invoke-Check -Name "git diff --check" -Action {
                & git diff --check
            }
            if ($checks[-1].status -eq "failed") {
                ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks)
                exit $checks[-1].exit_code
            }

            $checks += Invoke-Check -Name "node scripts/validate-incubation-charter.mjs" -Action {
                & node scripts/validate-incubation-charter.mjs
            }
            if ($checks[-1].status -eq "failed") {
                ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks)
                exit $checks[-1].exit_code
            }

            $checks += Invoke-Check -Name "node scripts/validate-clean-skeleton.mjs" -Action {
                & node scripts/validate-clean-skeleton.mjs
            }
            if ($checks[-1].status -eq "failed") {
                ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks)
                exit $checks[-1].exit_code
            }

            $checks += Invoke-Check -Name "node scripts/validate-resource-scenarios.mjs" -Action {
                & node scripts/validate-resource-scenarios.mjs
            }
            if ($checks[-1].status -eq "failed") {
                ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks)
                exit $checks[-1].exit_code
            }

            $checks += Invoke-Check -Name "node --test" -Action {
                & node --test
            }
            $testOutput = $checks[-1].output
            $testCount = 0
            foreach ($line in $testOutput) {
                if ($line -match 'tests\s+(\d+)') {
                    $testCount = [int]$Matches[1]
                }
            }
            if ($checks[-1].status -eq "failed") {
                ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount)
                exit $checks[-1].exit_code
            }

            $cliCheck = Invoke-Check -Name "node src/cli.mjs status --json" -Action {
                & node src/cli.mjs status --json
            }
            if ($cliCheck.status -eq "passed") {
                try {
                    $status = ($cliCheck.output -join "`n") | ConvertFrom-Json
                    if ($status.product_name -ne "Orbital Compute Lab" -or
                        $status.implementation_status -ne "skeleton" -or
                        $status.capabilities.simulation_kernel -ne $false -or
                        $status.capabilities.bitcoin_workload_model -ne $false -or
                        $status.capabilities.ai_workload_model -ne $false) {
                        $cliCheck.status = "failed"
                        $cliCheck.exit_code = 1
                        $cliCheck.output += "CLI status JSON overstates or mismatches skeleton capabilities."
                    }
                } catch {
                    $cliCheck.status = "failed"
                    $cliCheck.exit_code = 1
                    $cliCheck.output += "CLI status JSON could not be parsed."
                }
            }
            $checks += $cliCheck
            if ($checks[-1].status -eq "failed") {
                ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount)
                exit $checks[-1].exit_code
            }

            $scenarioCheck = Invoke-Check -Name "node src/cli.mjs validate-scenario fixtures/scenarios/minimal-sunlit.v1.json --json" -Action {
                & node src/cli.mjs validate-scenario fixtures/scenarios/minimal-sunlit.v1.json --json
            }
            if ($scenarioCheck.status -eq "passed") {
                try {
                    $scenarioResult = ($scenarioCheck.output -join "`n") | ConvertFrom-Json
                    if ($scenarioResult.ok -ne $true -or $scenarioResult.scenario_id -ne "minimal-sunlit") {
                        $scenarioCheck.status = "failed"
                        $scenarioCheck.exit_code = 1
                        $scenarioCheck.output += "Scenario CLI JSON did not report the expected valid fixture."
                    }
                } catch {
                    $scenarioCheck.status = "failed"
                    $scenarioCheck.exit_code = 1
                    $scenarioCheck.output += "Scenario CLI JSON could not be parsed."
                }
            }
            $checks += $scenarioCheck
            if ($checks[-1].status -eq "failed") {
                ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount)
                exit $checks[-1].exit_code
            }

            $invalidScenarioCheck = Invoke-Check -Name "expected invalid scenario fixture" -Action {
                $invalidOutput = & node src/cli.mjs validate-scenario fixtures/scenarios/invalid/negative-energy.v1.json --json
                $invalidCode = $LASTEXITCODE
                $invalidOutput
                if ($invalidCode -eq 1 -and (($invalidOutput -join "`n") -match "negative_integer")) {
                    $global:LASTEXITCODE = 0
                } else {
                    "Expected invalid fixture to exit 1 with negative_integer, got $invalidCode."
                    $global:LASTEXITCODE = 1
                }
            }
            $checks += $invalidScenarioCheck
            if ($checks[-1].status -eq "failed") {
                ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount)
                exit $checks[-1].exit_code
            }

            ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount)
            exit 0
        }
        "help" {
            "Usage: .\eng.ps1 bootstrap | verify | help"
            "bootstrap: checks Git, PowerShell, Node.js 22+, and legacy-source documentation without installing dependencies or creating artifacts."
            "verify: runs bootstrap, git diff --check, charter validation, clean-skeleton validation, resource-scenario validation, node --test, status CLI, and representative scenario CLI checks."
            "No simulation, Bitcoin, AI, wallet, trading, network, hardware, or mission-authority behavior is verified or implemented."
            exit 0
        }
    }
} finally {
    $env:NODE_OPTIONS = $OriginalNodeOptions
    Set-Location -LiteralPath $OriginalLocation
}
