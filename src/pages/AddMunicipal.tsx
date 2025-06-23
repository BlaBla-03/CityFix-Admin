import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import Navbar from '../components/Navbar';

interface IncidentType {
  id: string;
  name: string;
}

const AddMunicipal: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    address: '',
    postcodeRanges: [{ start: '', end: '' }],
    incidentTypes: [] as string[],
  });
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIncidentTypes = async () => {
      try {
        const q = collection(db, 'incidentTypes');
        const snapshot = await getDocs(q);
        const types = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setIncidentTypes(types);
      } catch (error) {
        console.error('Error fetching incident types:', error);
      }
    };

    fetchIncidentTypes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleIncidentTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setForm(prev => ({
      ...prev,
      incidentTypes: checked
        ? [...prev.incidentTypes, value]
        : prev.incidentTypes.filter(type => type !== value),
    }));
  };

  const handleRangeChange = (idx: number, field: 'start' | 'end', value: string) => {
    setForm(prev => ({
      ...prev,
      postcodeRanges: prev.postcodeRanges.map((range, i) =>
        i === idx ? { ...range, [field]: value } : range
      ),
    }));
  };

  const addRange = () => {
    setForm(prev => ({
      ...prev,
      postcodeRanges: [...prev.postcodeRanges, { start: '', end: '' }],
    }));
  };

  const removeRange = (idx: number) => {
    setForm(prev => ({
      ...prev,
      postcodeRanges: prev.postcodeRanges.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!form.name || !form.address || form.postcodeRanges.some(r => !r.start || !r.end)) {
        throw new Error('All fields are required');
      }
      for (const range of form.postcodeRanges) {
        if (Number(range.start) > Number(range.end)) {
          throw new Error('Start postcode must be less than end postcode');
        }
      }

      await addDoc(collection(db, 'municipals'), {
        name: form.name,
        address: form.address,
        postcodeRanges: form.postcodeRanges.map(r => ({
          start: Number(r.start),
          end: Number(r.end),
        })),
        incidentTypes: form.incidentTypes,
        createdAt: new Date(),
      });

      setSuccess(true);
      // navigate('/municipals'); // Comment out auto navigation
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageContainer}>
      <Navbar />
      
      <main style={mainContent}>
        <div style={backButtonContainer}>
          <button
            style={backButton}
            onClick={() => navigate('/municipals')}
          >
            Back to Municipals
          </button>
        </div>
        <div style={card}>
          <h2 style={title}>Add New Municipal</h2>
          
          {success ? (
            <div style={successBox}>
              <h3 style={successTitle}>Municipal added successfully!</h3>
              <button style={successButton} onClick={() => navigate('/municipals')}>
                Back to Municipals
              </button>
            </div>
          ) : (
            <>
              {error && <p style={errorText}>{error}</p>}
              
              <form onSubmit={handleSubmit} style={formStyle}>
                <div style={inputGroup}>
                  <label style={label}>Municipal Name</label>
                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    style={input}
                    placeholder="Enter municipal name"
                    required
                  />
                </div>

                <div style={inputGroup}>
                  <label style={label}>Address</label>
                  <input
                    name="address"
                    type="text"
                    value={form.address}
                    onChange={handleChange}
                    style={input}
                    placeholder="Enter address"
                    required
                  />
                </div>

                <div style={inputGroup}>
                  <label style={label}>Postcode Range(s)</label>
                  {form.postcodeRanges.map((range, idx) => (
                    <div style={postcodeRange} key={idx}>
                      <input
                        name={`postcodeStart${idx}`}
                        type="number"
                        value={range.start}
                        onChange={e => handleRangeChange(idx, 'start', e.target.value)}
                        style={input}
                        placeholder="Start"
                        required
                      />
                      <span style={rangeSeparator}>to</span>
                      <input
                        name={`postcodeEnd${idx}`}
                        type="number"
                        value={range.end}
                        onChange={e => handleRangeChange(idx, 'end', e.target.value)}
                        style={input}
                        placeholder="End"
                        required
                      />
                      {form.postcodeRanges.length > 1 && (
                        <button type="button" style={removeRangeButton} onClick={() => removeRange(idx)}>
                          &minus;
                        </button>
                      )}
                      {idx === form.postcodeRanges.length - 1 && (
                        <button type="button" style={addRangeButton} onClick={addRange}>
                          +
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div style={inputGroup}>
                  <label style={label}>Incident Types</label>
                  <div style={incidentTypesGrid}>
                    {incidentTypes.map((type) => (
                      <label key={type.id} style={incidentTypeLabel}>
                        <input
                          type="checkbox"
                          value={type.name}
                          checked={form.incidentTypes.includes(type.name)}
                          onChange={handleIncidentTypeChange}
                          style={checkbox}
                        />
                        {type.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={buttonGroup}>
                  <button
                    type="button"
                    style={cancelButton}
                    onClick={() => navigate('/municipals')}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={submitButton}
                    disabled={loading}
                  >
                    {loading ? 'Adding Municipal...' : 'Add Municipal'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

const pageContainer: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f5f5f5',
};

const mainContent: React.CSSProperties = {
  padding: '2rem',
  marginTop: '69px', // 64px for navbar + 5px gap
};

const backButtonContainer: React.CSSProperties = {
  marginBottom: '1rem',
};

const backButton: React.CSSProperties = {
  backgroundColor: '#95a5a6',
  color: '#fff',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const card: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '2rem',
  maxWidth: '600px',
  margin: '0 auto',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
};

const title: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
  marginTop: 0,
  marginBottom: '1rem',
  color: '#333',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const inputGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const label: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#555',
};

const input: React.CSSProperties = {
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '1rem',
};

const postcodeRange: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.5rem',
};

const rangeSeparator: React.CSSProperties = {
  color: '#666',
  padding: '0 0.25rem',
};

const addRangeButton: React.CSSProperties = {
  width: '32px',
  height: '32px',
  backgroundColor: '#3498db',
  color: '#fff',
  borderRadius: '50%',
  border: 'none',
  fontSize: '1.2rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
};

const removeRangeButton: React.CSSProperties = {
  width: '32px',
  height: '32px',
  backgroundColor: '#e74c3c',
  color: '#fff',
  borderRadius: '50%',
  border: 'none',
  fontSize: '1.2rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
};

const incidentTypesGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: '0.75rem',
};

const incidentTypeLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.875rem',
  cursor: 'pointer',
};

const checkbox: React.CSSProperties = {
  cursor: 'pointer',
};

const buttonGroup: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1rem',
  marginTop: '1rem',
};

const cancelButton: React.CSSProperties = {
  padding: '0.75rem',
  borderRadius: '8px',
  fontSize: '1rem',
  fontWeight: 500,
  backgroundColor: '#f5f5f5',
  color: '#666',
  border: 'none',
  cursor: 'pointer',
  flex: 1,
};

const submitButton: React.CSSProperties = {
  padding: '0.75rem',
  borderRadius: '8px',
  fontSize: '1rem',
  fontWeight: 500,
  backgroundColor: '#2ecc71',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  flex: 2,
};

const errorText: React.CSSProperties = {
  color: '#e74c3c',
  fontSize: '0.875rem',
  marginBottom: '1rem',
};

const successBox: React.CSSProperties = {
  textAlign: 'center',
  padding: '2rem',
};

const successTitle: React.CSSProperties = {
  fontSize: '1.5rem',
  color: '#2ecc71',
  marginBottom: '1.5rem',
};

const successButton: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#2ecc71',
  color: '#fff',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 500,
  cursor: 'pointer',
};

export default AddMunicipal; 