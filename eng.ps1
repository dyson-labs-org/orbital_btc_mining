[CmdletBinding()]
param(
    [ValidateSet("bootstrap", "verify", "help")]
    [string] $Command = "help"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function New-Summary {
    param(
        [string] $CommandName,
        [array] $Checks
    )

    [ordered]@{
        command = $CommandName
        charter_status = "incubation"
        legacy_source = "not_run"
        external_calls = "none"
        product_implementation = "not_started"
        checks = $Checks
    }
}

function Write-Summary {
    param([hashtable] $Summary)
    $Summary | ConvertTo-Json -Depth 6
}

function Invoke-Check {
    param(
        [string] $Name,
        [scriptblock] $Action
    )

    $output = @(& $Action 2>&1 | ForEach-Object { "$_" })
    $code = if ($null -eq $LASTEXITCODE) { 0 } else { $LASTEXITCODE }
    if ($code -ne 0) {
        return [ordered]@{
            name = $Name
            status = "failed"
            exit_code = $code
            output = $output
        }
    }

    [ordered]@{
        name = $Name
        status = "passed"
        exit_code = 0
        output = $output
    }
}

switch ($Command) {
    "bootstrap" {
        $checks = @(
            [ordered]@{
                name = "bootstrap"
                status = "noop"
                exit_code = 0
                notes = "No artifacts, package installs, network calls, or legacy commands are run."
            },
            [ordered]@{
                name = "legacy_source"
                status = "not_run"
                exit_code = 0
            },
            [ordered]@{
                name = "external_calls"
                status = "empty"
                exit_code = 0
            }
        )
        Write-Summary (New-Summary -CommandName "bootstrap" -Checks $checks)
        exit 0
    }
    "verify" {
        $checks = @()

        $checks += Invoke-Check -Name "git diff --check" -Action {
            & git diff --check
        }
        if ($checks[-1].status -eq "failed") {
            Write-Summary (New-Summary -CommandName "verify" -Checks $checks)
            exit $checks[-1].exit_code
        }

        $checks += Invoke-Check -Name "node scripts/validate-incubation-charter.mjs" -Action {
            & node scripts/validate-incubation-charter.mjs
        }
        if ($checks[-1].status -eq "failed") {
            Write-Summary (New-Summary -CommandName "verify" -Checks $checks)
            exit $checks[-1].exit_code
        }

        $checks += Invoke-Check -Name "node --test tests/incubation-charter.test.mjs" -Action {
            & node --test tests/incubation-charter.test.mjs
        }
        if ($checks[-1].status -eq "failed") {
            Write-Summary (New-Summary -CommandName "verify" -Checks $checks)
            exit $checks[-1].exit_code
        }

        $checks += [ordered]@{
            name = "legacy_source"
            status = "not_run"
            exit_code = 0
        }
        $checks += [ordered]@{
            name = "external_calls"
            status = "empty"
            exit_code = 0
        }

        Write-Summary (New-Summary -CommandName "verify" -Checks $checks)
        exit 0
    }
    "help" {
        "Usage: .\eng.ps1 bootstrap | verify | help"
        "bootstrap: report incubation readiness without creating artifacts, installing packages, calling networks, or running legacy commands."
        "verify: run git diff --check, the charter validator, and built-in Node.js tests."
        exit 0
    }
}
