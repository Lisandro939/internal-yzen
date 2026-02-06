import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import type { DocumentData } from '~/types/document';
import { getAllDocuments, deleteDocumentFromDb, saveDocumentToDb } from '~/services/documentService';

export function meta() {
  return [
    { title: 'Dashboard - Yzen' },
    { name: 'description', content: 'Sistema de gestión de documentos Yzen' },
  ];
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [hasLocalStorageData, setHasLocalStorageData] = useState(false);

  const loadDocuments = async () => {
    setIsLoading(true);
    const docs = await getAllDocuments();
    setDocuments(docs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadDocuments();
    // Check if there's data in localStorage to migrate
    const localData = localStorage.getItem('yzen_documents');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHasLocalStorageData(true);
        }
      } catch (e) {
        console.error('Error parsing localStorage data:', e);
      }
    }
  }, []);

  const handleMigrateFromLocalStorage = async () => {
    const localData = localStorage.getItem('yzen_documents');
    if (!localData) {
      alert('No hay datos en localStorage para migrar');
      return;
    }

    try {
      setIsMigrating(true);
      const documents: DocumentData[] = JSON.parse(localData);
      
      let migrated = 0;
      for (const doc of documents) {
        await saveDocumentToDb(doc);
        migrated++;
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('yzen_documents');
      setHasLocalStorageData(false);
      
      alert(`✅ Se migraron ${migrated} documentos exitosamente a la base de datos`);
      await loadDocuments();
    } catch (error) {
      console.error('Error migrating data:', error);
      alert('Error al migrar los datos: ' + (error as Error).message);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este documento?')) {
      await deleteDocumentFromDb(id);
      await loadDocuments();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      propuesta: 'Propuesta',
      presupuesto: 'Presupuesto',
      remito: 'Remito',
    };
    return labels[tipo] || tipo;
  };

  const getTipoBadgeClass = (tipo: string) => {
    const classes: Record<string, string> = {
      propuesta: 'badge-info',
      presupuesto: 'badge-success',
      remito: 'badge-warning',
    };
    return classes[tipo] || 'badge-info';
  };

  return (
    <div className="animate-fade-in md:mt-12">
      {/* Migration Banner */}
      {hasLocalStorageData && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-amber-800">Datos encontrados en almacenamiento local</p>
              <p className="text-sm text-amber-600">Hay documentos guardados localmente que se pueden migrar a la base de datos</p>
            </div>
          </div>
          <button
            onClick={handleMigrateFromLocalStorage}
            disabled={isMigrating}
            className="btn bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
          >
            {isMigrating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Migrando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Migrar a Base de Datos
              </>
            )}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="section-subtitle">Gestiona tus documentos y propuestas</p>
        </div>
        <Link to="/documentos/crear" className="btn btn-primary pulse-cyan">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Crear Documento
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <div className="stats-card max-w-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm font-medium">Total Propuestas/Presupuestos</p>
              <p className="text-4xl font-bold mt-1">{documents.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Documentos Recientes</h2>
            <p className="text-sm text-slate-500">Todos tus documentos creados</p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="card-body flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No hay documentos</h3>
              <p className="text-slate-500 mb-6 max-w-sm">
                Comienza creando tu primer documento de propuesta o presupuesto para tus clientes.
              </p>
              <Link to="/documentos/crear" className="btn btn-primary">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Documento
              </Link>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Proyecto</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Inversión</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr 
                    key={doc.id} 
                    className="group cursor-pointer hover:bg-slate-50"
                    onClick={() => navigate(`/documentos/ver/${doc.id}`)}
                  >
                    <td>
                      <div className="font-semibold text-slate-800">{doc.cliente || 'Sin nombre'}</div>
                    </td>
                    <td>
                      <div className="text-slate-600 max-w-xs truncate">{doc.nombreProyecto || '-'}</div>
                    </td>
                    <td>
                      <span className={`badge ${getTipoBadgeClass(doc.tipo)}`}>
                        {getTipoLabel(doc.tipo)}
                      </span>
                    </td>
                    <td className="text-slate-600">{formatDate(doc.fecha)}</td>
                    <td className="font-semibold text-slate-800">
                      {doc.inversionTotal ? `$ ${doc.inversionTotal}` : '-'}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/documentos/ver/${doc.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg hover:bg-cyan-50 text-slate-600 hover:text-cyan-600 transition-colors"
                          title="Ver"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          to={`/documentos/editar/${doc.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                          className="p-2 rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
