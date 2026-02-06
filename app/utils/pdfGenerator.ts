import { jsPDF } from 'jspdf';
import type { DocumentData } from '~/types/document';

const createPDFDocument = async (document: DocumentData): Promise<jsPDF> => {
	const pdf = new jsPDF('p', 'mm', 'a4');
	const pageWidth = pdf.internal.pageSize.getWidth();
	const pageHeight = pdf.internal.pageSize.getHeight();
	const margin = 20;
	const contentWidth = pageWidth - margin * 2;
	let yPos = margin;

	// Colors - Black and white theme
	const black = [0, 0, 0];
	const darkGray = [50, 50, 50];
	const mediumGray = [100, 100, 100];
	const lightGray = [180, 180, 180];
	const bgGray = [245, 245, 245];

	// Helper functions
	const addNewPageIfNeeded = (neededSpace: number): void => {
		if (yPos + neededSpace > pageHeight - margin) {
			pdf.addPage();
			yPos = margin;
		}
	};

	const drawLine = (y: number): void => {
		pdf.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
		pdf.setLineWidth(0.3);
		pdf.line(margin, y, pageWidth - margin, y);
	};

	// ===== HEADER =====
	// Load and add logo
	try {
		const logoImg = await loadImage('/Yzen-Logo-With-Name.png');
		pdf.addImage(logoImg, 'PNG', margin, yPos, 40, 10);
	} catch (error) {
		// Fallback: show placeholder if logo fails to load
		pdf.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
		pdf.rect(margin, yPos, 40, 10, 'F');
		pdf.setFontSize(8);
		pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
		pdf.text('YZEN', margin + 20, yPos + 6, { align: 'center' });
	}

	// Title (right side)
	pdf.setFontSize(18);
	pdf.setTextColor(black[0], black[1], black[2]);
	pdf.setFont('helvetica', 'bold');
	pdf.text('PROPUESTA DE DESARROLLO', pageWidth - margin, yPos + 8, { align: 'right' });

	// Subtitle with date
	pdf.setFontSize(10);
	pdf.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
	pdf.setFont('helvetica', 'normal');
	pdf.text(formatDate(document.fecha), pageWidth - margin, yPos + 16, { align: 'right' });

	yPos += 30;

	// ===== CLIENT AND PROJECT INFO =====
	drawLine(yPos);
	yPos += 8;

	pdf.setFontSize(10);
	pdf.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
	pdf.setFont('helvetica', 'normal');
	pdf.text('Cliente:', margin, yPos);
	pdf.text('Proyecto:', margin, yPos + 8);

	pdf.setTextColor(black[0], black[1], black[2]);
	pdf.setFont('helvetica', 'bold');
	pdf.text(document.cliente || '-', margin + 25, yPos);
	pdf.text(document.nombreProyecto || '-', margin + 25, yPos + 8);

	yPos += 20;
	drawLine(yPos);
	yPos += 12;

	// ===== SECTION COUNTER =====
	let sectionNumber = 1;

	// ===== OBJETIVO GENERAL =====
	if (document.objetivoGeneral) {
		addNewPageIfNeeded(40);

		pdf.setFontSize(11);
		pdf.setTextColor(black[0], black[1], black[2]);
		pdf.setFont('helvetica', 'bold');
		pdf.text(`${sectionNumber}. OBJETIVO DEL PROYECTO`, margin, yPos);
		sectionNumber++;

		yPos += 8;

		pdf.setFontSize(10);
		pdf.setFont('helvetica', 'normal');
		pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
		const objetivoLines = pdf.splitTextToSize(document.objetivoGeneral, contentWidth);
		pdf.text(objetivoLines, margin, yPos);
		yPos += objetivoLines.length * 5 + 10;
	}

	// ===== ALCANCE FUNCIONAL (MÓDULOS) =====
	if (document.modulos && document.modulos.length > 0 && document.modulos.some(m => m.nombre)) {
		addNewPageIfNeeded(30);

		pdf.setFontSize(11);
		pdf.setTextColor(black[0], black[1], black[2]);
		pdf.setFont('helvetica', 'bold');
		pdf.text(`${sectionNumber}. ALCANCE FUNCIONAL`, margin, yPos);
		sectionNumber++;

		yPos += 10;

		document.modulos.forEach((modulo, index) => {
			if (!modulo.nombre) return;

			addNewPageIfNeeded(25);

			// Module header
			const moduleLabel = String.fromCharCode(65 + index); // A, B, C...
			pdf.setFontSize(10);
			pdf.setTextColor(black[0], black[1], black[2]);
			pdf.setFont('helvetica', 'bold');
			pdf.text(`Módulo ${moduleLabel}: ${modulo.nombre}`, margin + 5, yPos);

			yPos += 6;

			// Module description
			if (modulo.descripcion) {
				pdf.setFontSize(9);
				pdf.setFont('helvetica', 'italic');
				pdf.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
				const descLines = pdf.splitTextToSize(modulo.descripcion, contentWidth - 10);
				pdf.text(descLines, margin + 5, yPos);
				yPos += descLines.length * 4 + 4;
			}

			// Functionalities
			if (modulo.funcionalidades && modulo.funcionalidades.length > 0) {
				modulo.funcionalidades.forEach((func) => {
					if (!func) return;
					addNewPageIfNeeded(8);

					pdf.setFontSize(9);
					pdf.setFont('helvetica', 'normal');
					pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
					pdf.text('•', margin + 8, yPos);
					const funcLines = pdf.splitTextToSize(func, contentWidth - 20);
					pdf.text(funcLines, margin + 14, yPos);
					yPos += funcLines.length * 4 + 2;
				});
			}

			yPos += 6;
		});
	}

	// ===== REQUERIMIENTOS DE DISEÑO =====
	if (document.requerimientosDiseno) {
		addNewPageIfNeeded(35);

		pdf.setFontSize(11);
		pdf.setTextColor(black[0], black[1], black[2]);
		pdf.setFont('helvetica', 'bold');
		pdf.text(`${sectionNumber}. REQUERIMIENTOS DE DISEÑO`, margin, yPos);
		sectionNumber++;

		yPos += 8;

		pdf.setFontSize(10);
		pdf.setFont('helvetica', 'normal');
		pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
		const reqLines = pdf.splitTextToSize(document.requerimientosDiseno, contentWidth);
		pdf.text(reqLines, margin, yPos);
		yPos += reqLines.length * 5 + 10;
	}

	// ===== EXCLUSIONES =====
	if (document.exclusiones && document.exclusiones.some(e => e)) {
		addNewPageIfNeeded(35);

		pdf.setFontSize(11);
		pdf.setTextColor(black[0], black[1], black[2]);
		pdf.setFont('helvetica', 'bold');
		pdf.text(`${sectionNumber}. EXCLUSIONES`, margin, yPos);
		sectionNumber++;

		yPos += 8;

		document.exclusiones.forEach((exclusion) => {
			if (!exclusion) return;
			addNewPageIfNeeded(10);

			pdf.setFontSize(9);
			pdf.setFont('helvetica', 'normal');
			pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
			pdf.text('–', margin + 3, yPos);
			const exLines = pdf.splitTextToSize(exclusion, contentWidth - 10);
			pdf.text(exLines, margin + 10, yPos);
			yPos += exLines.length * 4 + 3;
		});

		yPos += 6;
	}

	// ===== PROPUESTA ECONÓMICA =====
	if (document.inversionTotal || document.formaPago || document.plazoEntrega) {
		addNewPageIfNeeded(60);

		pdf.setFontSize(11);
		pdf.setTextColor(black[0], black[1], black[2]);
		pdf.setFont('helvetica', 'bold');
		pdf.text(`${sectionNumber}. PROPUESTA ECONÓMICA`, margin, yPos);
		sectionNumber++;

		yPos += 10;

		// Investment total box
		if (document.inversionTotal) {
			pdf.setFillColor(bgGray[0], bgGray[1], bgGray[2]);
			pdf.rect(margin, yPos, contentWidth, 16, 'F');

			pdf.setFontSize(10);
			pdf.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
			pdf.setFont('helvetica', 'normal');
			pdf.text('Inversión Total:', margin + 5, yPos + 10);

			pdf.setFontSize(14);
			pdf.setTextColor(black[0], black[1], black[2]);
			pdf.setFont('helvetica', 'bold');
			pdf.text(formatCurrency(document.inversionTotal), pageWidth - margin - 5, yPos + 10, { align: 'right' });

			yPos += 22;
		}

		// Forma de Pago - with text wrapping for long text
		if (document.formaPago) {
			pdf.setFontSize(10);
			pdf.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
			pdf.setFont('helvetica', 'normal');
			pdf.text('Forma de Pago:', margin, yPos);

			pdf.setTextColor(black[0], black[1], black[2]);
			pdf.setFont('helvetica', 'bold');
			const formaPagoLines = pdf.splitTextToSize(document.formaPago, contentWidth - 40);
			pdf.text(formaPagoLines, margin + 40, yPos);
			yPos += formaPagoLines.length * 5 + 6;
		}

		// Plazo de Entrega - with text wrapping for long text
		if (document.plazoEntrega) {
			pdf.setFontSize(10);
			pdf.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
			pdf.setFont('helvetica', 'normal');
			pdf.text('Plazo de Entrega:', margin, yPos);

			pdf.setTextColor(black[0], black[1], black[2]);
			pdf.setFont('helvetica', 'bold');
			const plazoLines = pdf.splitTextToSize(document.plazoEntrega, contentWidth - 45);
			pdf.text(plazoLines, margin + 45, yPos);
			yPos += plazoLines.length * 5 + 6;
		}

		yPos += 10;
	}

	// ===== OBSERVACIONES =====
	if (document.observaciones) {
		addNewPageIfNeeded(30);

		pdf.setFontSize(11);
		pdf.setTextColor(black[0], black[1], black[2]);
		pdf.setFont('helvetica', 'bold');
		pdf.text(`${sectionNumber}. OBSERVACIONES`, margin, yPos);
		sectionNumber++;

		yPos += 8;

		pdf.setFontSize(10);
		pdf.setFont('helvetica', 'normal');
		pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
		const obsLines = pdf.splitTextToSize(document.observaciones, contentWidth);
		pdf.text(obsLines, margin, yPos);
		yPos += obsLines.length * 5 + 10;
	}

	// ===== FIRMA DE CONFORMIDAD =====
	addNewPageIfNeeded(50);

	yPos += 10;
	drawLine(yPos);
	yPos += 20;

	pdf.setFontSize(10);
	pdf.setTextColor(black[0], black[1], black[2]);
	pdf.setFont('helvetica', 'bold');
	pdf.text('FIRMA DE CONFORMIDAD', pageWidth / 2, yPos, { align: 'center' });

	yPos += 25;

	// Signature lines
	const signatureWidth = (contentWidth - 20) / 2;

	// Left signature line
	pdf.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
	pdf.line(margin, yPos, margin + signatureWidth, yPos);
	pdf.setFontSize(8);
	pdf.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
	pdf.setFont('helvetica', 'normal');
	pdf.text('Firma', margin + signatureWidth / 2, yPos + 5, { align: 'center' });

	// Right signature line
	pdf.line(pageWidth - margin - signatureWidth, yPos, pageWidth - margin, yPos);
	pdf.text('Aclaración', pageWidth - margin - signatureWidth / 2, yPos + 5, { align: 'center' });

	// ===== FOOTER =====
	const footerY = pageHeight - 10;
	pdf.setFontSize(7);
	pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
	pdf.text('Documento generado por Yzen', pageWidth / 2, footerY, { align: 'center' });

	return pdf;
};

