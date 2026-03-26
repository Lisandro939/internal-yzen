import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import type { ProjectWithPayments, PaymentInstallment } from '~/types/project';
import {
	getProjectById,
	markInstallmentPaid,
	markInstallmentUnpaid,
	deleteProject,
} from '~/services/projectService';
import PaymentProgressBar from '~/components/PaymentProgressBar';

export function meta() {
	return [{ title: 'Ver Proyecto - Yzen' }];
}

export default function VerProyectoPage() {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const [project, setProject] = useState<ProjectWithPayments | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const loadProject = useCallback(async () => {
		if (!id) return;
		const data = await getProjectById(id);
		if (data) {
			setProject(data);
		} else {
			navigate('/proyectos');
		}
		setIsLoading(false);
	}, [id, navigate]);

	useEffect(() => {
		loadProject();
	}, [loadProject]);

	const formatCurrency = (amount: number, moneda: string) =>
		new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(amount);

	const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR');

	const isOverdue = (cuota: PaymentInstallment) =>
		cuota.estado === 'pendiente' &&
		cuota.fecha_vencimiento &&
		new Date(cuota.fecha_vencimiento) < new Date();

	const handleMarkPaid = async (installmentId: string) => {
		const metodoPago = prompt('Metodo de pago (Transferencia, Efectivo, Tarjeta, etc.):');
		if (!metodoPago) return;
		await markInstallmentPaid(installmentId, metodoPago);
		await loadProject();
	};

	const handleMarkUnpaid = async (installmentId: string) => {
		if (!confirm('Desmarcar esta cuota como pagada?')) return;
		await markInstallmentUnpaid(installmentId);
		await loadProject();
	};

	const handleDelete = async () => {
		if (!confirm('Eliminar este proyecto permanentemente?')) return;
		if (id) {
			await deleteProject(id);
			navigate('/proyectos');
		}
	};

	if (isLoading || !project) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"></div>
			</div>
		);
	}

	const estadoBadge: Record<string, { className: string; label: string }> = {
		activo: { className: 'badge-success', label: 'Activo' },
		completado: { className: 'badge-success', label: 'Completado' },
		cancelado: { className: 'badge-warning', label: 'Cancelado' },
	};

	const badge = estadoBadge[project.estado] ?? { className: 'badge-warning', label: project.estado };

	const totalInstallments = project.installments.reduce((sum, c) => sum + c.monto, 0);

	return (
		<div className="animate-fade-in w-full md:mt-12">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-4">
					<Link
						to="/proyectos"
						className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors"
					>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</Link>
					<div>
						<h1 className="section-title">{project.cliente}</h1>
						<p className="section-subtitle">{project.nombre_proyecto}</p>
						<span className={badge.className}>{badge.label}</span>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<Link to={`/proyectos/editar/${id}`} className="btn btn-secondary">
						Editar
					</Link>
					<button onClick={handleDelete} className="btn btn-outline text-red-600">
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* Financial Summary */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div className="p-5 rounded-2xl border bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
					<p className="text-sm text-slate-500 mb-1">Precio Total</p>
					<p className="text-2xl font-bold text-slate-800">
						{formatCurrency(project.precio_total, project.moneda)}
					</p>
				</div>
				<div className="p-5 rounded-2xl border bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
					<p className="text-sm text-emerald-600 mb-1">Cobrado</p>
					<p className="text-2xl font-bold text-emerald-700">
						{formatCurrency(project.totalPagado, project.moneda)}
					</p>
				</div>
				<div className="p-5 rounded-2xl border bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
					<p className="text-sm text-amber-600 mb-1">Pendiente</p>
					<p className="text-2xl font-bold text-amber-700">
						{formatCurrency(project.totalPendiente, project.moneda)}
					</p>
				</div>
			</div>

			{/* Progress */}
			<div className="card mb-6">
				<div className="card-header flex items-center justify-between">
					<h2 className="card-title">Progreso de Cobro</h2>
					<span className="text-sm font-semibold text-slate-600">{project.progreso}%</span>
				</div>
				<div className="card-body">
					<PaymentProgressBar progreso={project.progreso} size="lg" showLabel={true} />
				</div>
			</div>

			{/* Installments Table */}
			<div className="card">
				<div className="card-header flex items-center justify-between">
					<h2 className="card-title">Plan de Pagos</h2>
					<span className="text-sm text-slate-500">{project.installments.length} cuotas</span>
				</div>
				<div className="table-container">
					<table className="table">
						<thead>
							<tr>
								<th>#</th>
								<th>Descripcion</th>
								<th>Monto</th>
								<th>Vencimiento</th>
								<th>Estado</th>
								<th>Fecha Pago</th>
								<th>Metodo</th>
								<th>Accion</th>
							</tr>
						</thead>
						<tbody>
							{project.installments.map((cuota) => (
								<tr key={cuota.id}>
									<td className="font-medium text-slate-600">{cuota.numero}</td>
									<td>{cuota.descripcion}</td>
									<td className="font-semibold">
										{formatCurrency(cuota.monto, project.moneda)}
									</td>
									<td
										className={
											isOverdue(cuota) ? 'text-red-600 font-semibold' : ''
										}
									>
										{cuota.fecha_vencimiento
											? formatDate(cuota.fecha_vencimiento)
											: '\u2014'}
									</td>
									<td>
										{cuota.estado === 'pagado' ? (
											<span className="badge-success">Pagado</span>
										) : (
											<span className="badge-warning">Pendiente</span>
										)}
									</td>
									<td>{cuota.fecha_pago ? formatDate(cuota.fecha_pago) : '\u2014'}</td>
									<td>{cuota.metodo_pago ?? '\u2014'}</td>
									<td>
										{cuota.estado === 'pendiente' ? (
											<button
												onClick={() => handleMarkPaid(cuota.id)}
												className="btn btn-secondary text-emerald-600 text-sm flex items-center gap-1"
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
														d="M5 13l4 4L19 7"
													/>
												</svg>
												Marcar Pagado
											</button>
										) : (
											<button
												onClick={() => handleMarkUnpaid(cuota.id)}
												className="btn btn-outline text-sm text-slate-500"
											>
												Desmarcar
											</button>
										)}
									</td>
								</tr>
							))}
							{/* Summary row */}
							<tr className="font-semibold border-t-2 border-slate-300">
								<td colSpan={2} className="text-right">
									Total
								</td>
								<td>{formatCurrency(totalInstallments, project.moneda)}</td>
								<td colSpan={5}></td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			{/* Notas */}
			{project.notas && (
				<div className="card mt-6">
					<div className="card-header">
						<h2 className="card-title">Notas</h2>
					</div>
					<div className="card-body">
						<p className="text-slate-700 whitespace-pre-wrap">{project.notas}</p>
					</div>
				</div>
			)}
		</div>
	);
}
