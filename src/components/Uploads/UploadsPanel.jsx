import React from 'react';

/**
 * Panel showing uploaded files and images
 */
const UploadsPanel = ({ uploadedFiles, uploadedImages, totalUploads }) => (
  <div className="uploads-panel">
    <div className="uploads-header">
      <strong>📎 Uploaded Files ({totalUploads})</strong>
      <span className="uploads-hint">AI can reference these in answers</span>
    </div>
    <div className="uploads-list">
      {uploadedFiles.map((file, idx) => (
        <div key={`file-${idx}`} className="upload-item">
          <span>📄 {file.name}</span>
          <span className="upload-size">{file.content.length} chars</span>
        </div>
      ))}
      {uploadedImages.map((img, idx) => (
        <div key={`img-${idx}`} className="upload-item">
          <span>📷 {img.name}</span>
          <span className="upload-size">Image</span>
        </div>
      ))}
    </div>
  </div>
);

export default UploadsPanel;
