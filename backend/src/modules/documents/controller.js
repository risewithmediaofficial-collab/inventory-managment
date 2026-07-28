import * as documentService from './service.js';

export const getDocuments = async (req, res) => {
  const docs = await documentService.getDocuments(req.query);
  res.json({ success: true, count: docs.length, data: docs });
};

export const createDocument = async (req, res) => {
  const doc = await documentService.createDocument(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Document attached successfully', data: doc });
};

export const deleteDocument = async (req, res) => {
  await documentService.deleteDocument(req.params.id);
  res.json({ success: true, message: 'Document deleted' });
};
