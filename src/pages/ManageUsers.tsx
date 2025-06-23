import React, { useEffect, useState } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  location?: string;
  municipal?: string;
}

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const navigate = useNavigate();

  const fetchAllUsers = async () => {
    try {
      console.log('Fetching users...');
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      console.log(`Retrieved ${snapshot.docs.length} users from Firestore`);
      
      const userList = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Processing user: ${doc.id}`, data);
        return {
          id: doc.id,
          ...data
        };
      }) as StaffUser[];
      
      console.log('Users data:', userList);
      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(`Failed to load users: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search input changed:', e.target.value);
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleRoleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Role filter changed:', e.target.value);
    setRoleFilter(e.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const filteredUsers = React.useMemo(() => {
    console.log('Filtering users with search term:', search, 'and role filter:', roleFilter);
    try {
      return users.filter((user) => {
        const nameMatch = user.name && user.name.toLowerCase().includes(search.toLowerCase());
        const emailMatch = user.email && user.email.toLowerCase().includes(search.toLowerCase());
        const usernameMatch = user.username && user.username.toLowerCase().includes(search.toLowerCase());
        const roleMatch = roleFilter === 'all' || user.role === roleFilter;
        
        console.log(`User ${user.id}: name match = ${nameMatch}, email match = ${emailMatch}, username match = ${usernameMatch}, role match = ${roleMatch}`);
        return (nameMatch || emailMatch || usernameMatch) && roleMatch;
      });
    } catch (err) {
      console.error('Error during user filtering:', err);
      setError(`Error while filtering: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }, [users, search, roleFilter]);

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div style={pageContainer}>
      <Navbar />
      
      <main style={mainContent}>
        <div style={header}>
          <h1 style={title}>User Management</h1>
          <button style={addButton} onClick={() => navigate('/users/new')}>
            Add New User
          </button>
        </div>

        <div style={filtersContainer}>
          <div style={searchContainer}>
            <input
              type="text"
              placeholder="Search users by name or email"
              value={search}
              onChange={handleSearch}
              style={searchInput}
            />
          </div>
          <div style={roleFilterContainer}>
            <select
              value={roleFilter}
              onChange={handleRoleFilter}
              style={roleFilterSelect}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </div>

        {error && (
          <div style={errorContainer}>
            <p style={errorText}>{error}</p>
            <button style={retryButton} onClick={() => {setError(null); fetchAllUsers();}}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div style={loadingContainer}>Loading users...</div>
        ) : (
          <>
            <div style={userGrid}>
              {currentItems.length > 0 ? (
                currentItems.map((user) => (
                  <div key={user.id} style={userCard}>
                    <div style={userInfo}>
                      <h3 style={userName}>{user.name}</h3>
                      <p style={userEmail}>{user.email}</p>
                      <div style={roleBadge(user.role)}>{user.role}</div>
                    </div>
                    <div style={userActions}>
                      <button
                        style={actionButton}
                        onClick={() => navigate(`/users/${user.id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={noResultsContainer}>
                  {search || roleFilter !== 'all' ? `No users found matching your filters` : "No users available"}
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredUsers.length > itemsPerPage && (
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
                    (Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length})
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
  marginTop: '69px', // 64px for navbar + 5px gap
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

const filtersContainer: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '2rem',
};

const searchContainer: React.CSSProperties = {
  flex: 1,
};

const searchInput: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '1rem',
  transition: 'border-color 0.2s ease',
};

const roleFilterContainer: React.CSSProperties = {
  minWidth: '200px',
};

const roleFilterSelect: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '1rem',
  backgroundColor: '#fff',
  cursor: 'pointer',
};

const loadingContainer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem',
  color: '#666',
};

const userGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '1.5rem',
};

const userCard: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const userInfo: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const userName: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#000',
  margin: 0,
};

const userEmail: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#666',
  margin: 0,
};

const roleBadge = (role: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '0.25rem 0.75rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: role === 'admin' ? '#e74c3c' : '#3498db',
  color: '#fff',
});

const userActions: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginTop: 'auto',
};

const actionButton: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
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

export default ManageUsers; 