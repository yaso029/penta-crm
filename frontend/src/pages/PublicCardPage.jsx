import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const BASE = import.meta.env.VITE_API_URL || 'https://penta-crm-production.up.railway.app';
const NAVY = '#0A2342';
const GOLD = '#C9A84C';

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

function downloadVCard(card) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${card.full_name}`,
    card.job_title ? `TITLE:${card.job_title}` : '',
    card.phone ? `TEL;TYPE=CELL:${card.phone}` : '',
    card.whatsapp && card.whatsapp !== card.phone ? `TEL;TYPE=WORK:${card.whatsapp}` : '',
    card.email ? `EMAIL:${card.email}` : '',
    card.website ? `URL:${card.website}` : '',
    'ORG:Penta Real Estate',
    card.photo_url ? `PHOTO;VALUE=URL:${card.photo_url}` : '',
    'END:VCARD',
  ].filter(Boolean).join('\n');

  const blob = new Blob([lines], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${card.full_name.replace(/\s+/g, '_')}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}

function shareCard(cardUrl) {
  if (navigator.share) {
    navigator.share({ title: 'Penta Real Estate', url: cardUrl }).catch(() => {});
  } else {
    navigator.clipboard.writeText(cardUrl).then(() => alert('Link copied!'));
  }
}

export default function PublicCardPage() {
  const { slug } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const cardUrl = window.location.href;

  useEffect(() => {
    fetch(`${BASE}/api/ecards/public/${slug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setCard)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#888', fontSize: 14 }}>Loading…</div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: NAVY }}>Card not found</div>
      <div style={{ fontSize: 14, color: '#888' }}>This card may have been removed or the link is incorrect.</div>
    </div>
  );

  const initials = card.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 60px rgba(10,35,66,0.18)' }}>

          {/* Banner */}
          <div style={{ height: 110, background: `linear-gradient(130deg, ${NAVY} 0%, #1a3a5f 60%, #0f2a4a 100%)`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(201,168,76,0.12)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD} 30%, #f0d98a 50%, ${GOLD} 70%, transparent)` }} />

            {/* Logo */}
            <div style={{ position: 'absolute', top: 18, left: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${GOLD}, #f0d98a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: NAVY }}>P</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>Penta Real Estate</div>
                <div style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(201,168,76,0.85)', textTransform: 'uppercase' }}>Dubai · UAE</div>
              </div>
            </div>

            {/* Avatar */}
            <div style={{ position: 'absolute', bottom: -38, left: 22 }}>
              {card.photo_url ? (
                <img src={card.photo_url} alt={card.full_name} style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }} />
              ) : (
                <div style={{ width: 76, height: 76, borderRadius: '50%', background: `linear-gradient(135deg, ${NAVY}, #1e3a5f)`, border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: GOLD, boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }}>
                  {initials}
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '52px 24px 22px' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: NAVY, letterSpacing: '-0.5px' }}>{card.full_name}</div>
            {card.job_title && (
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: GOLD, marginTop: 5, marginBottom: 20 }}>{card.job_title}</div>
            )}

            <div style={{ height: 1, background: '#f0f0f0', marginBottom: 18 }} />

            {/* Contact rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 22 }}>
              {card.phone && (
                <a href={`tel:${card.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: NAVY, flexShrink: 0 }}>
                    <PhoneIcon />
                  </div>
                  <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{card.phone}</span>
                </a>
              )}
              {card.email && (
                <a href={`mailto:${card.email}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: NAVY, flexShrink: 0 }}>
                    <MailIcon />
                  </div>
                  <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{card.email}</span>
                </a>
              )}
              {card.whatsapp && (
                <a href={`https://wa.me/${card.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366', flexShrink: 0 }}>
                    <WhatsAppIcon />
                  </div>
                  <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{card.whatsapp}</span>
                </a>
              )}
              {card.website && (
                <a href={card.website.startsWith('http') ? card.website : `https://${card.website}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: NAVY, flexShrink: 0 }}>
                    <GlobeIcon />
                  </div>
                  <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{card.website}</span>
                </a>
              )}
              {card.linkedin && (
                <a href={card.linkedin.startsWith('http') ? card.linkedin : `https://${card.linkedin}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0077b5', flexShrink: 0 }}>
                    <LinkedInIcon />
                  </div>
                  <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>LinkedIn</span>
                </a>
              )}
            </div>
          </div>

          {/* Footer: buttons + QR */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: '#f8f9fc', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => downloadVCard(card)} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: NAVY, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Contact
              </button>
              <button onClick={() => shareCard(cardUrl)} style={{ padding: '10px 14px', borderRadius: 10, border: `1.5px solid #e0e4ec`, background: '#fff', color: NAVY, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Share
              </button>
            </div>
            <div style={{ background: '#fff', borderRadius: 8, padding: 6, border: '1px solid #f0f0f0' }}>
              <QRCodeSVG value={cardUrl} size={60} fgColor={NAVY} bgColor="#ffffff" level="M" />
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#bbb' }}>
          Powered by Penta System
        </div>
      </div>
    </div>
  );
}
