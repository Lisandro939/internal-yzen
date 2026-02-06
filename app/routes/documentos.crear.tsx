import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { DocumentData, ModuloData } from '~/types/document';
import { createEmptyDocument } from '~/types/document';
import { saveDocumentToDb } from '~/services/documentService';
import { generatePDF } from '~/utils/pdfGenerator';

export function meta() {
  return [
    { title: 'Crear Documento - Yzen' },
    { name: 'description', content: 'Crear nuevo documento de propuesta o presupuesto' },
  ];
}

export default function CrearDocumentoPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(createEmptyDocument());
  const [activeTab, setActiveTab] = useState<'general' | 'modulos' | 'economica'>('general');

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Módulos handlers
  const addModulo = () => {
    const newModulo: ModuloData = {
      id: crypto.randomUUID(),
      nombre: '',
      descripcion: '',
      funcionalidades: [''],
    };
    updateField('modulos', [...formData.modulos, newModulo]);
  };

  const updateModulo = (id: string, field: keyof ModuloData, value: string | string[]) => {
    const updated = formData.modulos.map((m) =>
      m.id === id ? { ...m, [field]: value } : m
    );
    updateField('modulos', updated);
  };

  const removeModulo = (id: string) => {
    if (formData.modulos.length > 1) {
      updateField('modulos', formData.modulos.filter((m) => m.id !== id));
    }
  };

  const addFuncionalidad = (moduloId: string) => {
    const updated = formData.modulos.map((m) =>
      m.id === moduloId ? { ...m, funcionalidades: [...m.funcionalidades, ''] } : m
    );
    updateField('modulos', updated);
  };

  const updateFuncionalidad = (moduloId: string, index: number, value: string) => {
    const updated = formData.modulos.map((m) => {
      if (m.id === moduloId) {
        const newFuncs = [...m.funcionalidades];
        newFuncs[index] = value;
        return { ...m, funcionalidades: newFuncs };
      }
      return m;
    });
    updateField('modulos', updated);
  };

  const removeFuncionalidad = (moduloId: string, index: number) => {
    const updated = formData.modulos.map((m) => {
      if (m.id === moduloId && m.funcionalidades.length > 1) {
        return { ...m, funcionalidades: m.funcionalidades.filter((_, i) => i !== index) };
      }
      return m;
    });
    updateField('modulos', updated);
  };

  // Exclusiones handlers
  const addExclusion = () => {
    updateField('exclusiones', [...formData.exclusiones, '']);
  };

  const updateExclusion = (index: number, value: string) => {
    const updated = [...formData.exclusiones];
    updated[index] = value;
    updateField('exclusiones', updated);
  };

  const removeExclusion = (index: number) => {
    if (formData.exclusiones.length > 1) {
      updateField('exclusiones', formData.exclusiones.filter((_, i) => i !== index));
    }
  };



  // Form submission
  const handleSave = async () => {
    const document: DocumentData = {
      ...formData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await saveDocumentToDb(document);
    navigate('/');
  };

  const handleGeneratePDF = async () => {
    const document: DocumentData = {
      ...formData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await saveDocumentToDb(document);
    await generatePDF(document);
  };

  const tabs = [
    { id: 'general', label: 'Información General', icon: '📋' },
    { id: 'modulos', label: 'Módulos', icon: '🧩' },
    { id: 'economica', label: 'Propuesta Económica', icon: '💰' },
  ] as const;

  return (
    <div className="animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Dashboard
        </button>
        <h1 className="section-title">Crear Nuevo Documento</h1>
        <p className="section-subtitle">Completa el formulario para generar tu documento PDF</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-lg shadow-cyan-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-cyan-300 hover:text-cyan-600'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Card */}
      <div className="card mb-6">
        <div className="card-body">
          {/* TAB: General */}
          {activeTab === 'general' && (
            <div className="space-y-6">

              {/* Cliente y Fecha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Cliente</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: SEFRA Maderas"
                    value={formData.cliente}
                    onChange={(e) => updateField('cliente', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.fecha}
                    onChange={(e) => updateField('fecha', e.target.value)}
                  />
                </div>
              </div>

              {/* Nombre del Proyecto */}
              <div className="form-group">
                <label className="form-label">Nombre del Proyecto</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Sistema de Gestión de Ventas y Cuentas Corrientes"
                  value={formData.nombreProyecto}
                  onChange={(e) => updateField('nombreProyecto', e.target.value)}
                />
              </div>



              {/* Objetivo General */}
              <div className="form-group">
                <label className="form-label">Objetivo del Proyecto</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Ej: Desarrollar una aplicación web a medida para la digitalización de los procesos de ventas..."
                  value={formData.objetivoGeneral}
                  onChange={(e) => updateField('objetivoGeneral', e.target.value)}
                />
              </div>

              {/* Requerimientos de Diseño */}
              <div className="form-group">
                <label className="form-label">Requerimientos de Diseño/UX (Opcional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Ej: El diseño de los PDF generados respetará fielmente la estructura visual actual de la empresa..."
                  value={formData.requerimientosDiseno}
                  onChange={(e) => updateField('requerimientosDiseno', e.target.value)}
                />
              </div>

              {/* Exclusiones */}
              <div className="form-group">
                <label className="form-label">Exclusiones (Lo que NO incluye)</label>
                <div className="space-y-3">
                  {formData.exclusiones.map((exclusion, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        className="form-input flex-1"
                        placeholder="Ej: No incluye integración directa con AFIP"
                        value={exclusion}
                        onChange={(e) => updateExclusion(index, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeExclusion(index)}
                        className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                        disabled={formData.exclusiones.length <= 1}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addExclusion}
                    className="btn btn-outline w-full"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Exclusión
                  </button>
                </div>
              </div>

              {/* Observaciones */}
              <div className="form-group">
                <label className="form-label">Observaciones (Opcional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Notas adicionales para el documento..."
                  value={formData.observaciones}
                  onChange={(e) => updateField('observaciones', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* TAB: Módulos */}
          {activeTab === 'modulos' && (
            <div className="space-y-6">
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
                <p className="text-sm text-cyan-700">
                  <strong>Tip:</strong> Agrega los módulos y funcionalidades que incluye tu propuesta. Usa verbos de acción como "Registrar", "Emitir", "Consultar".
                </p>
              </div>

              {formData.modulos.map((modulo, moduloIndex) => (
                <div key={modulo.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-cyan-600 bg-cyan-100 px-3 py-1 rounded-lg">
                      Módulo {String.fromCharCode(65 + moduloIndex)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeModulo(modulo.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      disabled={formData.modulos.length <= 1}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="form-label">Nombre del Módulo</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej: Gestión de Clientes y Cuentas Corrientes"
                        value={modulo.nombre}
                        onChange={(e) => updateModulo(modulo.id, 'nombre', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Descripción del Módulo</label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        placeholder="Breve descripción del módulo..."
                        value={modulo.descripcion}
                        onChange={(e) => updateModulo(modulo.id, 'descripcion', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Funcionalidades</label>
                      <div className="space-y-2">
                        {modulo.funcionalidades.map((func, funcIndex) => (
                          <div key={funcIndex} className="flex gap-2">
                            <input
                              type="text"
                              className="form-input flex-1"
                              placeholder="Ej: Alta, baja y modificación de datos de clientes."
                              value={func}
                              onChange={(e) => updateFuncionalidad(modulo.id, funcIndex, e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => removeFuncionalidad(modulo.id, funcIndex)}
                              className="p-3 rounded-xl bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                              disabled={modulo.funcionalidades.length <= 1}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addFuncionalidad(modulo.id)}
                          className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Agregar funcionalidad
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addModulo}
                className="btn btn-outline w-full"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar Módulo
              </button>
            </div>
          )}

          {/* TAB: Propuesta Económica */}
          {activeTab === 'economica' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Inversión Total</label>
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                    <input
                      type="text"
                      className="form-input pl-12"
                      placeholder="0.00"
                      value={formData.inversionTotal}
                      onChange={(e) => updateField('inversionTotal', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Plazo de Entrega</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: 3 semanas a partir de la firma"
                    value={formData.plazoEntrega}
                    onChange={(e) => updateField('plazoEntrega', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Forma de Pago</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: 50% anticipo, 50% contra entrega"
                  value={formData.formaPago}
                  onChange={(e) => updateField('formaPago', e.target.value)}
                />
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-slate-50 rounded-2xl p-6 border border-cyan-100">
                <h3 className="font-bold text-slate-800 mb-2">Vista Previa</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Inversión:</span>
                    <p className="font-bold text-lg text-cyan-600">
                      {formData.inversionTotal ? `$ ${formData.inversionTotal}` : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Forma de Pago:</span>
                    <p className="font-medium text-slate-800">{formData.formaPago || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Plazo:</span>
                    <p className="font-medium text-slate-800">{formData.plazoEntrega || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-4 sticky bottom-4 shadow-lg">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn btn-secondary"
        >
          Cancelar
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-secondary"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Guardar Borrador
          </button>
          <button
            type="button"
            onClick={handleGeneratePDF}
            className="btn btn-primary"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
