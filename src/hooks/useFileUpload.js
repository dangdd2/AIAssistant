import { useState, useRef, useCallback } from 'react';
import { SUPPORTED_FILE_TYPES } from '../constants/config';

/**
 * Create a system message for uploads
 * @param {string} content - Message content
 * @returns {object} System message object
 */
const createSystemMessage = (content) => ({
  role: 'system',
  content,
  timestamp: new Date().toISOString(),
});

/**
 * Custom hook for managing file uploads
 * @param {function} addMessage - Function to add a message
 * @returns {object} Upload state and handlers
 */
export const useFileUpload = (addMessage) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileUpload = useCallback(
    async (e) => {
      const files = Array.from(e.target.files);

      for (const file of files) {
        // Handle images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Image = event.target.result.split(',')[1];
            setUploadedImages((prev) => [
              ...prev,
              {
                name: file.name,
                data: base64Image,
                type: file.type,
              },
            ]);

            addMessage(createSystemMessage(`📷 Image uploaded: ${file.name}`));
          };
          reader.readAsDataURL(file);
        }
        // Handle text files
        else if (
          file.type === 'text/plain' ||
          SUPPORTED_FILE_TYPES.TEXT.some((ext) => file.name.endsWith(ext))
        ) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target.result;
            setUploadedFiles((prev) => [
              ...prev,
              {
                name: file.name,
                content: content,
                type: file.type,
              },
            ]);

            addMessage(
              createSystemMessage(`📄 Document uploaded: ${file.name} (${content.length} characters)`)
            );
          };
          reader.readAsText(file);
        }
        // Handle PDFs
        else if (
          file.type === 'application/pdf' ||
          file.name.endsWith('.pdf')
        ) {
          addMessage(
            createSystemMessage(
              `📄 PDF uploaded: ${file.name}. Note: For full PDF support, you'll need to add a PDF library. For now, I can help with text files and images.`
            )
          );
        } else {
          alert(`File type not supported yet: ${file.type}. Supported: images, .txt, .md, .json`);
        }
      }

      // Reset input
      e.target.value = '';
    },
    [addMessage]
  );

  const clearUploads = useCallback(() => {
    setUploadedFiles([]);
    setUploadedImages([]);
    addMessage(createSystemMessage('🗑️ All uploaded files cleared'));
  }, [addMessage]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const hasUploads = uploadedFiles.length > 0 || uploadedImages.length > 0;
  const totalUploads = uploadedFiles.length + uploadedImages.length;

  return {
    uploadedFiles,
    uploadedImages,
    fileInputRef,
    handleFileUpload,
    clearUploads,
    triggerFileInput,
    hasUploads,
    totalUploads,
  };
};
