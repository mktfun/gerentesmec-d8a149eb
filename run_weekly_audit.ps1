# Script de Agendamento Semanal da Auditoria
$toDate = (Get-Date).ToString('yyyy-MM-dd')
$fromDate = (Get-Date).AddDays(-7).ToString('yyyy-MM-dd')
$auditName = "Auditoria_Semanal_$toDate"

Write-Host "========================================="
Write-Host "INICIANDO AUDITORIA AUTOMÁTICA DE SEXTA"
Write-Host "Período: $fromDate até $toDate"
Write-Host "========================================="

Set-Location -Path "C:\Users\admin\.gemini\antigravity\scratch\gerentesmec"

# Executa o Pipeline Mestre
node run_pipeline.mjs --from=$fromDate --to=$toDate --name=$auditName

Write-Host "Fim da execução."
