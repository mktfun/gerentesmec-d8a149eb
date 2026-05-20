import React from 'react';
import { Lead, FunnelStage } from '@/data/mockData';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import KanbanCard from './KanbanCard';

const COLUMNS: { id: FunnelStage; label: string; color: string; dot: string }[] = [
  { id: 'new',         label: 'Novo Lead',     color: 'text-indigo-600 dark:text-indigo-400',   dot: 'bg-indigo-500' },
  { id: 'quote',       label: 'Em Orçamento',  color: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500' },
  { id: 'negotiation', label: 'Em Negociação', color: 'text-orange-600 dark:text-orange-400',   dot: 'bg-orange-500' },
  { id: 'closed_won',  label: 'Encerrado',     color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
];

interface Props {
  leads: Lead[];
  unitFilter: string;
  onSelectLead: (lead: Lead) => void;
  onDragEnd: (result: DropResult) => void;
}

const KanbanView: React.FC<Props> = ({ leads, unitFilter, onSelectLead, onDragEnd }) => {
  const filtered = unitFilter === 'all'
    ? leads
    : leads.filter(l => l.unit_id === unitFilter);

  const getColumnLeads = (stageId: FunnelStage) => {
    if (stageId === 'closed_won') {
      return filtered.filter(l => l.funnel_stage === 'closed_won' || l.funnel_stage === 'closed_lost');
    }
    return filtered.filter(l => l.funnel_stage === stageId);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colLeads = getColumnLeads(col.id);
          return (
            <div key={col.id} className="w-72 shrink-0 flex flex-col gap-3 bg-muted/20 p-2 rounded-2xl border border-border">
              {/* Column header */}
              <div className="flex items-center gap-2 px-2 py-1">
                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                  {col.label}
                </span>
                <span className="text-xs font-bold text-muted-foreground bg-background border border-border
                  px-2 py-0.5 rounded-full ml-auto shadow-sm">{colLeads.length}</span>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto px-1 pb-4 space-y-2.5 transition-colors rounded-xl
                      ${snapshot.isDraggingOver ? 'bg-primary/5 border border-primary/20 border-dashed' : ''}
                    `}
                    style={{ minHeight: '150px' }}
                  >
                    {colLeads.map((lead, i) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={i}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1,
                            }}
                          >
                            <KanbanCard lead={lead} onClick={() => onSelectLead(lead)} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {colLeads.length === 0 && !snapshot.isDraggingOver && (
                      <div className="h-20 rounded-xl border border-dashed border-border flex items-center justify-center m-1">
                        <span className="text-xs text-muted-foreground/50">Solte cards aqui</span>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default KanbanView;
