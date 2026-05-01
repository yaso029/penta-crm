import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import api from '../../api';

const STATUS_COLORS = { available: '#16a34a', reserved: '#f59e0b', sold: '#dc2626' };

function formatPrice(price) {
  if (!price) return 'Price on Request';
  if (price >= 1000000) return `AED ${(price / 1000000).toFixed(2)}M`;
  if (price >= 1000) return `AED ${(price / 1000).toFixed(0)}K`;
  return `AED ${price.toLocaleString()}`;
}

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prop, setProp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get(`/api/agents/properties/${id}`)
      .then(r => setProp(r.data))
      .catch(() => navigate('/agents/properties'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this property? This cannot be undone.')) return;
    setDeleting(true);
    await api.delete(`/api/agents/properties/${id}`);
    navigate('/agents/properties');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading...</div>;
  if (!prop) return null;

  const images = prop.images || [];
  const canEdit = user?.role === 'admin' || prop.uploaded_by === user?.id;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/agents/properties')}
          style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#555' }}
        >
          ← Back
        </button>
        {canEdit && (
          <button
            onClick={() => navigate(`/agents/list-property?edit=${id}`)}
            style={{ background: '#0A2342', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            Edit
          </button>
        )}
        {user?.role === 'admin' && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        {/* Image Gallery */}
        {images.length > 0 ? (
          <div style={{ position: 'relative' }}>
            <div style={{ height: 420, overflow: 'hidden', background: '#f1f5f9' }}>
              <img
                src={images[imgIdx]}
                alt={prop.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                  style={{
                    position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none',
                    borderRadius: '50%', width: 40, height: 40, fontSize: 18, cursor: 'pointer',
                  }}
                >‹</button>
                <button
                  onClick={() => setImgIdx(i => (i + 1) % images.length)}
                  style={{
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none',
                    borderRadius: '50%', width: 40, height: 40, fontSize: 18, cursor: 'pointer',
                  }}
                >›</button>
                <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                  {images.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setImgIdx(i)}
                      style={{
                        width: i === imgIdx ? 20 : 8, height: 8, borderRadius: 4,
                        background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    />
                  ))}
                </div>
              </>
            )}
            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', background: '#f8fafc' }}>
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    onClick={() => setImgIdx(i)}
                    style={{
                      width: 72, height: 52, objectFit: 'cover', borderRadius: 6, cursor: 'pointer',
                      border: i === imgIdx ? '2px solid #dc2626' : '2px solid transparent',
                      flexShrink: 0, transition: 'border-color 0.15s',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ height: 240, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: '#cbd5e1' }}>🏢</div>
        )}

        <div style={{ padding: '28px 32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ background: prop.transaction_type === 'For Sale' ? '#0A2342' : '#0891b2', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                  {prop.transaction_type}
                </span>
                <span style={{ background: STATUS_COLORS[prop.status] || '#888', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                  {prop.status?.charAt(0).toUpperCase() + prop.status?.slice(1)}
                </span>
                <span style={{ background: '#f1f5f9', color: '#555', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                  {prop.property_type}
                </span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', margin: 0, lineHeight: 1.2 }}>{prop.title}</h1>
              <div style={{ fontSize: 14, color: '#888', marginTop: 8 }}>📍 {prop.location}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#dc2626' }}>{formatPrice(prop.price)}</div>
              {prop.area_sqft && prop.price && (
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  AED {Math.round(prop.price / prop.area_sqft).toLocaleString()}/sqft
                </div>
              )}
            </div>
          </div>

          {/* Key specs */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', background: '#f8fafc', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
            {prop.bedrooms !== null && prop.bedrooms !== undefined && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22 }}>🛏</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{prop.bedrooms === 0 ? 'Studio' : prop.bedrooms}</div>
                <div style={{ fontSize: 11, color: '#888' }}>Bedrooms</div>
              </div>
            )}
            {prop.bathrooms && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22 }}>🚿</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{prop.bathrooms}</div>
                <div style={{ fontSize: 11, color: '#888' }}>Bathrooms</div>
              </div>
            )}
            {prop.area_sqft && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22 }}>📐</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{prop.area_sqft.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#888' }}>Sqft</div>
              </div>
            )}
            {prop.floor && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22 }}>🏗</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>Floor {prop.floor}</div>
                <div style={{ fontSize: 11, color: '#888' }}>Level</div>
              </div>
            )}
          </div>

          {/* Details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Property Details</div>
              {[
                { label: 'Developer', value: prop.developer },
                { label: 'Project', value: prop.project_name },
                { label: 'Handover', value: prop.handover_date },
                { label: 'Listed by', value: prop.uploader_name },
              ].map(({ label, value }) => value && (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 13, color: '#888' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{value}</span>
                </div>
              ))}
            </div>

            {prop.amenities?.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Amenities</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {prop.amenities.map(a => (
                    <span key={a} style={{ background: '#f1f5f9', color: '#555', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
                      ✓ {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {prop.description && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Description</div>
              <div style={{ fontSize: 14, color: '#444', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{prop.description}</div>
            </div>
          )}

          {prop.payment_plan && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Payment Plan</div>
              <div style={{ fontSize: 14, color: '#444', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#f8fafc', borderRadius: 8, padding: '14px 16px' }}>{prop.payment_plan}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
