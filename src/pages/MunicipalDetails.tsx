import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import Navbar from '../components/Navbar';

interface Municipal {
  id: string;
  name: string;
  address: string;
  postcodeRanges: { start: number; end: number }[];
  incidentTypes: string[];
  createdAt?: any;
  updatedAt?: any;
}

const MunicipalDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [municipal, setMunicipal] = useState<Municipal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMunicipal = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, 'municipals', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMunicipal({ id: docSnap.id, ...docSnap.data() } as Municipal);
        } else {
          setError('Municipal not found');
        }
      } catch (err) {
        setError('Error fetching municipal');
      } finally {
        setLoading(false);
      }
    };
    fetchMunicipal();
  }, [id]);

  if (loading) {
    return (
      <div style={pageContainer}>
        <Navbar />
        <main style={mainContent}>
          <div style={loadingContainer}>Loading municipal data...</div>
        </main>
      </div>
    );
  }

  if (!municipal) {
    return (
      <div style={pageContainer}>
        <Navbar />
        <main style={mainContent}>
          <div style={errorContainer}>
            <p style={errorText}>{error || 'Municipal not found'}</p>
            <button style={backButton} onClick={() => navigate('/municipals')}>
              Back to Municipals
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={pageContainer}>
      <Navbar />
      <main style={mainContent}>
        <div style={contentContainer}>
          <div style={backButtonContainer}>
            <button style={backButton} onClick={() => navigate('/municipals')}>
              Back to Municipals
            </button>
          </div>
          <div style={card}>
            <div style={header}>
              <h2 style={title}>Municipal Details</h2>
              <div style={actions}>
                <button
                  style={editButton}
                  onClick={() => navigate(`/municipals/${id}/edit`)}
                >
                  Edit Municipal
                </button>
              </div>
            </div>
            {error && <p style={errorText}>{error}</p>}
            <div style={details}>
              <div style={detailRow}>
                <span style={label}>Name:</span>
                <span style={value}>{municipal.name}</span>
              </div>
              <div style={detailRow}>
                <span style={label}>Address:</span>
                <span style={value}>{municipal.address}</span>
              </div>
              <div style={detailRow}>
                <span style={label}>Postcode Range(s):</span>
                <span style={value}>
                  {municipal.postcodeRanges && municipal.postcodeRanges.length > 0
                    ? municipal.postcodeRanges.map((r, i) => (
                        <span key={i} style={postcodeBadge}>
                          {r.start} - {r.end}
                        </span>
                      ))
                    : '—'}
                </span>
              </div>
              <div style={detailRow}>
                <span style={label}>Incident Types:</span>
                <span style={value}>
                  {municipal.incidentTypes && municipal.incidentTypes.length > 0
                    ? municipal.incidentTypes.join(', ')
                    : '—'}
                </span>
              </div>
              {municipal.createdAt && (
                <div style={detailRow}>
                  <span style={label}>Created:</span>
                  <span style={value}>
                    {municipal.createdAt.toDate?.().toLocaleDateString?.()}
                  </span>
                </div>
              )}
              {municipal.updatedAt && (
                <div style={detailRow}>
                  <span style={label}>Last Updated:</span>
                  <span style={value}>
                    {municipal.updatedAt.toDate?.().toLocaleDateString?.()}
                  </span>
                </div>
              )}
            </div>
          </div>
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
  marginTop: '69px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const contentContainer: React.CSSProperties = {
  width: '100%',
  maxWidth: '900px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
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
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
};

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
};

const title: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 600,
  color: '#000',
  margin: 0,
};

const actions: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
};

const editButton: React.CSSProperties = {
  backgroundColor: '#3498db',
  color: '#fff',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const details: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const detailRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
};

const label: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#666',
};

const value: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#000',
  textAlign: 'right',
  flex: 1,
};

const postcodeBadge: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.25rem 0.75rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: '#f1c40f',
  color: '#fff',
  marginRight: '0.5rem',
};

const errorText: React.CSSProperties = {
  color: '#e74c3c',
  fontSize: '0.875rem',
  marginBottom: '1rem',
};

const loadingContainer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem',
  color: '#666',
};

const errorContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  padding: '2rem',
};

export default MunicipalDetails; 