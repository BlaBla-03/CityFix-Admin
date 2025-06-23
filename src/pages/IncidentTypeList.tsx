import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import Navbar from '../components/Navbar';

interface IncidentType {
  id: string;
  name: string;
  description: string;
  severity: string;
  createdAt: string;
  iconUrl?: string;
}

const IncidentTypeList: React.FC = () => {
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const fetchIncidentTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching incident types...');

        // Create a query with ordering
        const q = query(collection(db, 'incidentTypes'), orderBy('name'));

        // Set up real-time listener
        unsubscribe = onSnapshot(q, 
          (querySnapshot) => {
            console.log(`Retrieved ${querySnapshot.docs.length} incident types from Firestore`);
            
            const types = querySnapshot.docs.map(doc => {
              const data = doc.data();
              console.log(`Processing incident type: ${doc.id}`, data);
              return {
                id: doc.id,
                ...data
              };
            }) as IncidentType[];
            
            console.log('Incident types data:', types);
            setIncidentTypes(types);
            setLoading(false);
          },
          (error) => {
            console.error('Error in incident types listener:', error);
            setError(`Failed to load incident types: ${error.message}`);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Failed to fetch incident types:', error);
        setError(`Failed to load incident types: ${error instanceof Error ? error.message : String(error)}`);
        setLoading(false);
      }
    };

    fetchIncidentTypes();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        console.log('Cleaning up incident types listener');
        unsubscribe();
      }
    };
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search input changed:', e.target.value);
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const filteredAndSortedTypes = React.useMemo(() => {
    console.log('Filtering incident types with search term:', searchTerm);
    try {
      if (!searchTerm) return [...incidentTypes].sort((a, b) => a.name.localeCompare(b.name));
      
      return incidentTypes
        .filter(type => {
          const nameMatch = type.name && type.name.toLowerCase().includes(searchTerm.toLowerCase());
          const descriptionMatch = type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase());
          
          console.log(`Incident type ${type.id}: name match = ${nameMatch}, description match = ${descriptionMatch}`);
          return nameMatch || descriptionMatch;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      console.error('Error during incident type filtering:', err);
      setError(`Error while filtering: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }, [incidentTypes, searchTerm]);

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedTypes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedTypes.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div style={pageContainer}>
      <Navbar />
      <main style={mainContent}>
        <div style={header}>
          <h1 style={title}>Incident Types</h1>
          <button style={addButton} onClick={() => navigate('/incident-types/add')}>
            Add Incident Type
          </button>
        </div>

        <div style={searchContainer}>
          <input
            type="text"
            placeholder="Search incident types..."
            value={searchTerm}
            onChange={handleSearch}
            style={searchInput}
          />
        </div>

        {error && (
          <div style={errorContainer}>
            <p style={errorText}>{error}</p>
            <button style={retryButton} onClick={() => {setError(null); window.location.reload();}}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div style={loadingContainer}>Loading incident types...</div>
        ) : (
          <>
            <div style={incidentTypeGrid}>
              {currentItems.length > 0 ? (
                currentItems.map((type) => (
                  <div key={type.id} style={incidentTypeCard}>
                    <div style={incidentTypeInfo}>
                      {type.iconUrl ? (
                        <div style={iconContainer}>
                          <img src={type.iconUrl} alt={type.name} style={iconStyle} />
                        </div>
                      ) : (
                        <div style={placeholderIconContainer}>
                          <div style={placeholderIcon}>{type.name.charAt(0).toUpperCase()}</div>
                        </div>
                      )}
                      <h3 style={incidentTypeName}>{type.name}</h3>
                      <p style={incidentTypeDescription}>{type.description}</p>
                      <div style={severityContainer}>
                        <span style={severityBadge(type.severity)}>
                          {type.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div style={incidentTypeActions}>
                      <button
                        style={editButton}
                        onClick={() => navigate(`/incident-types/edit/${type.id}`)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={noResultsContainer}>
                  {searchTerm ? `No incident types found matching "${searchTerm}"` : "No incident types available"}
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredAndSortedTypes.length > itemsPerPage && (
              <div style={paginationContainer}>
                <button
                  style={{...paginationButton, ...(currentPage === 1 ? disabledButton : {})}}
                  onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <div style={pageInfo}>
                  Page {currentPage} of {totalPages} 
                  <span style={itemCountInfo}>
                    (Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredAndSortedTypes.length)} of {filteredAndSortedTypes.length})
                  </span>
                </div>
                <button
                  style={{...paginationButton, ...(currentPage === totalPages ? disabledButton : {})}}
                  onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
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

const addButton: React.CSSProperties = {
  backgroundColor: '#2ecc71',
  color: '#fff',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const searchContainer: React.CSSProperties = {
  marginBottom: '2rem',
};

const searchInput: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '1rem',
  transition: 'border-color 0.2s ease',
};

const loadingContainer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem',
  color: '#666',
};

const incidentTypeGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '1.5rem',
};

const incidentTypeCard: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const incidentTypeInfo: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  alignItems: 'center',
};

const iconContainer: React.CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  overflow: 'hidden',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: '0.5rem',
  backgroundColor: '#f8f8f8',
};

const iconStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const placeholderIconContainer: React.CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: '0.5rem',
  backgroundColor: '#3498db',
};

const placeholderIcon: React.CSSProperties = {
  color: '#fff',
  fontSize: '1.5rem',
  fontWeight: 'bold',
};

const incidentTypeName: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#000',
  margin: 0,
  textAlign: 'center',
};

const incidentTypeDescription: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#666',
  margin: 0,
  textAlign: 'center',
};

const severityContainer: React.CSSProperties = {
  marginTop: '0.5rem',
};

const severityBadge = (severity: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '0.25rem 0.75rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: 
    severity === 'critical' ? '#e74c3c' :
    severity === 'high' ? '#e67e22' :
    severity === 'medium' ? '#f1c40f' :
    '#2ecc71',
  color: '#fff',
});

const incidentTypeActions: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginTop: 'auto',
};

const editButton: React.CSSProperties = {
  flex: 1,
  padding: '0.5rem',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#3498db',
  color: '#fff',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const errorContainer: React.CSSProperties = {
  backgroundColor: '#ffebee', 
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '1rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const errorText: React.CSSProperties = {
  color: '#c62828',
  margin: '0 0 1rem 0',
  textAlign: 'center',
};

const retryButton: React.CSSProperties = {
  padding: '0.5rem 1rem',
  backgroundColor: '#f44336',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const noResultsContainer: React.CSSProperties = {
  gridColumn: '1 / -1',
  padding: '2rem',
  textAlign: 'center',
  color: '#666',
};

// Pagination styles
const paginationContainer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: '2rem',
  gap: '1rem',
};

const paginationButton: React.CSSProperties = {
  padding: '0.5rem 1rem',
  backgroundColor: '#3498db',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
};

const disabledButton: React.CSSProperties = {
  backgroundColor: '#ccc',
  cursor: 'not-allowed',
};

const pageInfo: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  fontSize: '0.875rem',
  color: '#666',
};

const itemCountInfo: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#999',
  marginTop: '0.25rem',
};

export default IncidentTypeList; 