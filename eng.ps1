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
    $Value | ConvertTo-Json -Depth 12
}

function Get-CheckStatus {
    param(
        [array] $Checks,
        [string] $Name
    )
    $matching = @($Checks | Where-Object { $_.name -eq $Name } | Select-Object -Last 1)
    if ($matching.Count -eq 0) { return "not_run" }
    if ($matching[0].status -eq "passed") { return "passed" }
    return "failed"
}

function New-Summary {
    param(
        [string] $CommandName,
        [array] $Checks,
        [int] $TestCount = 0
    )

    [ordered]@{
        command = $CommandName
        verification_status = if (@($Checks | Where-Object { $_.status -eq "failed" }).Count -eq 0) { "passed" } else { "failed" }
        pilot_status = "operational_pilot"
        active_tree_status = "controlled_test_range"
        test_count = $TestCount
        legacy_source_status = "preserved_not_executed"
        dependency_installation = "not_required"
        external_service_calls = "none"
        provider_status = "not_required"
        adapter_status = "not_required"
        simulation_kernel = "not_implemented"
        scheduler_status = "not_implemented"
        bitcoin_behavior = "not_implemented"
        ai_behavior = "not_implemented"
        scenario_contract = Get-CheckStatus -Checks $Checks -Name "node scripts/validate-resource-scenarios.mjs"
        scenario_fixtures = Get-CheckStatus -Checks $Checks -Name "node scripts/validate-resource-scenarios.mjs"
        expected_negative_tests = Get-CheckStatus -Checks $Checks -Name "expected invalid scenario fixture"
        resource_transition = Get-CheckStatus -Checks $Checks -Name "node scripts/validate-resource-transitions.mjs"
        nominal_domain_outcome = Get-CheckStatus -Checks $Checks -Name "nominal resource transition run"
        constraint_domain_outcome = Get-CheckStatus -Checks $Checks -Name "constraint resource transition run"
        expected_invalid_run_tests = Get-CheckStatus -Checks $Checks -Name "expected invalid transition run"
        deterministic_transition_json = Get-CheckStatus -Checks $Checks -Name "deterministic transition JSON comparison"
        scenario_suite_contract = Get-CheckStatus -Checks $Checks -Name "node scripts/validate-scenario-suites.mjs"
        scenario_suite_runner = Get-CheckStatus -Checks $Checks -Name "node scripts/validate-scenario-suites.mjs"
        suite_execution = Get-CheckStatus -Checks $Checks -Name "valid scenario suite run"
        expected_domain_constraints = Get-CheckStatus -Checks $Checks -Name "constraint scenario suite run"
        expected_suite_mismatch_failure = Get-CheckStatus -Checks $Checks -Name "expected suite mismatch run"
        deterministic_suite_json = Get-CheckStatus -Checks $Checks -Name "deterministic suite JSON comparison"
        operational_status_contract = Get-CheckStatus -Checks $Checks -Name "node scripts/validate-operational-status.mjs"
        capability_validation = Get-CheckStatus -Checks $Checks -Name "node src/cli.mjs status --json"
        checks = $Checks
    }
}

