import React, { useEffect, useState } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

interface Municipal {
  id: string;
  name: string;
  location: string;
  postcodeStart: number;
  postcodeEnd: number;
  incidentTypes: string[];
}

const MunicipalList: React.FC = () => {
  const [municipals, setMunicipals] = useState<Municipal[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const navigate = useNavigate();

  const fetchMunicipals = async () => {
    try {
      console.log('Fetching municipals...');
      const q = query(collection(db, 'municipals'));
      const snapshot = await getDocs(q);
      console.log(`Retrieved ${snapshot.docs.length} municipals from Firestore`);
      
      const municipalList = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Processing municipal: ${doc.id}`, data);
        return {
          id: doc.id,
          ...data
        };
      }) as Municipal[];
      
      console.log('Municipals data:', municipalList);
      setMunicipals(municipalList);
    } catch (error) {
      console.error('Error fetching municipals:', error);
      setError(`Failed to load municipals: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMunicipals();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search input changed:', e.target.value);
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const filteredMunicipals = React.useMemo(() => {
    console.log('Filtering municipals with search term:', search);
    try {
      if (!search) return municipals;
      
      return municipals.filter(
        (municipal) => {
          // Check if required properties exist before using them
          const nameMatch = municipal.name && municipal.name.toLowerCase().includes(search.toLowerCase());
          const locationMatch = municipal.location && municipal.location.toLowerCase().includes(search.toLowerCase());
          
          console.log(`Municipal ${municipal.id}: name match = ${nameMatch}, location match = ${locationMatch}`);
          return nameMatch || locationMatch;
        }
      );
    } catch (err) {
      console.error('Error during municipal filtering:', err);
      setError(`Error while filtering: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }, [municipals, search]);

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMunicipals.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMunicipals.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div style={pageContainer}>
      <Navbar />
      
      <main style={mainContent}>
        <div style={header}>
          <h1 style={title}>Municipal Management</h1>
          <button style={addButton} onClick={() => navigate('/municipals/new')}>
            Add New Municipal
          </button>
        </div>

        <div style={searchContainer}>
          <input
            type="text"
            placeholder="Search municipals by name or location"
            value={search}
            onChange={handleSearch}
            style={searchInput}
          />
        </div>

        {error && (
          <div style={errorContainer}>
            <p style={errorText}>{error}</p>
            <button style={retryButton} onClick={() => {setError(null); fetchMunicipals();}}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div style={loadingContainer}>Loading municipals...</div>
        ) : (
          <>
            <div style={municipalGrid}>
              {currentItems.length > 0 ? (
                currentItems.map((municipal) => (
                  <div key={municipal.id} style={municipalCard}>
                    <div style={municipalInfo}>
                      <h3 style={municipalName}>{municipal.name}</h3>
                      <p style={municipalLocation}>{municipal.location}</p>
                      <p style={municipalDetail}>
                        Postcode Range: {municipal.postcodeStart} - {municipal.postcodeEnd}
                      </p>
                      <div style={incidentTypesContainer}>
                        {municipal.incidentTypes && municipal.incidentTypes.map((type, index) => (
                          <span key={index} style={incidentTypeBadge}>
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={municipalActions}>
                      <button
                        style={actionButton}
                        onClick={() => navigate(`/municipals/${municipal.id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={noResultsContainer}>
                  {search ? `No municipals found matching "${search}"` : "No municipals available"}
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredMunicipals.length > itemsPerPage && (
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
                    (Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredMunicipals.length)} of {filteredMunicipals.length})
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

const municipalGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '1.5rem',
};

const municipalCard: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const municipalInfo: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const municipalName: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#000',
  margin: 0,
};

const municipalLocation: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#666',
  margin: 0,
};

const municipalDetail: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#666',
  margin: 0,
};

const incidentTypesContainer: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  marginTop: '0.5rem',
};

const incidentTypeBadge: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.25rem 0.75rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: '#3498db',
  color: '#fff',
};

const municipalActions: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginTop: 'auto',
};

const actionButton: React.CSSProperties = {
  flex: 1,
  padding: '0.5rem',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#f5f5f5',
  color: '#666',
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

export default MunicipalList; 