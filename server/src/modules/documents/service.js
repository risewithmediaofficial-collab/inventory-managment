import Document from './model.js';

export const getDocuments = async (query = {}) => {
  const filter = {};
  if (query.relatedModel && query.relatedId) {
    filter.relatedModel = query.relatedModel;
    filter.relatedId = query.relatedId;
  }
  if (query.category) filter.category = query.category;
  if (query.branch) filter.branch = query.branch;

  return await Document.find(filter).populate('uploadedBy', 'name').sort({ createdAt: -1 });
};

export const createDocument = async (data, userId) => {
  return await Document.create({ ...data, uploadedBy: userId });
};

export const deleteDocument = async (id) => {
  return await Document.findByIdAndDelete(id);
};
