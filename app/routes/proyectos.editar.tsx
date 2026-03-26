import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { ProjectFormData, InstallmentFormData } from '~/types/project';
import { getProjectById } from '~/services/projectService';
import { saveProject } from '~/services/projectService';
import PaymentPlanBuilder from '~/components/PaymentPlanBuilder';

export function meta() {
  return [{ title: 'Editar Proyecto - Yzen' }];
}

export default function EditarProyectoPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<ProjectFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) {
        navigate('/proyectos');
        return;
      }

      const project = await getProjectById(id);
      if (!project) {
        navigate('/proyectos');
        return;
      }

      setFormData({
        cliente: project.cliente,
        nombre_proyecto: project.nombre_proyecto,
        precio_total: String(project.precio_total),
        moneda: project.moneda,
        notas: project.notas,
        document_id: project.document_id,
        estado: project.estado,
        installments: project.installments.map((inst) => ({
          id: inst.id,
          numero: inst.numero,
          descripcion: inst.descripcion,
          monto: String(inst.monto),
          fecha_vencimiento: inst.fecha_vencimiento || '',
          notas: inst.notas || '',
        })),
      });
      setIsLoading(false);
    };

    loadProject();
  }, [id, navigate]);

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const updateField = (field: keyof ProjectFormData, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    const clienteTrimmed = formData.cliente.trim();
    const nombreTrimmed = formData.nombre_proyecto.trim();
    const precioTotal = parseFloat(formData.precio_total) || 0;

    if (!clienteTrimmed || !nombreTrimmed || precioTotal <= 0 || formData.installments.length < 1) {
      alert('Por favor completa todos los campos obligatorios: cliente, nombre del proyecto, precio total y al menos una cuota.');
      return;
    }

    setIsSaving(true);
    try {
      const savedId = await saveProject(formData, id);
      if (savedId) {
        navigate(`/proyectos/ver/${id}`);
      } else {
        alert('Error al guardar el proyecto. Intenta nuevamente.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/proyectos/ver/${id}`)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Proyecto
        </button>
        <h1 className="section-title">Editar Proyecto</h1>
        <p className="section-subtitle">Modifica los datos del proyecto</p>
      </div>

      {/* Project Info Card */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="space-y-6">
            {/* Cliente + Nombre Proyecto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Cliente</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nombre del cliente"
                  value={formData.cliente}
                  onChange={(e) => updateField('cliente', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre del Proyecto</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Landing page, Rediseno web"
                  value={formData.nombre_proyecto}
                  onChange={(e) => updateField('nombre_proyecto', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Precio Total + Moneda + Estado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Precio Total</label>
                <div className="relative">
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                  <input
                    type="text"
                    className="form-input pl-12"
                    placeholder="0.00"
                    value={formData.precio_total}
                    onChange={(e) => updateField('precio_total', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select
                  className="form-select"
                  value={formData.moneda}
                  onChange={(e) => updateField('moneda', e.target.value)}
                >
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  className="form-select"
                  value={formData.estado}
                  onChange={(e) => updateField('estado', e.target.value)}
                >
                  <option value="activo">Activo</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Notas */}
            <div className="form-group">
              <label className="form-label">Notas (Opcional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Observaciones adicionales..."
                value={formData.notas}
                onChange={(e) => updateField('notas', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Plan */}
      <PaymentPlanBuilder
        precioTotal={parseFloat(formData.precio_total) || 0}
        moneda={formData.moneda}
        installments={formData.installments}
        onChange={(installments: InstallmentFormData[]) => updateField('installments', installments)}
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-4 sticky bottom-4 shadow-lg">
        <button
          type="button"
          onClick={() => navigate(`/proyectos/ver/${id}`)}
          className="btn btn-secondary"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary"
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
