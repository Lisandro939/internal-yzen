import type { DocumentData } from '~/types/document';

const STORAGE_KEY = 'yzen_documents';

export const getDocuments = (): DocumentData[] => {
	if (typeof window === 'undefined') return [];

	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return [];

	try {
		return JSON.parse(stored);
	} catch {
		return [];
	}
};

export const saveDocument = (document: DocumentData): void => {
	const documents = getDocuments();
	const existingIndex = documents.findIndex((d) => d.id === document.id);

	if (existingIndex >= 0) {
		documents[existingIndex] = document;
	} else {
		documents.unshift(document);
	}

	localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
};

export const deleteDocument = (id: string): void => {
	const documents = getDocuments().filter((d) => d.id !== id);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
};

export const getDocumentById = (id: string): DocumentData | undefined => {
	return getDocuments().find((d) => d.id === id);
};
