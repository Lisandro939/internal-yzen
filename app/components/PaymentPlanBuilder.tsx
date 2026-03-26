import { useState, type JSX } from 'react';
import type { InstallmentFormData, PlanTemplate } from '~/types/project';
import { createEmptyInstallment, generateInstallmentsFromTemplate } from '~/types/project';

interface PaymentPlanBuilderProps {
  precioTotal: number;
  moneda: 'ARS' | 'USD';
  installments: InstallmentFormData[];
  onChange: (installments: InstallmentFormData[]) => void;
}

type TemplateType = 'full' | 'equal' | 'advance' | 'custom';

const formatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function PaymentPlanBuilder({
  precioTotal,
  moneda,
  installments,
  onChange,
}: PaymentPlanBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('full');
  const [cantidadCuotas, setCantidadCuotas] = useState(3);
  const [porcentajeAnticipo, setPorcentajeAnticipo] = useState(50);
  const [cantidadCuotasResto, setCantidadCuotasResto] = useState(2);

  const currencySymbol = moneda === 'USD' ? 'US$' : '$';

  const handleGenerate = () => {
    let template: PlanTemplate;

    switch (selectedTemplate) {
      case 'full':
        template = { type: 'full' };
        break;
      case 'equal':
        template = { type: 'equal', cantidadCuotas };
        break;
      case 'advance':
        template = { type: 'advance', porcentajeAnticipo, cantidadCuotasResto };
        break;
      case 'custom':
        template = { type: 'custom' };
        break;
    }

    const generated = generateInstallmentsFromTemplate(template, precioTotal);
    onChange(generated);
  };

  const updateInstallment = (
    id: string,
    field: keyof InstallmentFormData,
    value: string | number,
  ) => {
    const updated = installments.map((inst) =>
      inst.id === id ? { ...inst, [field]: value } : inst,
    );
    onChange(updated);
  };

  const removeInstallment = (id: string) => {
    const filtered = installments
      .filter((inst) => inst.id !== id)
      .map((inst, i) => ({ ...inst, numero: i + 1 }));
    onChange(filtered);
  };

  const addInstallment = () => {
    const nextNumero = installments.length + 1;
    onChange([...installments, createEmptyInstallment(nextNumero)]);
  };

  // Running total
  const totalCuotas = installments.reduce(
    (sum, inst) => sum + (parseFloat(inst.monto) || 0),
    0,
  );
  const difference = Math.abs(totalCuotas - precioTotal);
  const isBalanced = difference <= 0.01;

  const templateButtons: {
    id: TemplateType;
    label: string;
    icon: JSX.Element;
  }[] = [
    {
      id: 'full',
      label: 'Pago Total',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
          />
        </svg>
      ),
    },
    {
      id: 'equal',
      label: 'Cuotas Iguales',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008H15.75v-.008zm0 2.25h.008v.008H15.75V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z"
          />
        </svg>
      ),
    },
    {
      id: 'advance',
      label: 'Anticipo + Cuotas',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
          />
        </svg>
      ),
    },
    {
      id: 'custom',
      label: 'Personalizado',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="card">
      <div className="card-body">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800">Plan de Pagos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Configura las cuotas y forma de pago del proyecto
          </p>
        </div>

        {/* Section A: Template Selector */}
        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {templateButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setSelectedTemplate(btn.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-left ${
                  selectedTemplate === btn.id
                    ? 'border-cyan-400 bg-cyan-50 shadow-lg shadow-cyan-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`mb-2 ${
                    selectedTemplate === btn.id ? 'text-cyan-600' : 'text-slate-400'
                  }`}
                >
                  {btn.icon}
                </div>
                <span
                  className={`text-sm font-medium ${
                    selectedTemplate === btn.id ? 'text-cyan-700' : 'text-slate-600'
                  }`}
                >
                  {btn.label}
                </span>
              </button>
            ))}
          </div>

          {/* Config inputs for "Cuotas Iguales" */}
          {selectedTemplate === 'equal' && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="form-group">
                <label className="form-label">Cantidad de cuotas</label>
                <input
                  type="number"
                  className="form-input w-32"
                  min={2}
                  max={24}
                  value={cantidadCuotas}
                  onChange={(e) => setCantidadCuotas(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* Config inputs for "Anticipo + Cuotas" */}
          {selectedTemplate === 'advance' && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Porcentaje de anticipo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="form-input w-32"
                      min={10}
                      max={90}
                      step={5}
                      value={porcentajeAnticipo}
                      onChange={(e) => setPorcentajeAnticipo(Number(e.target.value))}
                    />
                    <span className="text-sm text-slate-500 font-medium">%</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Cuotas restantes</label>
                  <input
                    type="number"
                    className="form-input w-32"
                    min={1}
                    max={23}
                    value={cantidadCuotasResto}
                    onChange={(e) => setCantidadCuotasResto(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Generate button */}
          <button type="button" onClick={handleGenerate} className="btn btn-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Generar Cuotas
          </button>
        </div>

        {/* Section B: Installments Table */}
        {installments.length > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Detalle de cuotas</h3>

              <div className="space-y-0">
                {installments.map((inst) => (
                  <div key={inst.id} className="product-row">
                    {/* Numero */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-100 text-cyan-700 font-bold text-sm shrink-0 mt-1">
                      {inst.numero}
                    </div>

                    {/* Descripcion */}
                    <div className="form-group flex-1 !mb-0">
                      <label className="form-label text-xs">Descripcion</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej: Anticipo, Cuota 1..."
                        value={inst.descripcion}
                        onChange={(e) =>
                          updateInstallment(inst.id, 'descripcion', e.target.value)
                        }
                      />
                    </div>

                    {/* Monto */}
                    <div className="form-group w-40 !mb-0">
                      <label className="form-label text-xs">Monto</label>
                      <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">
                          {currencySymbol}
                        </span>
                        <input
                          type="text"
                          className="form-input pl-8"
                          placeholder="0.00"
                          value={inst.monto}
                          onChange={(e) =>
                            updateInstallment(inst.id, 'monto', e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {/* Fecha vencimiento */}
                    <div className="form-group w-44 !mb-0">
                      <label className="form-label text-xs">Vencimiento</label>
                      <input
                        type="date"
                        className="form-input"
                        value={inst.fecha_vencimiento}
                        onChange={(e) =>
                          updateInstallment(inst.id, 'fecha_vencimiento', e.target.value)
                        }
                      />
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeInstallment(inst.id)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer mt-6 shrink-0"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add installment button — only in custom mode */}
              {selectedTemplate === 'custom' && (
                <button
                  type="button"
                  onClick={addInstallment}
                  className="btn btn-secondary w-full mt-3"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Agregar cuota
                </button>
              )}
            </div>
          </div>
        )}

        {/* Section C: Running Total */}
        {installments.length > 0 && (
          <div
            className={`mt-4 p-4 rounded-xl border ${
              isBalanced
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isBalanced ? (
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isBalanced ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    Total cuotas: {currencySymbol} {formatter.format(totalCuotas)}
                  </p>
                  <p
                    className={`text-sm ${
                      isBalanced ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    Precio del proyecto: {currencySymbol} {formatter.format(precioTotal)}
                  </p>
                </div>
              </div>

              {!isBalanced && (
                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                  Diferencia: {currencySymbol} {formatter.format(difference)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
