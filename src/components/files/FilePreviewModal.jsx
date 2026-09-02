import React, { useState } from 'react';
import API_URL from '../../../api';

export default function FilePreviewModal({ file, onClose }) {
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const safeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  
  const isSafeToPreview = safeTypes.includes(file.mimeType);
  const previewUrl = `${API_URL}/api/admin/files/${file._id}/preview?token=${token}`; // Assuming token in query, but standard is headers. For src/iframe, query is needed or we fetch as blob.

  // Fetch as blob to use headers
  const [blobUrl, setBlobUrl] = useState(null);
  const [fetchError, setFetchError] = useState('');

  React.useEffect(() => {
    if (isSafeToPreview) {
      fetch(`${API_URL}/api/admin/files/${file._id}/preview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Preview not available');
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);
      })
      .catch(err => {
        setFetchError(err.message);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [file]);

  const handleDownload = () => {
    fetch(`${API_URL}/api/admin/files/${file._id}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{file.originalFileName}</h3>
            <p className="text-sm text-gray-500">{file.employeeName} ({file.employeeId})</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-100 relative overflow-hidden flex items-center justify-center p-4">
          {loading && (
            <div className="text-gray-500 font-medium animate-pulse">Loading preview...</div>
          )}
          
          {!loading && isSafeToPreview && blobUrl && file.mimeType.startsWith('image/') && (
            <img src={blobUrl} alt={file.originalFileName} className="max-w-full max-h-full object-contain shadow-md" />
          )}

          {!loading && isSafeToPreview && blobUrl && file.mimeType === 'application/pdf' && (
            <iframe src={blobUrl} className="w-full h-full rounded shadow-sm border-0" title="PDF Preview" />
          )}

          {!loading && (!isSafeToPreview || fetchError) && (
            <div className="text-center">
              <div className="text-6xl mb-4">📄</div>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">Preview unavailable</h4>
              <p className="text-gray-500 mb-6">{fetchError || 'This file type cannot be previewed in the browser.'}</p>
              <button 
                onClick={handleDownload}
                className="bg-brand-purple text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
              >
                Download File
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-xl">
          <div className="text-sm text-gray-600">
            Type: <span className="font-semibold uppercase">{file.fileType}</span> &nbsp;|&nbsp; 
            Size: <span className="font-semibold">{(file.fileSize / 1024).toFixed(1)} KB</span>
          </div>
          {isSafeToPreview && !fetchError && (
            <button 
              onClick={handleDownload}
              className="text-brand-purple font-semibold hover:bg-purple-50 px-4 py-2 rounded-lg transition-colors"
            >
              Download Instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
