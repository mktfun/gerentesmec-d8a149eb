-- Tabela de Logs de Importação
CREATE TABLE IF NOT EXISTS public.notion_import_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    snapshot_hash TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'error', 'skipped_no_changes'
    imported_rows INTEGER DEFAULT 0
);

-- Tabela de Agendamentos do Notion
CREATE TABLE IF NOT EXISTS public.agendamentos (
    notion_page_id TEXT PRIMARY KEY,
    unidade TEXT NOT NULL,
    titulo TEXT,
    placa TEXT,
    horario TEXT,
    data_agendamento DATE,
    telefone TEXT,
    compareceu BOOLEAN DEFAULT false,
    os BOOLEAN DEFAULT false,
    desmarcou BOOLEAN DEFAULT false,
    reagendou BOOLEAN DEFAULT false,
    mensagem_enviada BOOLEAN DEFAULT false,
    responsavel TEXT,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Service Role ignora RLS)
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notion_import_runs ENABLE ROW LEVEL SECURITY;
