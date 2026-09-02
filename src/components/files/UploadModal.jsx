import React, { useState, useRef } from 'react';
import API_URL from '../../api';

export default function UploadModal({ onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('Joining Document');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const documentTypes = [
    'Joining Document', 'ID Proof', 'Address Proof', 
    'Education Certificate', 'Experience Certificate', 
    'Resume', 'Offer Letter', 'Bank Document', 
    'Tax Document', 'Project Document', 'Other'
  ];

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('description', description);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/files/upload`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress(percent);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText);
        if (res.success) {
          onUploadSuccess(res.data);
          onClose();
        } else {
          setError(res.message || 'Upload failed.');
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          setError(res.message || 'An error occurred during upload.');
        } catch {
          setError('An error occurred during upload.');
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError('Network error occurred.');
    };

    xhr.send(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Upload Document</h3>
        
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
            {error}
          </div>
        )}

        <div 
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 mb-4 hover:bg-gray-100 cursor-pointer transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <div className="text-4xl mb-2">📄</div>
          <p className="text-gray-600 font-medium">Drag & Drop your file here</p>
          <p className="text-gray-400 text-sm mt-1">or</p>
          <button className="mt-2 text-brand-purple font-semibold">Browse Files</button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
          />
        </div>

        {file && (
          <div className="mb-4 text-sm text-gray-700 bg-purple-50 p-3 rounded-lg border border-purple-100">
            <span className="font-semibold">Selected:</span> {file.name}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Document Type:</label>
          <select 
            value={documentType} 
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-purple outline-none"
            disabled={uploading}
          >
            {documentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description:</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-purple outline-none resize-none h-20"
            placeholder="Optional description"
            disabled={uploading}
          ></textarea>
        </div>

        {uploading && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-brand-purple font-semibold">Uploading...</span>
              <span className="text-gray-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-brand-purple h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={uploading}
            className="px-4 py-2 bg-white text-gray-700 font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpload}
            disabled={uploading || !file}
            className="px-4 py-2 bg-brand-purple text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            Upload File
          </button>
        </div>
      </div>
    </div>
  );
}