function Invoke-Check {
    param(
        [string] $Name,
        [scriptblock] $Action
    )

    $global:LASTEXITCODE = 0
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
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks); exit $checks[-1].exit_code }

            $checks += Invoke-Check -Name "node scripts/validate-operational-pilot.mjs" -Action {
                & node scripts/validate-operational-pilot.mjs
            }
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks); exit $checks[-1].exit_code }

            $checks += Invoke-Check -Name "node scripts/validate-active-tree-boundaries.mjs" -Action {
                & node scripts/validate-active-tree-boundaries.mjs
            }
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks); exit $checks[-1].exit_code }

            $checks += Invoke-Check -Name "node scripts/validate-operational-status.mjs" -Action {
                & node scripts/validate-operational-status.mjs
            }
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks); exit $checks[-1].exit_code }

            $checks += Invoke-Check -Name "node scripts/validate-resource-scenarios.mjs" -Action {
                & node scripts/validate-resource-scenarios.mjs
            }
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks); exit $checks[-1].exit_code }

            $checks += Invoke-Check -Name "node scripts/validate-resource-transitions.mjs" -Action {
                & node scripts/validate-resource-transitions.mjs
            }
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks); exit $checks[-1].exit_code }

            $checks += Invoke-Check -Name "node scripts/validate-scenario-suites.mjs" -Action {
                & node scripts/validate-scenario-suites.mjs
            }
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks); exit $checks[-1].exit_code }

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
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount); exit $checks[-1].exit_code }

            $cliCheck = Invoke-Check -Name "node src/cli.mjs status --json" -Action {
                & node src/cli.mjs status --json
            }
            if ($cliCheck.status -eq "passed") {
                try {
                    $status = ($cliCheck.output -join "`n") | ConvertFrom-Json
                    if ($status.product_name -ne "Orbital Compute Lab" -or
                        $status.implementation_status -ne "controlled_test_range" -or
                        $status.capabilities.resource_scenario_contract -ne $true -or
                        $status.capabilities.resource_scenario_validation -ne $true -or
                        $status.capabilities.deterministic_resource_transition -ne $true -or
                        $status.capabilities.scenario_suite_contract -ne $true -or
                        $status.capabilities.scenario_suite_runner -ne $true -or
                        $status.capabilities.simulation_kernel -ne $false -or
                        $status.capabilities.workload_scheduler -ne $false -or
                        $status.capabilities.bitcoin_workload_model -ne $false -or
                        $status.capabilities.ai_workload_model -ne $false) {
                        $cliCheck.status = "failed"
                        $cliCheck.exit_code = 1
                        $cliCheck.output += "CLI status JSON overstates or mismatches operational-pilot capabilities."
                    }
                } catch {
                    $cliCheck.status = "failed"
                    $cliCheck.exit_code = 1
                    $cliCheck.output += "CLI status JSON could not be parsed."
                }
            }
            $checks += $cliCheck
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount); exit $checks[-1].exit_code }

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
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount); exit $checks[-1].exit_code }

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
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount); exit $checks[-1].exit_code }

            $nominalRun = Invoke-Check -Name "nominal resource transition run" -Action {
                & node src/cli.mjs run-scenario fixtures/runs/nominal-resource-run.v1.json --json
            }
            if ($nominalRun.status -eq "passed") {
                try {
                    $payload = ($nominalRun.output -join "`n") | ConvertFrom-Json
                    if ($payload.ok -ne $true -or $payload.result.outcome -ne "completed") {
                        $nominalRun.status = "failed"
                        $nominalRun.exit_code = 1
                        $nominalRun.output += "Nominal run did not produce completed outcome."
                    }
                } catch {
                    $nominalRun.status = "failed"
                    $nominalRun.exit_code = 1
                    $nominalRun.output += "Nominal run JSON could not be parsed."
                }
            }
            $checks += $nominalRun
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount); exit $checks[-1].exit_code }

            $constraintRun = Invoke-Check -Name "constraint resource transition run" -Action {
                & node src/cli.mjs run-scenario fixtures/runs/energy-deficit.v1.json --json
            }
            if ($constraintRun.status -eq "passed") {
                try {
                    $payload = ($constraintRun.output -join "`n") | ConvertFrom-Json
                    if ($payload.ok -ne $true -or $payload.result.outcome -ne "constraint_violation") {
                        $constraintRun.status = "failed"
                        $constraintRun.exit_code = 1
                        $constraintRun.output += "Constraint run did not produce constraint_violation outcome."
                    }
                } catch {
                    $constraintRun.status = "failed"
                    $constraintRun.exit_code = 1
                    $constraintRun.output += "Constraint run JSON could not be parsed."
                }
            }
            $checks += $constraintRun
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount); exit $checks[-1].exit_code }

            $validSuite = Invoke-Check -Name "valid scenario suite run" -Action {
                & node src/cli.mjs run-suite fixtures/suites/core-resource-regression.v1.json --json
            }
            if ($validSuite.status -eq "passed") {
                try {
                    $payload = ($validSuite.output -join "`n") | ConvertFrom-Json
                    if ($payload.outcome -ne "passed" -or $payload.case_count -ne 2) {
                        $validSuite.status = "failed"
                        $validSuite.exit_code = 1
                        $validSuite.output += "Core suite did not produce passed outcome."
                    }
                } catch {
                    $validSuite.status = "failed"
                    $validSuite.exit_code = 1
                    $validSuite.output += "Core suite JSON could not be parsed."
                }
            }
            $checks += $validSuite
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount); exit $checks[-1].exit_code }

            $constraintSuite = Invoke-Check -Name "constraint scenario suite run" -Action {
                & node src/cli.mjs run-suite fixtures/suites/constraint-regression.v1.json --json
            }
            if ($constraintSuite.status -eq "passed") {
                try {
                    $payload = ($constraintSuite.output -join "`n") | ConvertFrom-Json
                    if ($payload.outcome -ne "passed" -or $payload.case_count -ne 3) {
                        $constraintSuite.status = "failed"
                        $constraintSuite.exit_code = 1
                        $constraintSuite.output += "Constraint suite did not produce passed outcome."
                    }
                } catch {
                    $constraintSuite.status = "failed"
                    $constraintSuite.exit_code = 1
                    $constraintSuite.output += "Constraint suite JSON could not be parsed."
                }
            }
            $checks += $constraintSuite
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount); exit $checks[-1].exit_code }

            $mismatchSuite = Invoke-Check -Name "expected suite mismatch run" -Action {
                $mismatchOutput = & node src/cli.mjs run-suite fixtures/suites/invalid/expectation-mismatch.v1.json --json
                $mismatchCode = $LASTEXITCODE
                $mismatchOutput
                if ($mismatchCode -eq 1 -and (($mismatchOutput -join "`n") -match "outcome_mismatch")) {
                    $global:LASTEXITCODE = 0
                } else {
                    "Expected suite mismatch to exit 1 with outcome_mismatch, got $mismatchCode."
                    $global:LASTEXITCODE = 1
                }
            }
            $checks += $mismatchSuite
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount); exit $checks[-1].exit_code }

            $invalidRun = Invoke-Check -Name "expected invalid transition run" -Action {
                $badOutput = & node src/cli.mjs run-scenario fixtures/scenarios/invalid/malformed-json.v1.json --json
                $badCode = $LASTEXITCODE
                $badOutput
                if ($badCode -eq 1 -and (($badOutput -join "`n") -match "invalid_json")) {
                    $global:LASTEXITCODE = 0
                } else {
                    "Expected malformed run to exit 1 with invalid_json, got $badCode."
                    $global:LASTEXITCODE = 1
                }
            }
            $checks += $invalidRun
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount); exit $checks[-1].exit_code }

            $deterministicRun = Invoke-Check -Name "deterministic transition JSON comparison" -Action {
                $one = & node src/cli.mjs run-scenario fixtures/runs/energy-deficit.v1.json --json
                $codeOne = $LASTEXITCODE
                $two = & node src/cli.mjs run-scenario fixtures/runs/energy-deficit.v1.json --json
                $codeTwo = $LASTEXITCODE
                $three = & node src/cli.mjs run-scenario fixtures/runs/energy-deficit.v1.json --json
                $codeThree = $LASTEXITCODE
                if ($codeOne -eq 0 -and $codeTwo -eq 0 -and $codeThree -eq 0 -and ($one -join "`n") -eq ($two -join "`n") -and ($two -join "`n") -eq ($three -join "`n")) {
                    "deterministic transition output matched across three runs"
                    $global:LASTEXITCODE = 0
                } else {
                    "Transition JSON output was not deterministic."
                    $global:LASTEXITCODE = 1
                }
            }
            $checks += $deterministicRun
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount); exit $checks[-1].exit_code }

            $deterministicSuite = Invoke-Check -Name "deterministic suite JSON comparison" -Action {
                $one = & node src/cli.mjs run-suite fixtures/suites/constraint-regression.v1.json --json
                $codeOne = $LASTEXITCODE
                $two = & node src/cli.mjs run-suite fixtures/suites/constraint-regression.v1.json --json
                $codeTwo = $LASTEXITCODE
                $three = & node src/cli.mjs run-suite fixtures/suites/constraint-regression.v1.json --json
                $codeThree = $LASTEXITCODE
                if ($codeOne -eq 0 -and $codeTwo -eq 0 -and $codeThree -eq 0 -and ($one -join "`n") -eq ($two -join "`n") -and ($two -join "`n") -eq ($three -join "`n")) {
                    "deterministic suite output matched across three runs"
                    $global:LASTEXITCODE = 0
                } else {
                    "Suite JSON output was not deterministic."
                    $global:LASTEXITCODE = 1
                }
            }
            $checks += $deterministicSuite
            if ($checks[-1].status -eq "failed") { ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount); exit $checks[-1].exit_code }

            ConvertTo-StatusJson (New-Summary -CommandName "verify" -Checks $checks -TestCount $testCount)
            exit 0
        }
        "help" {
            "Usage: .\eng.ps1 bootstrap | verify | help"
            "bootstrap: checks Git, PowerShell, Node.js 22+, and legacy-source documentation without installing dependencies or creating artifacts."
            "verify: runs bootstrap, git diff --check, operational-pilot validation, active-tree boundary validation, operational-status validation, resource-scenario validation, resource-transition validation, node --test, status CLI, representative scenario CLI checks, and representative transition CLI checks."
            "No simulation kernel, scheduler, Bitcoin, AI, wallet, trading, network, hardware, or mission-authority behavior is verified or implemented."
            exit 0
        }
    }
} finally {
    $env:NODE_OPTIONS = $OriginalNodeOptions
    Set-Location -LiteralPath $OriginalLocation
}
