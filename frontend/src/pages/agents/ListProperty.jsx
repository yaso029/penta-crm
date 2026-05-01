import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api';

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Plot', 'Office', 'Retail'];
const TRANSACTION_TYPES = ['For Sale', 'For Rent'];
const AMENITIES_LIST = [
  'Swimming Pool', 'Gym', 'Parking', 'Balcony', 'Garden', 'Security',
  'Concierge', 'Kids Play Area', 'BBQ Area', 'Sauna', 'Tennis Court',
  'Squash Court', 'Jogging Track', 'Spa', 'Cinema Room', 'Business Center',
  'Retail Shops', 'Metro Access', 'Beach Access', 'Sea View', 'Burj View',
];

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

function FieldLabel({ children, required }) {
  return (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
      {children} {required && <span style={{ color: '#dc2626' }}>*</span>}
    </label>
  );
}

function Input({ style, ...props }) {
  return (
    <input
      style={{
        width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
        borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.15s', ...style,
      }}
      onFocus={e => (e.target.style.borderColor = '#0A2342')}
      onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
      {...props}
    />
  );
}

function Select({ children, style, ...props }) {
  return (
    <select
      style={{
        width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
        borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
        background: '#fff', ...style,
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export default function ListProperty() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const fileInputRef = useRef();

  const [form, setForm] = useState({
    title: '', description: '', property_type: 'Apartment', transaction_type: 'For Sale',
    location: '', price: '', bedrooms: '', bathrooms: '', area_sqft: '', floor: '',
    amenities: [], images: [], status: 'available',
    developer: '', project_name: '', handover_date: '', payment_plan: '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editId) {
      api.get(`/api/agents/properties/${editId}`).then(r => {
        const p = r.data;
        setForm({
          title: p.title || '', description: p.description || '',
          property_type: p.property_type || 'Apartment',
          transaction_type: p.transaction_type || 'For Sale',
          location: p.location || '', price: p.price ?? '',
          bedrooms: p.bedrooms ?? '', bathrooms: p.bathrooms ?? '',
          area_sqft: p.area_sqft ?? '', floor: p.floor ?? '',
          amenities: p.amenities || [], images: p.images || [],
          status: p.status || 'available', developer: p.developer || '',
          project_name: p.project_name || '', handover_date: p.handover_date || '',
          payment_plan: p.payment_plan || '',
        });
      });
    }
  }, [editId]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleAmenity = (a) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }));
  };

  const handleImageUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    const token = localStorage.getItem('token');
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${BASE}/api/agents/upload-image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();
        if (data.url) {
          setForm(f => ({ ...f, images: [...f.images, data.url] }));
        } else {
          setError(`Upload failed: ${data.error || 'Unknown error'}`);
        }
      } catch (e) {
        setError('Image upload failed. Check your connection.');
      }
    }
    setUploading(false);
  };

  const removeImage = (idx) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.location.trim()) {
      setError('Title and location are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.price !== '' ? parseFloat(form.price) : null,
        bedrooms: form.bedrooms !== '' ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms !== '' ? parseInt(form.bathrooms) : null,
        area_sqft: form.area_sqft !== '' ? parseFloat(form.area_sqft) : null,
        floor: form.floor !== '' ? parseInt(form.floor) : null,
      };
      if (editId) {
        await api.put(`/api/agents/properties/${editId}`, payload);
        navigate(`/agents/properties/${editId}`);
      } else {
        const res = await api.post('/api/agents/properties', payload);
        navigate(`/agents/properties/${res.data.id}`);
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to save property.');
    } finally {
      setSaving(false);
    }
  };

  const section = (title) => (
    <div style={{ fontSize: 13, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16, marginTop: 4, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
      {title}
    </div>
  );

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
  const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/agents/properties')}
          style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#555' }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>
          {editId ? 'Edit Property' : 'List New Property'}
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 20 }}>
          {section('Basic Information')}
          <div style={{ marginBottom: 16 }}>
            <FieldLabel required>Property Title</FieldLabel>
            <Input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Luxury 2BR Apartment in Downtown Dubai" required />
          </div>
          <div style={{ ...grid2, marginBottom: 16 }}>
            <div>
              <FieldLabel required>Property Type</FieldLabel>
              <Select value={form.property_type} onChange={e => setField('property_type', e.target.value)}>
                {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel required>Transaction Type</FieldLabel>
              <Select value={form.transaction_type} onChange={e => setField('transaction_type', e.target.value)}>
                {TRANSACTION_TYPES.map(t => <option key={t}>{t}</option>)}
              </Select>
            </div>
          </div>
          <div style={{ ...grid2, marginBottom: 16 }}>
            <div>
              <FieldLabel required>Location / Community</FieldLabel>
              <Input value={form.location} onChange={e => setField('location', e.target.value)} placeholder="e.g. Downtown Dubai" required />
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <Select value={form.status} onChange={e => setField('status', e.target.value)}>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </Select>
            </div>
          </div>
          <div style={{ marginBottom: 0 }}>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              rows={4}
              placeholder="Describe the property, key features, views, finishings..."
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
                borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                resize: 'vertical', fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 20 }}>
          {section('Specifications')}
          <div style={{ ...grid3, marginBottom: 16 }}>
            <div>
              <FieldLabel>Price (AED)</FieldLabel>
              <Input type="number" value={form.price} onChange={e => setField('price', e.target.value)} placeholder="e.g. 1500000" />
            </div>
            <div>
              <FieldLabel>Bedrooms</FieldLabel>
              <Select value={form.bedrooms} onChange={e => setField('bedrooms', e.target.value)}>
                <option value="">Select</option>
                <option value="0">Studio</option>
                {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel>Bathrooms</FieldLabel>
              <Select value={form.bathrooms} onChange={e => setField('bathrooms', e.target.value)}>
                <option value="">Select</option>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
          </div>
          <div style={{ ...grid3, marginBottom: 0 }}>
            <div>
              <FieldLabel>Area (sqft)</FieldLabel>
              <Input type="number" value={form.area_sqft} onChange={e => setField('area_sqft', e.target.value)} placeholder="e.g. 1200" />
            </div>
            <div>
              <FieldLabel>Floor</FieldLabel>
              <Input type="number" value={form.floor} onChange={e => setField('floor', e.target.value)} placeholder="e.g. 15" />
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 20 }}>
          {section('Developer & Project')}
          <div style={{ ...grid2, marginBottom: 16 }}>
            <div>
              <FieldLabel>Developer</FieldLabel>
              <Input value={form.developer} onChange={e => setField('developer', e.target.value)} placeholder="e.g. Emaar, DAMAC, Nakheel..." />
            </div>
            <div>
              <FieldLabel>Project Name</FieldLabel>
              <Input value={form.project_name} onChange={e => setField('project_name', e.target.value)} placeholder="e.g. Burj Crown" />
            </div>
          </div>
          <div style={{ ...grid2, marginBottom: 16 }}>
            <div>
              <FieldLabel>Handover Date</FieldLabel>
              <Input value={form.handover_date} onChange={e => setField('handover_date', e.target.value)} placeholder="e.g. Q4 2026" />
            </div>
          </div>
          <div>
            <FieldLabel>Payment Plan</FieldLabel>
            <textarea
              value={form.payment_plan}
              onChange={e => setField('payment_plan', e.target.value)}
              rows={3}
              placeholder="e.g. 30/70 - 30% during construction, 70% on handover..."
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
                borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                resize: 'vertical', fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 20 }}>
          {section('Amenities')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AMENITIES_LIST.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: 'none',
                  background: form.amenities.includes(a) ? '#0A2342' : '#f1f5f9',
                  color: form.amenities.includes(a) ? '#fff' : '#555',
                  transition: 'all 0.15s',
                }}
              >
                {form.amenities.includes(a) ? '✓ ' : ''}{a}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 24 }}>
          {section('Photos')}
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={e => handleImageUpload(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '10px 20px', background: uploading ? '#e2e8f0' : '#0A2342',
              color: uploading ? '#888' : '#fff', border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer',
              marginBottom: 16,
            }}
          >
            {uploading ? '⏳ Uploading...' : '📷 Upload Photos'}
          </button>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
            Upload multiple JPG/PNG images. First image will be the cover.
          </div>
          {form.images.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {form.images.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={url} alt="" style={{ width: 100, height: 75, objectFit: 'cover', borderRadius: 8, border: i === 0 ? '2px solid #dc2626' : '2px solid #e2e8f0' }} />
                  {i === 0 && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#dc2626', color: '#fff', fontSize: 9, fontWeight: 700, textAlign: 'center', borderRadius: '0 0 6px 6px', padding: '2px 0' }}>COVER</div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    style={{
                      position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                      background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%',
                      fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/agents/properties')}
            style={{ padding: '12px 24px', background: '#f1f5f9', color: '#555', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            style={{
              padding: '12px 32px', background: saving ? '#e2e8f0' : '#dc2626',
              color: saving ? '#888' : '#fff', border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : editId ? 'Save Changes' : 'List Property'}
          </button>
        </div>
      </form>
    </div>
  );
}
