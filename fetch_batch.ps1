$ErrorActionPreference = "Stop"

$supabaseUrl = $env:VITE_SUPABASE_URL
$supabaseKey = $env:VITE_SUPABASE_SERVICE_ROLE_KEY
if (-not $supabaseKey) { $supabaseKey = $env:VITE_SUPABASE_ANON_KEY }

$headers = @{
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k"
}

$tasksUrl = "https://qtjitszradxsmnilnqtj.supabase.co/rest/v1/ai_task_queue?status=in.(pending,error)&select=id,lead_id&limit=5"
$tasks = Invoke-RestMethod -Uri $tasksUrl -Method Get -Headers $headers

if ($tasks.Count -eq 0 -or $tasks -eq $null) {
    Write-Output "NO_TASKS"
    exit
}

$result = @()
foreach ($task in $tasks) {
    $leadId = $task.lead_id
    $msgsUrl = "https://qtjitszradxsmnilnqtj.supabase.co/rest/v1/chat_messages?lead_id=eq.$leadId&order=created_at.asc"
    $messages = Invoke-RestMethod -Uri $msgsUrl -Method Get -Headers $headers
    
    $result += @{
        task_id = $task.id
        lead_id = $leadId
        messages = $messages
    }
}

$result | ConvertTo-Json -Depth 10 | Set-Content "batch_tasks.json"
Write-Output "BATCH_READY"
