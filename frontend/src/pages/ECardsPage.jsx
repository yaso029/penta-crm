import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

function downloadVCard(card) {
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${card.full_name}`,
    card.job_title ? `TITLE:${card.job_title}` : '',
    card.phone ? `TEL;TYPE=CELL:${card.phone}` : '',
    card.whatsapp && card.whatsapp !== card.phone ? `TEL;TYPE=WORK:${card.whatsapp}` : '',
    card.email ? `EMAIL:${card.email}` : '',
    card.website ? `URL:${card.website}` : '',
    'ORG:Penta Real Estate',
    'END:VCARD',
  ].filter(Boolean).join('\n');
  const blob = new Blob([lines], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${card.full_name.replace(/\s+/g, '_')}.vcf`; a.click();
  URL.revokeObjectURL(url);
}

function shareCard(url) {
  if (navigator.share) {
    navigator.share({ title: 'Penta Real Estate', url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => alert('Link copied!'));
  }
}

function PhoneIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;
}
function MailIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}
function WAIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
}

function CardFull({ card }) {
  const cardUrl = `${window.location.origin}/card/${card.slug}`;
  const initials = card.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 32px rgba(10,35,66,0.12)' }}>
      {/* Banner */}
      <div style={{ height: 110, background: `linear-gradient(130deg, ${NAVY} 0%, #1a3a5f 60%, #0f2a4a 100%)`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(201,168,76,0.12)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD} 30%, #f0d98a 50%, ${GOLD} 70%, transparent)` }} />
        <div style={{ position: 'absolute', top: 18, left: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${GOLD}, #f0d98a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: NAVY }}>P</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>Penta Real Estate</div>
            <div style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(201,168,76,0.85)', textTransform: 'uppercase' }}>Dubai · UAE</div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: -38, left: 22 }}>
          {card.photo_url ? (
            <img src={card.photo_url} alt="" style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }} />
          ) : (
            <div style={{ width: 76, height: 76, borderRadius: '50%', background: `linear-gradient(135deg, ${NAVY}, #1e3a5f)`, border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: GOLD, boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }}>{initials}</div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '52px 24px 20px' }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: NAVY, letterSpacing: '-0.5px' }}>{card.full_name}</div>
        {card.job_title && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: GOLD, marginTop: 5, marginBottom: 18 }}>{card.job_title}</div>}
        <div style={{ height: 1, background: '#f0f0f0', marginBottom: 16 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {card.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: NAVY }}><PhoneIcon /></div>
              <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{card.phone}</span>
            </div>
          )}
          {card.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: NAVY }}><MailIcon /></div>
              <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{card.email}</span>
            </div>
          )}
          {card.whatsapp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366' }}><WAIcon /></div>
              <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{card.whatsapp}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', background: '#f8f9fc', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => downloadVCard(card)} style={{ padding: '9px 14px', borderRadius: 9, border: 'none', background: NAVY, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>💾 Save Contact</button>
          <button onClick={() => shareCard(cardUrl)} style={{ padding: '9px 14px', borderRadius: 9, border: `1.5px solid #e0e4ec`, background: '#fff', color: NAVY, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>↗ Share</button>
        </div>
        <a href={cardUrl} target="_blank" rel="noreferrer" style={{ background: '#fff', borderRadius: 8, padding: 5, border: '1px solid #f0f0f0', display: 'block' }}>
          <QRCodeSVG value={cardUrl} size={56} fgColor={NAVY} bgColor="#ffffff" level="M" />
        </a>
      </div>
    </div>
  );
}

function CardMini({ card }) {
  const cardUrl = `${window.location.origin}/card/${card.slug}`;
  const initials = card.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(10,35,66,0.14)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
      onClick={() => window.open(cardUrl, '_blank')}
    >
      <div style={{ height: 5, background: `linear-gradient(90deg, ${NAVY}, ${GOLD})` }} />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          {card.photo_url ? (
            <img src={card.photo_url} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GOLD}44`, flexShrink: 0 }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${NAVY}, #1e3a5f)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: GOLD, flexShrink: 0 }}>{initials}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.full_name}</div>
            {card.job_title && <div style={{ fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>{card.job_title}</div>}
          </div>
        </div>
        {card.phone && <div style={{ fontSize: 11, color: '#666', marginBottom: 3 }}>📱 {card.phone}</div>}
        {card.email && <div style={{ fontSize: 11, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✉️ {card.email}</div>}
        <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
          <button onClick={e => { e.stopPropagation(); downloadVCard(card); }} style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: 'none', background: '#f4f6fb', color: NAVY, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>💾 Save</button>
          <button onClick={e => { e.stopPropagation(); shareCard(cardUrl); }} style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: 'none', background: '#f4f6fb', color: '#555', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>↗ Share</button>
        </div>
      </div>
    </div>
  );
}

export default function ECardsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/ecards').then(r => setCards(r.data)).finally(() => setLoading(false));
  }, []);

  const myCard = cards.find(c => c.is_mine);
  const teamCards = cards.filter(c => !c.is_mine && c.is_active);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Header */}
      <div style={{ background: '#0d1728', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', padding: '7px 14px' }}>← Home</button>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>E-Business Cards</div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Penta Real Estate</div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#aaa' }}>Loading cards…</div>
        ) : (
          <>
            {/* My Card */}
            {myCard ? (
              <div style={{ marginBottom: 48 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Your Card</div>
                <div style={{ maxWidth: 420 }}>
                  <CardFull card={myCard} />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 48, background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', maxWidth: 420 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>💳</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>No card yet</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Contact HR to create your E-business card.</div>
              </div>
            )}

            {/* Team Cards */}
            {teamCards.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Team Cards</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {teamCards.map(card => <CardMini key={card.id} card={card} />)}
                </div>
              </div>
            )}

            {cards.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: NAVY }}>No E-cards yet</div>
                <div style={{ fontSize: 14, color: '#888', marginTop: 6 }}>HR admin will create digital cards for the team.</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
