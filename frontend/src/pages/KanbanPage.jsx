import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

const STAGES = [
  { key: 'new_lead', label: 'New Lead', color: '#6366f1' },
  { key: 'contacted', label: 'Contacted', color: '#3b82f6' },
  { key: 'qualified', label: 'Qualified', color: '#8b5cf6' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: '#f59e0b' },
  { key: 'follow_up', label: 'Follow Up', color: '#f97316' },
  { key: 'meeting_done', label: 'Meeting Done', color: '#06b6d4' },
  { key: 'contract_signed', label: 'Contract Signed', color: '#10b981' },
  { key: 'active_client', label: 'Active Client', color: '#059669' },
  { key: 'not_interested', label: 'Not Interested', color: '#64748b' },
  { key: 'lost', label: 'Lost', color: '#ef4444' },
];

const SOURCE_ICONS = {
  'Referral': '🤝', 'LinkedIn': '💼', 'Website': '🌐', 'Cold Call': '📞',
  'Event': '🎯', 'Partner': '🏢', 'Other': '📌',
};

function LeadCard({ lead, index, onClick }) {
  return (
    <Draggable draggableId={String(lead.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(lead.id)}
          style={{
            background: '#fff', borderRadius: 10, padding: '12px 14px', marginBottom: 8,
            boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.08)',
            cursor: 'pointer', transition: 'box-shadow 0.15s', userSelect: 'none',
            ...provided.draggableProps.style,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e', marginBottom: 4 }}>
            {lead.full_name}
          </div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{lead.phone}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#888' }}>
              {SOURCE_ICONS[lead.source] || '📌'} {lead.source}
            </span>
            {lead.assigned_to_name && (
              <span style={{
                background: '#f0f4ff', color: NAVY, borderRadius: 20,
                padding: '2px 8px', fontSize: 10, fontWeight: 500,
              }}>
                {lead.assigned_to_name.split(' ')[0]}
              </span>
            )}
          </div>
          {lead.budget && (
            <div style={{ fontSize: 11, color: GOLD, fontWeight: 600, marginTop: 4 }}>
              AED {Number(lead.budget).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default function KanbanPage() {
  const navigate = useNavigate();
  const [board, setBoard] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchBoard = async () => {
    try {
      const { data } = await api.get('/api/leads/kanban');
      setBoard(data);
    } catch {
      toast.error('Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBoard(); }, []);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const srcStage = source.droppableId;
    const dstStage = destination.droppableId;
    const leadId = parseInt(draggableId);

    const newBoard = { ...board };
    const srcList = [...(newBoard[srcStage] || [])];
    const dstList = srcStage === dstStage ? srcList : [...(newBoard[dstStage] || [])];
    const [moved] = srcList.splice(source.index, 1);
    moved.stage = dstStage;
    dstList.splice(destination.index, 0, moved);

    setBoard({
      ...newBoard,
      [srcStage]: srcList,
      [dstStage]: dstList,
    });

    try {
      await api.patch(`/api/leads/${leadId}/stage`, { stage: dstStage });
    } catch {
      toast.error('Failed to update stage');
      fetchBoard();
    }
  };

  if (loading) return <div style={{ padding: 40, color: '#888' }}>Loading pipeline...</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Pipeline</h1>
        <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Drag and drop leads across stages</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ overflowX: 'auto', overflowY: 'hidden', width: '100%', height: 'calc(100vh - 220px)', paddingBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, minWidth: 'max-content', height: '100%' }}>
          {STAGES.map(stage => {
            const leads = board[stage.key] || [];
            return (
              <div key={stage.key} style={{ minWidth: 240, maxWidth: 260, flex: '0 0 240px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{
                  background: stage.color, color: '#fff', borderRadius: '10px 10px 0 0',
                  padding: '10px 14px', display: 'flex', justifyContent: 'space-between',
                }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{stage.label}</span>
                  <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 20, padding: '1px 8px', fontSize: 12 }}>
                    {leads.length}
                  </span>
                </div>

                <Droppable droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        flex: 1, padding: 8, overflowY: 'auto',
                        background: snapshot.isDraggingOver ? '#e8eeff' : '#f5f6fa',
                        borderRadius: '0 0 10px 10px',
                        border: `1px solid ${snapshot.isDraggingOver ? stage.color : '#e0e0e0'}`,
                        borderTop: 'none', transition: 'background 0.15s',
                      }}
                    >
                      {leads.map((lead, i) => (
                        <LeadCard key={lead.id} lead={lead} index={i} onClick={id => navigate(`/crm/leads/${id}`)} />
                      ))}
                      {provided.placeholder}
                      {leads.length === 0 && !snapshot.isDraggingOver && (
                        <div style={{ textAlign: 'center', color: '#ccc', padding: '20px 0', fontSize: 12 }}>
                          Drop here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
        </div>
      </DragDropContext>
    </div>
  );
}
