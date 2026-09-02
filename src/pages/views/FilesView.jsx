import React, { useState, useEffect } from 'react';
import { Search, Upload, FileText, File, FileImage, Film, Archive, MoreHorizontal, Download, Eye, Trash2, Filter } from 'lucide-react';
import API_URL from '../../api';
import UploadModal from '../../components/files/UploadModal';
import FilePreviewModal from '../../components/files/FilePreviewModal';

const getFileIcon = (type) => {
  const t = type?.toLowerCase();
  if (['pdf'].includes(t)) return <FileText className="text-red-500" size={24} />;
  if (['jpg', 'jpeg', 'png', 'gif'].includes(t)) return <FileImage className="text-green-500" size={24} />;
  if (['zip', 'rar'].includes(t)) return <Archive className="text-blue-500" size={24} />;
  if (['mp4', 'avi'].includes(t)) return <Film className="text-purple-500" size={24} />;
  return <File className="text-gray-500" size={24} />;
};

export default function FilesView({ loggedInUser, isAdmin }) {
  if (isAdmin) {
    return <AdminFilesView />;
  }
  return <EmployeeFilesView loggedInUser={loggedInUser} />;
}

// ==========================================
// EMPLOYEE FILES VIEW
// ==========================================
function EmployeeFilesView({ loggedInUser }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState('');

  const fetchFiles = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/files/my-files`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFiles(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDownload = async (file) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/files/${file._id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error downloading file');
    }
  };

  const filtered = files.filter(f => 
    f.originalFileName.toLowerCase().includes(search.toLowerCase()) ||
    f.documentType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#F8F9FD] p-6 min-w-0 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Files</h2>
          <p className="text-gray-500 text-sm mt-1">Upload and manage your important work documents.</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-brand-purple text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:bg-purple-700 transition-all"
        >
          <Upload size={18} /> Upload File
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6 max-w-md shadow-sm">
        <Search size={18} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search your documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-transparent outline-none text-sm w-full font-medium text-gray-700"
        />
      </div>

      {loading ? (
        <div className="text-gray-500">Loading your files...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">No documents found</h3>
          <p className="text-gray-500 mb-6">Upload your important work documents to keep them organized.</p>
          <button 
            onClick={() => setShowUpload(true)}
            className="text-brand-purple font-semibold hover:underline"
          >
            Upload your first file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(file => (
            <div key={file._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                  {getFileIcon(file.fileType)}
                </div>
                <button 
                  onClick={() => handleDownload(file)}
                  className="p-2 text-gray-400 hover:text-brand-purple hover:bg-purple-50 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download size={18} />
                </button>
              </div>
              
              <h3 className="font-bold text-gray-800 text-sm truncate mb-1" title={file.originalFileName}>
                {file.originalFileName}
              </h3>
              <p className="text-xs font-semibold text-brand-purple mb-4">{file.documentType}</p>
              
              <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                <span className="font-medium">{(file.fileSize / 1024).toFixed(0)} KB</span>
                <span className="flex items-center gap-1 text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                  ✓ Uploaded
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal 
          onClose={() => setShowUpload(false)} 
          onUploadSuccess={(newFile) => {
            setFiles([newFile, ...files]);
          }} 
        />
      )}
    </div>
  );
}

// ==========================================
// ADMIN FILES VIEW
// ==========================================
function AdminFilesView() {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [previewFile, setPreviewFile] = useState(null);

  const documentTypes = [
    'Joining Document', 'ID Proof', 'Address Proof', 
    'Education Certificate', 'Experience Certificate', 
    'Resume', 'Offer Letter', 'Bank Document', 
    'Tax Document', 'Project Document', 'Other'
  ];

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      // Fetch Stats
      fetch(`${API_URL}/api/admin/files/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => { if(data.success) setStats(data.data); });

      // Fetch Files
      const res = await fetch(`${API_URL}/api/admin/files?search=${search}&documentType=${documentType}&page=${page}&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFiles(data.data);
        setTotalPages(data.pagination.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, documentType, page]);

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete Document?\n\nEmployee: ${file.employeeName}\nFile: ${file.originalFileName}\n\nThis action cannot be undone.`)) return;

    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/files/${file._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      alert('Error deleting file');
    }
  };

  const handleDownload = async (file) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/files/${file._id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error downloading file');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FD] p-6 min-w-0 overflow-y-auto">
      {/* Header & Stats */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Employee Documents</h2>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-xl">📄</div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-xl">👥</div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Employees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.employeesWithDocuments}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center text-xl">⬆️</div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Uploaded Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.uploadedToday}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center text-xl">💾</div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">{stats.storageUsed}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 w-full md:w-96 shadow-sm">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search employees or files..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent outline-none text-sm w-full font-medium text-gray-700"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm">
            <Filter size={16} className="text-gray-400" />
            <select 
              value={documentType}
              onChange={(e) => { setDocumentType(e.target.value); setPage(1); }}
              className="bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer"
            >
              <option value="">All Document Types</option>
              {documentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Employee ID</th>
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Document Type</th>
                <th className="px-6 py-4">Upload Date</th>
                <th className="px-6 py-4">File Size</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">Loading documents...</td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <p className="text-gray-800 font-semibold text-base mb-1">No employee documents found.</p>
                    <p className="text-gray-500">Try changing your filters.</p>
                  </td>
                </tr>
              ) : (
                files.map(file => (
                  <tr key={file._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{file.employeeName}</td>
                    <td className="px-6 py-4 text-gray-500">{file.employeeId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.fileType)}
                        <span className="truncate max-w-[200px]" title={file.originalFileName}>{file.originalFileName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-700 font-medium px-2.5 py-1 rounded-md text-xs">{file.documentType}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(file.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      <br/>
                      <span className="text-xs text-gray-400">{new Date(file.uploadedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{(file.fileSize / 1024).toFixed(0)} KB</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setPreviewFile(file)}
                          className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Preview"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleDownload(file)}
                          className="p-1.5 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(file)}
                          className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-center gap-2 mt-auto bg-gray-50">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 font-medium">Page {page} of {totalPages}</span>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {previewFile && (
        <FilePreviewModal 
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
