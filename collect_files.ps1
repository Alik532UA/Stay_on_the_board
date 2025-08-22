# PowerShell Script to Collect Bug-Related Files

$outputFile = "bug_context.txt"
$filesToCollect = @(
    "src/lib/stores/settingsStore.ts",
    "src/lib/stores/uiEffectsStore.ts",
    "src/lib/components/widgets/BoardWrapperWidget.svelte",
    "src/lib/components/GameModeModal.svelte",
    "docs/elements/checkbox-auto-hide-board.md",
    "src/lib/stores/gameState.js"
)

# Clear the output file if it exists
if (Test-Path $outputFile) {
    Clear-Content $outputFile
}

foreach ($file in $filesToCollect) {
    if (Test-Path $file) {
        Add-Content $outputFile "==== START OF FILE: $file ===="
        Add-Content $outputFile (Get-Content $file | Out-String)
        Add-Content $outputFile "==== END OF FILE: $file ====`n`n"
    } else {
        Add-Content $outputFile "==== FILE NOT FOUND: $file ====`n`n"
    }
}

Write-Host "File collection complete. Output written to $outputFile"