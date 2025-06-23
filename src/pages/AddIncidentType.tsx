import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import Navbar from '../components/Navbar';

interface IncidentTypeForm {
  name: string;
  description: string;
  severity: string;
}

const AddIncidentType: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<IncidentTypeForm>({
    name: '',
    description: '',
    severity: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!form.name || !form.description || !form.severity) {
        throw new Error('All fields are required');
      }

      let iconUrl = null;
      if (imageFile) {
        iconUrl = await uploadImage(imageFile);
      }

      await addDoc(collection(db, 'incidentTypes'), {
        ...form,
        iconUrl,
        createdAt: serverTimestamp(),
      });

      navigate('/incident-types');
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
            onClick={() => navigate('/incident-types')}
          >
            Back to Incident Types
          </button>
        </div>
        <div style={card}>
          <h2 style={title}>Add Incident Type</h2>
          
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
                </div>
              )}
            </div>

            <div style={buttonGroup}>
              <button
                type="submit"
                style={submitButton}
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Incident Type'}
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
  justifyContent: 'center',
};

const imagePreviewStyle: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: '200px',
  objectFit: 'contain',
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

export default AddIncidentType; 