// Generate PDF and download it
export const generatePDF = async (document: DocumentData): Promise<void> => {
	const pdf = await createPDFDocument(document);
	const clientName = document.cliente ? document.cliente.replace(/\s+/g, '_') : 'documento';
	const fileName = `propuesta_${clientName}_${document.fecha || 'sin_fecha'}.pdf`;
	pdf.save(fileName);
};

// Generate PDF and return as Blob (for preview)
export const generatePDFBlob = async (document: DocumentData): Promise<Blob> => {
	const pdf = await createPDFDocument(document);
	return pdf.output('blob');
};

// Helper functions
const formatDate = (dateStr: string): string => {
	if (!dateStr) return '';
	const date = new Date(dateStr);
	return date.toLocaleDateString('es-AR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
};

const formatCurrency = (value: string): string => {
	if (!value) return '-';
	// Remove currency symbols and spaces, keep numbers, dots and commas
	let cleanValue = value.replace(/[$\s]/g, '');
	// In Argentina, dot is thousands separator and comma is decimal separator
	// If the value contains dots but no commas, treat dots as thousands separators
	if (cleanValue.includes('.') && !cleanValue.includes(',')) {
		// Remove dots (thousands separator) to get the actual number
		cleanValue = cleanValue.replace(/\./g, '');
	} else if (cleanValue.includes(',')) {
		// If there's a comma, it's the decimal separator
		// Remove dots (thousands) and replace comma with dot for parsing
		cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
	}
	const num = parseFloat(cleanValue);
	if (isNaN(num)) return value;
	// Format as Argentine pesos
	return `ARS ${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Load image as data URL for PDF
const loadImage = (src: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			if (ctx) {
				ctx.drawImage(img, 0, 0);
				resolve(canvas.toDataURL('image/png'));
			} else {
				reject(new Error('Failed to get canvas context'));
			}
		};
		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = src;
	});
};
