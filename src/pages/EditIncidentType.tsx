import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import Navbar from '../components/Navbar';

interface IncidentTypeForm {
  name: string;
  description: string;
  severity: string;
  iconUrl?: string;
}

const EditIncidentType: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<IncidentTypeForm>({
    name: '',
    description: '',
    severity: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchIncidentType = async () => {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'incidentTypes', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setForm({
            name: data.name,
            description: data.description,
            severity: data.severity,
            iconUrl: data.iconUrl || undefined,
          });
          
          if (data.iconUrl) {
            setImagePreview(data.iconUrl);
          }
        } else {
          setError('Incident type not found');
        }
      } catch (error) {
        console.error('Error fetching incident type:', error);
        setError('Failed to fetch incident type');
      }
    };

    fetchIncidentType();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File) => {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `incident-icons/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const deleteCurrentImage = async () => {
    if (form.iconUrl) {
      try {
        // Extract file path from URL
        const imageRef = ref(storage, form.iconUrl);
        await deleteObject(imageRef);
      } catch (error) {
        console.error("Error deleting image from storage:", error);
        // Continue even if delete fails - the file might not exist
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setError('');
    setLoading(true);

    try {
      if (!form.name || !form.description || !form.severity) {
        throw new Error('All fields are required');
      }

      let iconUrl = form.iconUrl;
      
      // If a new image is selected, upload it
      if (imageFile) {
        // If there's an existing image, try to delete it
        if (form.iconUrl) {
          await deleteCurrentImage();
        }
        
        // Upload new image
        iconUrl = await uploadImage(imageFile);
      }

      const docRef = doc(db, 'incidentTypes', id);
      await updateDoc(docRef, {
        ...form,
        iconUrl,
        updatedAt: new Date(),
      });

      navigate('/incident-types');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm({ ...form, iconUrl: undefined });
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      // Delete the image from storage if it exists
      if (form.iconUrl) {
        await deleteCurrentImage();
      }
      
      // Delete the document from Firestore
      await deleteDoc(doc(db, 'incidentTypes', id));
      navigate('/incident-types');
    } catch (error) {
      console.error('Error deleting incident type:', error);
      setError('Failed to delete incident type');
    }
  };

  return (
    <div style={pageContainer}>
      <Navbar />
      <main style={mainContent}>
        <div style={backButtonContainer}>
          <button
            style={backButton}
            onClick={() => navigate('/incident-types')}
          >
            Back to Incident Types
          </button>
        </div>
        <div style={card}>
          <h2 style={title}>Edit Incident Type</h2>
          
          {error && <p style={errorText}>{error}</p>}
          
          <form style={formStyle} onSubmit={handleSubmit}>
            <div style={inputGroup}>
              <label style={label}>Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter incident type name"
                style={input}
              />
            </div>

            <div style={inputGroup}>
              <label style={label}>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter incident type description"
                rows={4}
                style={textarea}
              />
            </div>

            <div style={inputGroup}>
              <label style={label}>Severity</label>
              <select
                name="severity"
                value={form.severity}
                onChange={handleChange}
                style={select}
              >
                <option value="">Select severity level</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div style={inputGroup}>
              <label style={label}>Icon Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={fileInput}
              />
              {imagePreview && (
                <div style={imagePreviewContainer}>
                  <img src={imagePreview} alt="Preview" style={imagePreviewStyle} />
                  <button 
                    type="button" 
                    onClick={handleRemoveImage} 
                    style={removeImageButton}
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>

            <div style={buttonGroup}>
              <button
                type="submit"
                style={submitButton}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                style={deleteButton}
                onClick={() => setDeleteModalOpen(true)}
              >
                Delete
              </button>
              <button
                type="button"
                style={cancelButton}
                onClick={() => navigate('/incident-types')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>

      {deleteModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={modalTitle}>Delete Incident Type</h3>
            <p style={modalText}>
              Are you sure you want to delete "{form.name}"? This action cannot be undone.
            </p>
            <div style={modalActions}>
              <button
                style={modalCancelButton}
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                style={modalDeleteButton}
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
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

const card: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '2rem',
  maxWidth: '600px',
  margin: '0 auto',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
};

const title: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 600,
  color: '#000',
  marginBottom: '2rem',
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
  color: '#666',
};

const input: React.CSSProperties = {
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '1rem',
  transition: 'border-color 0.2s ease',
};

const textarea: React.CSSProperties = {
  ...input,
  resize: 'vertical',
  minHeight: '100px',
};

const select: React.CSSProperties = {
  ...input,
  backgroundColor: '#fff',
};

const fileInput: React.CSSProperties = {
  padding: '0.5rem 0',
};

const imagePreviewContainer: React.CSSProperties = {
  marginTop: '0.5rem',
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '0.5rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
};

const imagePreviewStyle: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: '200px',
  objectFit: 'contain',
};

const removeImageButton: React.CSSProperties = {
  backgroundColor: '#e74c3c',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  padding: '0.25rem 0.5rem',
  fontSize: '0.75rem',
  cursor: 'pointer',
};

const buttonGroup: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  marginTop: '1rem',
};

const submitButton: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#2ecc71',
  color: '#fff',
  padding: '0.75rem',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const deleteButton: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#e74c3c',
  color: '#fff',
  padding: '0.75rem',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const cancelButton: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#f5f5f5',
  color: '#666',
  padding: '0.75rem',
  borderRadius: '8px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const errorText: React.CSSProperties = {
  color: '#e74c3c',
  fontSize: '0.875rem',
  marginBottom: '1rem',
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
  zIndex: 1000,
};

const modalContent: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '2rem',
  width: '90%',
  maxWidth: '400px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const modalTitle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#000',
  margin: '0 0 1rem 0',
};

const modalText: React.CSSProperties = {
  fontSize: '1rem',
  color: '#666',
  margin: '0 0 1.5rem 0',
};

const modalActions: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
};

const modalCancelButton: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#f5f5f5',
  color: '#666',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const modalDeleteButton: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#e74c3c',
  color: '#fff',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
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

export default EditIncidentType; 