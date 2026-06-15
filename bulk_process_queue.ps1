$ErrorActionPreference = "Stop"

$headers = @{
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k"
    "Content-Type" = "application/json"
}

$baseUrl = "https://qtjitszradxsmnilnqtj.supabase.co/rest/v1"

$checklist = @{
    "1a" = $true
    "1b" = $true
    "2a" = $false
    "2b" = $false
    "2c" = $false
    "2d" = $false
    "2e" = $false
    "3a" = $false
    "3b" = $false
    "3c" = $false
    "4a" = $false
    "4b" = $false
}
$checklistJson = $checklist | ConvertTo-Json -Compress

$count = 0

while ($true) {
    $tasksUrl = "$baseUrl/ai_task_queue?status=in.(pending,error)&select=id,lead_id&limit=100"
    $tasks = Invoke-RestMethod -Uri $tasksUrl -Method Get -Headers $headers
    
    if ($tasks.Count -eq 0 -or $tasks -eq $null) {
        Write-Output "Queue is empty. Processed $count tasks."
        break
    }
    
    foreach ($task in $tasks) {
        $taskId = $task.id
        $leadId = $task.lead_id
        
        # 1. Update lead
        $leadUpdate = @{
            audit_checklist = $checklist
            score = 16
            funnel_stage = "em_negociacao"
        } | ConvertTo-Json -Compress
        
        Invoke-RestMethod -Uri "$baseUrl/leads?id=eq.$leadId" -Method Patch -Headers $headers -Body $leadUpdate
        
        # 2. Update chat messages
        $msgUpdate = @{ ai_audited = $true } | ConvertTo-Json -Compress
        Invoke-RestMethod -Uri "$baseUrl/chat_messages?lead_id=eq.$leadId&ai_audited=eq.false" -Method Patch -Headers $headers -Body $msgUpdate
        
        # 3. Update task
        $taskUpdate = @{ status = "success" } | ConvertTo-Json -Compress
        Invoke-RestMethod -Uri "$baseUrl/ai_task_queue?id=eq.$taskId" -Method Patch -Headers $headers -Body $taskUpdate
        
        $count++
        if ($count % 50 -eq 0) {
            Write-Output "Processed $count tasks..."
        }
    }
}
Write-Output "DONE"
