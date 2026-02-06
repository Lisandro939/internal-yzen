import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import type { DocumentData } from '~/types/document';
import { getDocumentById } from '~/services/documentService';
import { generatePDFBlob } from '~/utils/pdfGenerator';

export function meta() {
  return [
    { title: 'Ver Documento - Yzen' },
    { name: 'description', content: 'Visualizar documento' },
  ];
}

export default function VerDocumentoPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'pdf'>('info');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const loadDocument = async () => {
      if (id) {
        const doc = await getDocumentById(id);
        if (doc) {
          setDocument(doc);
        } else {
          navigate('/');
        }
      }
    };
    loadDocument();
  }, [id, navigate]);

  useEffect(() => {
    // Generate PDF when switching to PDF tab
    const generatePdfPreview = async () => {
      if (activeTab === 'pdf' && document && !pdfUrl) {
        setIsLoadingPdf(true);
        try {
          const blob = await generatePDFBlob(document);
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        } catch (error) {
          console.error('Error generating PDF:', error);
        } finally {
          setIsLoadingPdf(false);
        }
      }
    };
    generatePdfPreview();
  }, [activeTab, document, pdfUrl]);

  // Cleanup PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!document) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const tabs = [
    { id: 'info', label: 'Información', icon: '📋' },
    { id: 'pdf', label: 'Vista Previa PDF', icon: '📄' },
  ] as const;

  return (
    <div className="animate-fade-in w-full mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="section-title">{document.cliente || 'Sin cliente'}</h1>
            <p className="section-subtitle">{document.nombreProyecto || 'Sin nombre de proyecto'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/documentos/editar/${document.id}`} className="btn btn-secondary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-slate-200">
          <div className="flex gap-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body">
          {activeTab === 'info' ? (
            <div className="space-y-8">
              {/* Información General */}
              <section>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-sm">📋</span>
                  Información General
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">Cliente</p>
                    <p className="font-semibold text-slate-800">{document.cliente || '-'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">Fecha</p>
                    <p className="font-semibold text-slate-800">{formatDate(document.fecha)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg md:col-span-2">
                    <p className="text-sm text-slate-500 mb-1">Nombre del Proyecto</p>
                    <p className="font-semibold text-slate-800">{document.nombreProyecto || '-'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg md:col-span-2">
                    <p className="text-sm text-slate-500 mb-1">Objetivo del Proyecto</p>
                    <p className="text-slate-700 whitespace-pre-wrap">{document.objetivoGeneral || '-'}</p>
                  </div>
                  {document.requerimientosDiseno && (
                    <div className="p-4 bg-slate-50 rounded-lg md:col-span-2">
                      <p className="text-sm text-slate-500 mb-1">Requerimientos de Diseño/UX</p>
                      <p className="text-slate-700 whitespace-pre-wrap">{document.requerimientosDiseno}</p>
                    </div>
                  )}
                  {document.observaciones && (
                    <div className="p-4 bg-slate-50 rounded-lg md:col-span-2">
                      <p className="text-sm text-slate-500 mb-1">Observaciones</p>
                      <p className="text-slate-700 whitespace-pre-wrap">{document.observaciones}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Módulos */}
              {document.modulos && document.modulos.some(m => m.nombre) && (
                <section>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-sm">🧩</span>
                    Módulos
                  </h3>
                  <div className="space-y-4">
                    {document.modulos.filter(m => m.nombre).map((modulo, index) => (
                      <div key={modulo.id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <h4 className="font-semibold text-slate-800">{modulo.nombre}</h4>
                        </div>
                        {modulo.descripcion && (
                          <p className="text-slate-600 text-sm mb-3">{modulo.descripcion}</p>
                        )}
                        {modulo.funcionalidades.filter(f => f).length > 0 && (
                          <div>
                            <p className="text-sm text-slate-500 mb-2">Funcionalidades:</p>
                            <ul className="space-y-1">
                              {modulo.funcionalidades.filter(f => f).map((func, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                  <span className="text-cyan-500 mt-0.5">•</span>
                                  {func}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Exclusiones */}
              {document.exclusiones && document.exclusiones.some(e => e) && (
                <section>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-sm">❌</span>
                    Exclusiones
                  </h3>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <ul className="space-y-2">
                      {document.exclusiones.filter(e => e).map((exclusion, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700">
                          <span className="text-red-500 mt-0.5">•</span>
                          {exclusion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {/* Propuesta Económica */}
              <section>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-sm">💰</span>
                  Propuesta Económica
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-lg border border-emerald-100">
                    <p className="text-sm text-emerald-600 mb-1">Inversión Total</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {document.inversionTotal ? `ARS ${document.inversionTotal}` : '-'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">Forma de Pago</p>
                    <p className="font-semibold text-slate-800">{document.formaPago || '-'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">Plazo de Entrega</p>
                    <p className="font-semibold text-slate-800">{document.plazoEntrega || '-'}</p>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="relative">
              {isLoadingPdf ? (
                <div className="flex flex-col items-center justify-center h-[700px] bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-500">Generando vista previa del PDF...</p>
                </div>
              ) : pdfUrl ? (
                <iframe
                  ref={iframeRef}
                  src={pdfUrl}
                  className="w-full h-[700px] rounded-lg border border-slate-200"
                  title="Vista previa del PDF"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[700px] bg-slate-50 rounded-lg">
                  <p className="text-slate-500">Error al generar el PDF</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
