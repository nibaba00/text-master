import {
  getDocument,
  listDocuments,
  saveDocument,
} from '../services/documentService';

export function createDocumentStore() {
  return {
    listDocuments,
    getDocument,
    saveDocument,
  };
}
