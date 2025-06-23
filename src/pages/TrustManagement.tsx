import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import {
  Reporter,
  getAllReporters,
  getTrustLevelLabel,
  getTrustLevelColor,
  updateReporterTrustManually,
  recalculateReporterTrust,
  recalculateAllReportersTrust,
  updateReporterFlagStatus,
  TRUST_LEVELS
} from '../reporterUtils';

// Chart component to show trust level distribution
const TrustDistributionChart: React.FC<{ reporters: Reporter[] }> = ({ reporters }) => {
  // Count reporters in each trust level
  const trustDistribution = {
    new: 0,
    basic: 0,
    reliable: 0,
    trusted: 0,
    verified: 0
  };
  
  reporters.forEach(reporter => {
    const trustLevel = reporter.trustLevel || 0;
    if (trustLevel >= TRUST_LEVELS.VERIFIED) trustDistribution.verified++;
    else if (trustLevel >= TRUST_LEVELS.TRUSTED) trustDistribution.trusted++;
    else if (trustLevel >= TRUST_LEVELS.RELIABLE) trustDistribution.reliable++;
    else if (trustLevel >= TRUST_LEVELS.BASIC) trustDistribution.basic++;
    else trustDistribution.new++;
  });
  
  const maxValue = Math.max(...Object.values(trustDistribution));
  
  return (
    <div style={chartContainer}>
      <h3 style={chartTitle}>Trust Level Distribution</h3>
      <div style={chartBars}>
        {Object.entries(trustDistribution).map(([level, count]) => (
          <div key={level} style={chartBarContainer}>
            <div style={chartLabel}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </div>
            <div style={chartBarOuter}>
              <div 
                style={{
                  ...chartBar, 
                  width: `${maxValue > 0 ? (count / maxValue) * 100 : 0}%`,
                  backgroundColor: getTrustLevelColor(
                    level === 'verified' ? TRUST_LEVELS.VERIFIED :
                    level === 'trusted' ? TRUST_LEVELS.TRUSTED :
                    level === 'reliable' ? TRUST_LEVELS.RELIABLE :
                    level === 'basic' ? TRUST_LEVELS.BASIC : 0
                  )
                }}
              ></div>
            </div>
            <div style={chartCount}>{count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TrustManagement: React.FC = () => {
  const [reporters, setReporters] = useState<Reporter[]>([]);
  const [filteredReporters, setFilteredReporters] = useState<Reporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [trustFilter, setTrustFilter] = useState('all');
  const [sortOption, setSortOption] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [error, setError] = useState<string | null>(null);
  const [recalculatingAll, setRecalculatingAll] = useState(false);
  const [editingReporter, setEditingReporter] = useState<Reporter | null>(null);
  const [newTrustLevel, setNewTrustLevel] = useState<number>(0);
  const [trustReason, setTrustReason] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  
  // Flagging state
  const [flagFilter, setFlagFilter] = useState<'all' | 'flagged' | 'unflagged'>('all');
  const [flaggingReporter, setFlaggingReporter] = useState<Reporter | null>(null);
  const [flagReason, setFlagReason] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(30); // Limit to 30 items per page for TrustManagement
  
  // Fetch reporters data
  const fetchReporters = async () => {
    try {
      setLoading(true);
      console.log('Fetching reporters...');
      const data = await getAllReporters();
      console.log(`Retrieved ${data.length} reporters`);
      setReporters(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reporters:', err);
      setError(`Failed to load reporters: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReporters();
  }, []);

  // Filter and sort reporters
  useEffect(() => {
    let filtered = [...reporters];
    
    // Search filter
    if (search) {
      filtered = filtered.filter(reporter => 
        (reporter.name && reporter.name.toLowerCase().includes(search.toLowerCase())) ||
        (reporter.email && reporter.email.toLowerCase().includes(search.toLowerCase())) ||
        (reporter.phone && reporter.phone.includes(search))
      );
    }
    
    // Trust level filter
    if (trustFilter !== 'all') {
      const minTrustLevel = TRUST_LEVELS[trustFilter.toUpperCase() as keyof typeof TRUST_LEVELS];
      const maxTrustLevel = trustFilter === 'verified' ? 101 : 
                           trustFilter === 'trusted' ? TRUST_LEVELS.VERIFIED :
                           trustFilter === 'reliable' ? TRUST_LEVELS.TRUSTED :
                           trustFilter === 'basic' ? TRUST_LEVELS.RELIABLE :
                           TRUST_LEVELS.BASIC;
      
      filtered = filtered.filter(reporter => {
        const trustLevel = reporter.trustLevel || 0;
        return trustLevel >= minTrustLevel && trustLevel < maxTrustLevel;
      });
    }
    
    // Flag filter
    if (flagFilter !== 'all') {
      filtered = filtered.filter(reporter => 
        flagFilter === 'flagged' ? reporter.flagged === true : reporter.flagged !== true
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortOption) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'trustLevel':
          comparison = (a.trustLevel || 0) - (b.trustLevel || 0);
          break;
        case 'reportCount':
          comparison = (a.reportCount || 0) - (b.reportCount || 0);
          break;
        case 'accuracy':
          const aAccuracy = a.reportCount ? (a.verifiedReports || 0) / a.reportCount : 0;
          const bAccuracy = b.reportCount ? (b.verifiedReports || 0) / b.reportCount : 0;
          comparison = aAccuracy - bAccuracy;
          break;
        case 'createdAt':
          const aDate = a.createdAt?.toDate?.() || new Date(0);
          const bDate = b.createdAt?.toDate?.() || new Date(0);
          comparison = aDate.getTime() - bDate.getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredReporters(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [reporters, search, trustFilter, flagFilter, sortOption, sortDirection]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search changed:', e.target.value);
    setSearch(e.target.value);
  };

  // Handle trust level filter change
  const handleTrustFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Trust filter changed:', e.target.value);
    setTrustFilter(e.target.value);
  };
  
  // Handle flag filter change
  const handleFlagFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Flag filter changed:', e.target.value);
    setFlagFilter(e.target.value as 'all' | 'flagged' | 'unflagged');
  };
  
  // Toggle sort direction
  const handleSort = (option: string) => {
    if (sortOption === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortOption(option);
      setSortDirection('asc');
    }
  };
  
  // Start editing a reporter's trust level
  const startEditTrust = (reporter: Reporter) => {
    setEditingReporter(reporter);
    setNewTrustLevel(reporter.trustLevel || 0);
    setTrustReason('');
    setUpdateSuccess(null);
  };
  
  // Start flagging a reporter
  const startFlagging = (reporter: Reporter) => {
    setFlaggingReporter(reporter);
    setFlagReason(reporter.flagReason || '');
    setUpdateSuccess(null);
  };
  
  // Cancel editing
  const cancelEdit = () => {
    setEditingReporter(null);
    setUpdateSuccess(null);
  };
  
  // Cancel flagging
  const cancelFlagging = () => {
    setFlaggingReporter(null);
    setUpdateSuccess(null);
  };
  
  // Save trust level changes
  const saveTrustLevel = async () => {
    if (!editingReporter || !trustReason) return;
    
    try {
      const success = await updateReporterTrustManually(
        editingReporter.id,
        newTrustLevel,
        trustReason
      );
      
      if (success) {
        // Update reporter in state
        setReporters(prevReporters => 
          prevReporters.map(r => 
            r.id === editingReporter.id 
              ? { ...r, trustLevel: newTrustLevel, trustReason } 
              : r
          )
        );
        setUpdateSuccess('Trust level updated successfully');
        
        // Close modal after a delay
        setTimeout(() => {
          setEditingReporter(null);
          setUpdateSuccess(null);
        }, 2000);
      } else {
        setError('Failed to update trust level');
      }
    } catch (err) {
      console.error('Error updating trust level:', err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Save flag status
  const saveFlagStatus = async (isFlagged: boolean) => {
    if (!flaggingReporter) return;
    
    // Require reason if flagging
    if (isFlagged && !flagReason) return;
    
    try {
      const success = await updateReporterFlagStatus(
        flaggingReporter.id,
        isFlagged,
        flagReason
      );
      
      if (success) {
        // Update reporter in state
        setReporters(prevReporters => 
          prevReporters.map(r => 
            r.id === flaggingReporter.id 
              ? { ...r, flagged: isFlagged, flagReason: isFlagged ? flagReason : '' } 
              : r
          )
        );
        
        setUpdateSuccess(isFlagged ? 'Reporter flagged successfully' : 'Flag removed successfully');
        
        // Close modal after a delay
        setTimeout(() => {
          setFlaggingReporter(null);
          setUpdateSuccess(null);
        }, 2000);
      } else {
        setError('Failed to update flag status');
      }
    } catch (err) {
      console.error('Error updating flag status:', err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Recalculate trust level for a reporter
  const handleRecalculate = async (reporterId: string) => {
    try {
      const success = await recalculateReporterTrust(reporterId);
      if (success) {
        // Refresh data
        await fetchReporters();
        setUpdateSuccess('Trust level recalculated');
        setTimeout(() => setUpdateSuccess(null), 2000);
      } else {
        setError('Failed to recalculate trust level');
      }
    } catch (err) {
      console.error('Error recalculating trust:', err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Recalculate all trust levels
  const handleRecalculateAll = async () => {
    try {
      setRecalculatingAll(true);
      const updatedCount = await recalculateAllReportersTrust();
      
      // Refresh data
      await fetchReporters();
      setUpdateSuccess(`Recalculated trust levels for ${updatedCount} reporters`);
      setTimeout(() => setUpdateSuccess(null), 2000);
    } catch (err) {
      console.error('Error recalculating all trust levels:', err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRecalculatingAll(false);
    }
  };
  
  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReporters = filteredReporters.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReporters.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Calculate statistics
  const stats = {
    total: reporters.length,
    averageTrust: reporters.reduce((sum, r) => sum + (r.trustLevel || 0), 0) / 
                 (reporters.length || 1),
    averageReports: reporters.reduce((sum, r) => sum + (r.reportCount || 0), 0) / 
                   (reporters.length || 1),
    highTrust: reporters.filter(r => (r.trustLevel || 0) >= TRUST_LEVELS.TRUSTED).length
  };

  return (
    <div style={pageContainer}>
      <Navbar />
      
      <main style={mainContent}>
        <div style={header}>
          <h1 style={title}>Reporter Trust Management</h1>
          <div style={headerActions}>
            <button 
              style={{
                ...button,
                ...recalculateButton,
                ...(recalculatingAll ? disabledButton : {})
              }}
              onClick={handleRecalculateAll}
              disabled={recalculatingAll}
            >
              {recalculatingAll ? 'Recalculating...' : 'Recalculate All Trust Levels'}
            </button>
          </div>
        </div>
        
        {updateSuccess && (
          <div style={successAlert}>
            <p>{updateSuccess}</p>
          </div>
        )}
        
        {error && (
          <div style={errorContainer}>
            <p style={errorText}>{error}</p>
            <button style={retryButton} onClick={() => {setError(null); fetchReporters();}}>
              Retry
            </button>
          </div>
        )}
        
        <div style={statsRow}>
          <div style={statCard}>
            <h3 style={statTitle}>Total Reporters</h3>
            <p style={statValue}>{stats.total}</p>
          </div>
          <div style={statCard}>
            <h3 style={statTitle}>Avg Trust Level</h3>
            <p style={statValue}>{stats.averageTrust.toFixed(1)}</p>
          </div>
          <div style={statCard}>
            <h3 style={statTitle}>Avg Reports per User</h3>
            <p style={statValue}>{stats.averageReports.toFixed(1)}</p>
          </div>
          <div style={statCard}>
            <h3 style={statTitle}>Trusted+ Reporters</h3>
            <p style={statValue}>{stats.highTrust} ({((stats.highTrust / stats.total) * 100).toFixed(1)}%)</p>
          </div>
        </div>
        
        {reporters.length > 0 && (
          <TrustDistributionChart reporters={reporters} />
        )}
        
        <div style={filtersContainer}>
          <div style={filterSection}>
            <input
              type="text"
              placeholder="Search reporters by name, email or phone"
              value={search}
              onChange={handleSearchChange}
              style={searchInput}
            />
          </div>
          <div style={filterSection}>
            <select
              value={trustFilter}
              onChange={handleTrustFilterChange}
              style={filterSelect}
            >
              <option value="all">All Trust Levels</option>
              <option value="new">New</option>
              <option value="basic">Basic</option>
              <option value="reliable">Reliable</option>
              <option value="trusted">Trusted</option>
              <option value="verified">Verified</option>
            </select>
          </div>
          <div style={filterSection}>
            <select
              value={flagFilter}
              onChange={handleFlagFilterChange}
              style={filterSelect}
            >
              <option value="all">All Flags</option>
              <option value="flagged">Flagged</option>
              <option value="unflagged">Unflagged</option>
            </select>
          </div>
          <div style={sortSection}>
            <label style={sortLabel}>Sort by:</label>
            <div style={sortButtons}>
              <button
                style={{
                  ...sortButton,
                  ...(sortOption === 'name' ? activeSortButton : {})
                }}
                onClick={() => handleSort('name')}
              >
                Name {sortOption === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button
                style={{
                  ...sortButton,
                  ...(sortOption === 'trustLevel' ? activeSortButton : {})
                }}
                onClick={() => handleSort('trustLevel')}
              >
                Trust Level {sortOption === 'trustLevel' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button
                style={{
                  ...sortButton,
                  ...(sortOption === 'reportCount' ? activeSortButton : {})
                }}
                onClick={() => handleSort('reportCount')}
              >
                Reports {sortOption === 'reportCount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button
                style={{
                  ...sortButton,
                  ...(sortOption === 'accuracy' ? activeSortButton : {})
                }}
                onClick={() => handleSort('accuracy')}
              >
                Accuracy {sortOption === 'accuracy' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div style={loadingContainer}>
            <p>Loading reporters...</p>
          </div>
        ) : (
          <div style={reportersContainer}>
            <table style={reportersTable}>
              <thead>
                <tr>
                  <th style={tableHeader}>Reporter</th>
                  <th style={tableHeader}>Trust Level</th>
                  <th style={tableHeader}>Reports</th>
                  <th style={tableHeader}>Accuracy</th>
                  <th style={tableHeader}>Status</th>
                  <th style={tableHeader}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentReporters.length > 0 ? (
                  currentReporters.map(reporter => (
                    <tr key={reporter.id} style={tableRow}>
                      <td style={tableCell}>
                        <div style={reporterInfo}>
                          <p style={reporterName}>{reporter.name}</p>
                          <p style={reporterEmail}>{reporter.email}</p>
                          {reporter.phone && <p style={reporterDetail}>{reporter.phone}</p>}
                        </div>
                      </td>
                      <td style={tableCell}>
                        <div style={trustLevelContainer}>
                          <div style={{
                            ...trustLevelBadge, 
                            backgroundColor: getTrustLevelColor(reporter.trustLevel)
                          }}>
                            {getTrustLevelLabel(reporter.trustLevel)}
                          </div>
                          <div style={trustLevelValue}>{reporter.trustLevel || 0}/100</div>
                          {reporter.trustReason && (
                            <div style={trustReasonStyle}>
                              {reporter.trustReason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={tableCell}>
                        <div style={reportStats}>
                          <div style={reportCount}>
                            <span style={reportLabel}>Total:</span> {reporter.reportCount || 0}
                          </div>
                          <div style={reportDetail}>
                            <span style={reportLabel}>Verified:</span> {reporter.verifiedReports || 0}
                          </div>
                          <div style={reportDetail}>
                            <span style={reportLabel}>False:</span> {reporter.falseReports || 0}
                          </div>
                        </div>
                      </td>
                      <td style={tableCell}>
                        {reporter.reportCount ? 
                          ((reporter.verifiedReports || 0) / reporter.reportCount * 100).toFixed(1) + '%' : 
                          'N/A'}
                      </td>
                      <td style={tableCell}>
                        <div style={statusContainer}>
                          {reporter.flagged ? (
                            <div style={flaggedStatus}>
                              ⚠️ Flagged
                              {reporter.flagReason && (
                                <div style={flagReasonStyle}>{reporter.flagReason}</div>
                              )}
                            </div>
                          ) : (
                            <div style={unflaggedStatus}>
                              ✓ OK
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={tableCell}>
                        <div style={actionButtons}>
                          <button
                            style={editButton}
                            onClick={() => startEditTrust(reporter)}
                          >
                            Edit Trust
                          </button>
                          <button
                            style={recalculateButton}
                            onClick={() => handleRecalculate(reporter.id)}
                          >
                            Recalculate
                          </button>
                          {reporter.flagged ? (
                            <button
                              style={unflagButton}
                              onClick={() => startFlagging(reporter)}
                            >
                              Remove Flag
                            </button>
                          ) : (
                            <button
                              style={flagButton}
                              onClick={() => startFlagging(reporter)}
                            >
                              Flag User
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={emptyTableMessage}>
                      {search || trustFilter !== 'all' || flagFilter !== 'all' ? 
                        'No reporters match your filters' : 
                        'No reporters found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Pagination */}
            {filteredReporters.length > itemsPerPage && (
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
                    (Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredReporters.length)} of {filteredReporters.length})
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
          </div>
        )}
      </main>
      
      {/* Edit Trust Level Modal */}
      {editingReporter && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={modalTitle}>Edit Trust Level</h2>
            <div style={modalBody}>
              <div style={reporterInfoBox}>
                <p style={reporterNameBold}>{editingReporter.name}</p>
                <p style={reporterEmail}>{editingReporter.email}</p>
              </div>
              
              <div style={formGroup}>
                <label style={formLabel}>Current Trust Level</label>
                <div style={{
                  ...trustLevelBadge,
                  backgroundColor: getTrustLevelColor(editingReporter.trustLevel)
                }}>
                  {getTrustLevelLabel(editingReporter.trustLevel)} 
                  ({editingReporter.trustLevel || 0}/100)
                </div>
              </div>
              
              <div style={formGroup}>
                <label style={formLabel}>New Trust Level</label>
                <div style={sliderContainer}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newTrustLevel}
                    onChange={(e) => setNewTrustLevel(Number(e.target.value))}
                    style={slider}
                  />
                  <div style={sliderValue}>
                    <span>{newTrustLevel}/100</span>
                    <span style={{
                      ...trustLevelBadge,
                      backgroundColor: getTrustLevelColor(newTrustLevel)
                    }}>
                      {getTrustLevelLabel(newTrustLevel)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={formGroup}>
                <label style={formLabel}>Reason for Change</label>
                <textarea
                  value={trustReason}
                  onChange={(e) => setTrustReason(e.target.value)}
                  style={textarea}
                  placeholder="Provide reason for trust level adjustment"
                  required
                />
              </div>
              
              {updateSuccess && (
                <div style={modalSuccessMessage}>
                  {updateSuccess}
                </div>
              )}
            </div>
            <div style={modalFooter}>
              <button style={cancelButton} onClick={cancelEdit}>
                Cancel
              </button>
              <button 
                style={{
                  ...saveButton,
                  ...(trustReason ? {} : disabledButton)
                }}
                onClick={saveTrustLevel}
                disabled={!trustReason}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Reporter Modal */}
      {flaggingReporter && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={modalTitle}>
              {flaggingReporter.flagged ? 'Remove Flag' : 'Flag Reporter'}
            </h2>
            <div style={modalBody}>
              <div style={reporterInfoBox}>
                <p style={reporterNameBold}>{flaggingReporter.name}</p>
                <p style={reporterEmail}>{flaggingReporter.email}</p>
              </div>
              
              {flaggingReporter.flagged ? (
                <div style={warningBox}>
                  <p>This reporter is currently flagged for suspicious activity.</p>
                  <p>Reason: {flaggingReporter.flagReason || 'No reason provided'}</p>
                  <p>Are you sure you want to remove the flag?</p>
                </div>
              ) : (
                <div style={formGroup}>
                  <label style={formLabel}>Reason for Flagging</label>
                  <textarea
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    style={textarea}
                    placeholder="Provide reason for flagging this reporter"
                    required
                  />
                </div>
              )}
              
              {updateSuccess && (
                <div style={modalSuccessMessage}>
                  {updateSuccess}
                </div>
              )}
            </div>
            <div style={modalFooter}>
              <button style={cancelButton} onClick={cancelFlagging}>
                Cancel
              </button>
              
              {flaggingReporter.flagged ? (
                <button 
                  style={unflagButton}
                  onClick={() => saveFlagStatus(false)}
                >
                  Remove Flag
                </button>
              ) : (
                <button 
                  style={{
                    ...flagButton,
                    ...(flagReason ? {} : disabledButton)
                  }}
                  onClick={() => saveFlagStatus(true)}
                  disabled={!flagReason}
                >
                  Flag Reporter
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const pageContainer: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f5f5f5'
};

const mainContent: React.CSSProperties = {
  padding: '2rem',
  marginTop: '69px',
};

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem'
};

const title: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 600,
  margin: 0
};

const headerActions: React.CSSProperties = {
  display: 'flex',
  gap: '1rem'
};

const button: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  border: 'none',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

const successAlert: React.CSSProperties = {
  backgroundColor: '#d4edda',
  color: '#155724',
  padding: '0.75rem 1.25rem',
  borderRadius: '6px',
  marginBottom: '1rem'
};

const errorContainer: React.CSSProperties = {
  backgroundColor: '#ffebee',
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const errorText: React.CSSProperties = {
  color: '#c62828',
  margin: '0 0 1rem 0',
  textAlign: 'center'
};

const retryButton: React.CSSProperties = {
  padding: '0.5rem 1rem',
  backgroundColor: '#f44336',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const statsRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
  marginBottom: '2rem'
};

const statCard: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '1.5rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  textAlign: 'center'
};

const statTitle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#555',
  margin: '0 0 0.5rem 0'
};

const statValue: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  margin: 0
};

const chartContainer: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '1.5rem',
  marginBottom: '2rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
};

const chartTitle: React.CSSProperties = {
  fontSize: '1.125rem',
  marginTop: 0,
  marginBottom: '1.5rem',
  textAlign: 'center'
};

const chartBars: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const chartBarContainer: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
};

const chartLabel: React.CSSProperties = {
  width: '80px',
  fontSize: '0.875rem',
  fontWeight: 500
};

const chartBarOuter: React.CSSProperties = {
  flex: 1,
  height: '24px',
  backgroundColor: '#f0f0f0',
  borderRadius: '4px',
  overflow: 'hidden'
};

const chartBar: React.CSSProperties = {
  height: '100%',
  transition: 'width 0.5s ease'
};

const chartCount: React.CSSProperties = {
  width: '40px',
  textAlign: 'right',
  fontSize: '0.875rem',
  fontWeight: 500
};

const filtersContainer: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '1.5rem'
};

const filterSection: React.CSSProperties = {
  flex: '1 1 250px'
};

const searchInput: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '6px',
  border: '1px solid #ddd',
  fontSize: '0.875rem'
};

const filterSelect: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '6px',
  border: '1px solid #ddd',
  fontSize: '0.875rem',
  backgroundColor: '#fff'
};

const sortSection: React.CSSProperties = {
  flex: '1 1 400px',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const sortLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#666'
};

const sortButtons: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem'
};

const sortButton: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: '4px',
  border: '1px solid #ddd',
  backgroundColor: '#f5f5f5',
  fontSize: '0.75rem',
  cursor: 'pointer'
};

const activeSortButton: React.CSSProperties = {
  backgroundColor: '#e1f5fe',
  borderColor: '#03a9f4',
  color: '#0277bd'
};

const loadingContainer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: '3rem'
};

const reportersContainer: React.CSSProperties = {
  overflowX: 'auto'
};

const reportersTable: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  overflow: 'hidden'
};

const tableHeader: React.CSSProperties = {
  textAlign: 'left',
  padding: '1rem',
  backgroundColor: '#f9f9f9',
  borderBottom: '1px solid #eee',
  fontSize: '0.875rem',
  fontWeight: 600
};

const tableRow: React.CSSProperties = {
  borderBottom: '1px solid #eee'
};

const tableCell: React.CSSProperties = {
  padding: '1rem',
  verticalAlign: 'top'
};

const emptyTableMessage: React.CSSProperties = {
  textAlign: 'center',
  padding: '2rem',
  color: '#666'
};

const reporterInfo: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
};

const reporterName: React.CSSProperties = {
  margin: 0,
  fontSize: '0.875rem',
  fontWeight: 500
};

const reporterEmail: React.CSSProperties = {
  margin: 0,
  fontSize: '0.75rem',
  color: '#666'
};

const reporterDetail: React.CSSProperties = {
  margin: 0,
  fontSize: '0.75rem',
  color: '#666'
};

const trustLevelContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem'
};

const trustLevelBadge: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.25rem 0.5rem',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: '#fff'
};

const trustLevelValue: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#666'
};

const trustReasonStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#666',
  marginTop: '0.25rem',
  fontStyle: 'italic'
};

const reportStats: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
};

const reportCount: React.CSSProperties = {
  margin: 0,
  fontSize: '0.875rem'
};

const reportDetail: React.CSSProperties = {
  margin: 0,
  fontSize: '0.75rem',
  color: '#666'
};

const reportLabel: React.CSSProperties = {
  fontWeight: 500
};

const actionButtons: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const editButton: React.CSSProperties = {
  ...button,
  backgroundColor: '#3498db',
  color: '#fff'
};

const recalculateButton: React.CSSProperties = {
  ...button,
  backgroundColor: '#6c757d',
  color: '#fff'
};

const disabledButton: React.CSSProperties = {
  opacity: 0.6,
  cursor: 'not-allowed'
};

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContent: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '500px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  maxHeight: '90vh',
  overflow: 'auto'
};

const modalTitle: React.CSSProperties = {
  margin: 0,
  padding: '1.5rem',
  borderBottom: '1px solid #eee',
  fontSize: '1.25rem',
  fontWeight: 600
};

const modalBody: React.CSSProperties = {
  padding: '1.5rem'
};

const reporterInfoBox: React.CSSProperties = {
  marginBottom: '1.5rem',
  padding: '1rem',
  backgroundColor: '#f9f9f9',
  borderRadius: '6px'
};

const reporterNameBold: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  margin: '0 0 0.25rem 0'
};

const formGroup: React.CSSProperties = {
  marginBottom: '1.5rem'
};

const formLabel: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.875rem',
  color: '#555',
  fontWeight: 500
};

const sliderContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const slider: React.CSSProperties = {
  width: '100%'
};

const sliderValue: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const textarea: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '4px',
  border: '1px solid #ddd',
  fontSize: '0.875rem',
  minHeight: '100px',
  resize: 'vertical'
};

const modalSuccessMessage: React.CSSProperties = {
  backgroundColor: '#d4edda',
  color: '#155724',
  padding: '0.75rem',
  borderRadius: '4px',
  marginBottom: '1rem',
  textAlign: 'center'
};

const modalFooter: React.CSSProperties = {
  padding: '1rem 1.5rem',
  borderTop: '1px solid #eee',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem'
};

const cancelButton: React.CSSProperties = {
  ...button,
  backgroundColor: '#f5f5f5',
  color: '#333'
};

const saveButton: React.CSSProperties = {
  ...button,
  backgroundColor: '#28a745',
  color: '#fff'
};

const statusContainer: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  borderRadius: '4px',
  backgroundColor: '#f0f0f0',
  fontSize: '0.75rem',
  fontWeight: 500
};

const flaggedStatus: React.CSSProperties = {
  color: '#c62828',
  fontWeight: 500
};

const unflaggedStatus: React.CSSProperties = {
  color: '#28a745',
  fontWeight: 500
};

const flagReasonStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#666',
  marginTop: '0.25rem',
  fontStyle: 'italic'
};

const unflagButton: React.CSSProperties = {
  ...button,
  backgroundColor: '#f44336',
  color: '#fff'
};

const flagButton: React.CSSProperties = {
  ...button,
  backgroundColor: '#dc3545',
  color: '#fff'
};

const warningBox: React.CSSProperties = {
  backgroundColor: '#ffebee',
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '1.5rem',
  textAlign: 'center'
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

export default TrustManagement; 