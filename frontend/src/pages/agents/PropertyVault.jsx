import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api';

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Plot', 'Office', 'Retail'];
const TRANSACTION_TYPES = ['For Sale', 'For Rent'];
const BEDROOM_OPTIONS = [{ label: 'Studio', value: 0 }, { label: '1', value: 1 }, { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 }, { label: '5+', value: 5 }];
const STATUS_COLORS = { available: '#16a34a', reserved: '#f59e0b', sold: '#dc2626' };

function formatPrice(price) {
  if (!price) return 'Price on Request';
  if (price >= 1000000) return `AED ${(price / 1000000).toFixed(2)}M`;
  if (price >= 1000) return `AED ${(price / 1000).toFixed(0)}K`;
  return `AED ${price.toLocaleString()}`;
}

function PropertyCard({ prop, onClick }) {
  const img = prop.images?.[0];
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)', cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.14)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)';
      }}
    >
      <div style={{ height: 180, background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
        {img
          ? <img src={img} alt={prop.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#cbd5e1' }}>🏢</div>
        }
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: prop.transaction_type === 'For Sale' ? '#0A2342' : '#0891b2',
          color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {prop.transaction_type}
        </div>
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: STATUS_COLORS[prop.status] || '#888',
          color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {prop.status}
        </div>
        {prop.images?.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            fontSize: 11, padding: '2px 7px', borderRadius: 12,
          }}>
            📷 {prop.images.length}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, lineHeight: 1.3 }}>
          {prop.title}
        </div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
          📍 {prop.location}
          {prop.developer && <span> · {prop.developer}</span>}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          {prop.bedrooms !== null && prop.bedrooms !== undefined && (
            <span style={{ fontSize: 12, color: '#555' }}>
              🛏 {prop.bedrooms === 0 ? 'Studio' : `${prop.bedrooms} BR`}
            </span>
          )}
          {prop.bathrooms && <span style={{ fontSize: 12, color: '#555' }}>🚿 {prop.bathrooms} BA</span>}
          {prop.area_sqft && <span style={{ fontSize: 12, color: '#555' }}>📐 {prop.area_sqft.toLocaleString()} sqft</span>}
          <span style={{ fontSize: 12, color: '#888' }}>{prop.property_type}</span>
        </div>

        <div style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>
          {formatPrice(prop.price)}
        </div>
      </div>
    </div>
  );
}

export default function PropertyVault() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    property_type: '',
    transaction_type: searchParams.get('transaction') || '',
    status: searchParams.get('status') || '',
    bedrooms: '',
  });

  const fetchProperties = () => {
    setLoading(true);
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.property_type) params.property_type = filters.property_type;
    if (filters.transaction_type) params.transaction_type = filters.transaction_type;
    if (filters.status) params.status = filters.status;
    if (filters.bedrooms !== '') params.bedrooms = filters.bedrooms;

    api.get('/api/agents/properties', { params })
      .then(r => setProperties(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProperties(); }, [filters]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const filterStyle = (active) => ({
    padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
    background: active ? '#0A2342' : '#f1f5f9', color: active ? '#fff' : '#555',
    transition: 'all 0.15s',
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>Property Vault</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{properties.length} properties</div>
        </div>
        <button
          onClick={() => navigate('/agents/list-property')}
          style={{
            padding: '10px 20px', background: '#dc2626', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          + List Property
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <input
          placeholder="Search by title, location, developer, project..."
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
            borderRadius: 8, fontSize: 14, marginBottom: 14, boxSizing: 'border-box', outline: 'none',
          }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: '#888', fontWeight: 600, alignSelf: 'center' }}>Type:</span>
          <button style={filterStyle(!filters.property_type)} onClick={() => setFilter('property_type', '')}>All</button>
          {PROPERTY_TYPES.map(t => (
            <button key={t} style={filterStyle(filters.property_type === t)} onClick={() => setFilter('property_type', filters.property_type === t ? '' : t)}>{t}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: '#888', fontWeight: 600, alignSelf: 'center' }}>Transaction:</span>
          <button style={filterStyle(!filters.transaction_type)} onClick={() => setFilter('transaction_type', '')}>All</button>
          {TRANSACTION_TYPES.map(t => (
            <button key={t} style={filterStyle(filters.transaction_type === t)} onClick={() => setFilter('transaction_type', filters.transaction_type === t ? '' : t)}>{t}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: '#888', fontWeight: 600, alignSelf: 'center' }}>Bedrooms:</span>
          <button style={filterStyle(filters.bedrooms === '')} onClick={() => setFilter('bedrooms', '')}>Any</button>
          {BEDROOM_OPTIONS.map(opt => (
            <button key={opt.value} style={filterStyle(filters.bedrooms === opt.value)} onClick={() => setFilter('bedrooms', filters.bedrooms === opt.value ? '' : opt.value)}>{opt.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#888', fontWeight: 600, alignSelf: 'center' }}>Status:</span>
          <button style={filterStyle(!filters.status)} onClick={() => setFilter('status', '')}>All</button>
          {['available', 'reserved', 'sold'].map(s => (
            <button key={s} style={filterStyle(filters.status === s)} onClick={() => setFilter('status', filters.status === s ? '' : s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888', fontSize: 14 }}>Loading properties...</div>
      ) : properties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>No properties found</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Try adjusting your filters or add a new listing</div>
          <button
            onClick={() => navigate('/agents/list-property')}
            style={{ padding: '10px 24px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            + List New Property
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {properties.map(prop => (
            <PropertyCard
              key={prop.id}
              prop={prop}
              onClick={() => navigate(`/agents/properties/${prop.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
