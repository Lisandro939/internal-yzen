import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import type { ProjectListItem } from '~/types/project';
import { getAllProjects, deleteProject } from '~/services/projectService';
import ProjectStatsCards from '~/components/ProjectStatsCards';
import PaymentProgressBar from '~/components/PaymentProgressBar';

export function meta() {
	return [{ title: 'Proyectos & Cobros - Yzen' }];
}

export default function ProyectosPage() {
	const navigate = useNavigate();
	const [projects, setProjects] = useState<ProjectListItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'completado' | 'cancelado'>('todos');
	const [busqueda, setBusqueda] = useState('');

	const loadProjects = async () => {
		setIsLoading(true);
		const data = await getAllProjects();
		setProjects(data);
		setIsLoading(false);
	};

	useEffect(() => {
		loadProjects();
	}, []);

	const handleDelete = async (id: string) => {
		if (confirm('¿Estás seguro de eliminar este proyecto?')) {
			await deleteProject(id);
			await loadProjects();
		}
	};

	const filteredProjects = projects.filter((p) => {
		if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false;
		if (busqueda) {
			const q = busqueda.toLowerCase();
			return p.cliente.toLowerCase().includes(q) || p.nombre_proyecto.toLowerCase().includes(q);
		}
		return true;
	});

	const getEstadoBadge = (estado: string) => {
		switch (estado) {
			case 'activo':
				return <span className="badge badge-info">Activo</span>;
			case 'completado':
				return <span className="badge badge-success">Completado</span>;
			case 'cancelado':
				return <span className="badge badge-neutral">Cancelado</span>;
			default:
				return <span className="badge badge-info">{estado}</span>;
		}
	};

	const formatCurrency = (amount: number, moneda: string) => {
		return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(amount);
	};

	const estadoFilters: { label: string; value: typeof filtroEstado }[] = [
		{ label: 'Todos', value: 'todos' },
		{ label: 'Activos', value: 'activo' },
		{ label: 'Completados', value: 'completado' },
		{ label: 'Cancelados', value: 'cancelado' },
	];

	return (
		<div className="animate-fade-in md:mt-12">
			{/* Header */}
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="section-title">Proyectos & Cobros</h1>
					<p className="section-subtitle">Gestiona tus proyectos y seguimiento de pagos</p>
				</div>
				<Link to="/proyectos/crear" className="btn btn-primary pulse-cyan">
					<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
					</svg>
					Nuevo Proyecto
				</Link>
			</div>

			{/* Stats */}
			<ProjectStatsCards projects={projects} />

			{/* Filters */}
			<div className="flex flex-wrap gap-3 mb-6">
				<div className="relative max-w-sm">
					<svg
						className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<input
						type="text"
						className="form-input pl-10"
						placeholder="Buscar por cliente o proyecto..."
						value={busqueda}
						onChange={(e) => setBusqueda(e.target.value)}
					/>
				</div>
				{estadoFilters.map((f) => (
					<button
						key={f.value}
						onClick={() => setFiltroEstado(f.value)}
						className={`px-4 py-2 rounded-full border text-sm font-medium cursor-pointer transition-all ${
							filtroEstado === f.value
								? 'bg-cyan-100 text-cyan-700 border-cyan-300'
								: 'bg-white text-slate-600 border-slate-200'
						}`}
					>
						{f.label}
					</button>
				))}
			</div>

			{/* Table */}
			{isLoading ? (
				<div className="card">
					<div className="card-body flex items-center justify-center py-16">
						<div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"></div>
					</div>
				</div>
			) : filteredProjects.length === 0 ? (
				<div className="card">
					<div className="card-body">
						<div className="empty-state">
							<div className="empty-state-icon">
								<svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1.5}
										d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
									/>
								</svg>
							</div>
							<h3 className="text-lg font-semibold text-slate-700 mb-2">No hay proyectos</h3>
							<p className="text-slate-500 mb-6 max-w-sm">
								Comienza creando tu primer proyecto para gestionar cobros y cuotas de tus clientes.
							</p>
							<Link to="/proyectos/crear" className="btn btn-primary">
								<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
								</svg>
								Nuevo Proyecto
							</Link>
						</div>
					</div>
				</div>
			) : (
				<div className="card">
					<div className="table-container">
						<table className="table">
							<thead>
								<tr>
									<th>Cliente</th>
									<th>Proyecto</th>
									<th>Monto</th>
									<th>Progreso</th>
									<th>Estado</th>
									<th className="text-right">Acciones</th>
								</tr>
							</thead>
							<tbody>
								{filteredProjects.map((row) => (
									<tr
										key={row.id}
										className="group cursor-pointer hover:bg-slate-50"
										onClick={() => navigate(`/proyectos/ver/${row.id}`)}
									>
										<td>
											<div className="font-semibold text-slate-800">{row.cliente}</div>
										</td>
										<td>
											<div className="text-slate-600 max-w-xs truncate">{row.nombre_proyecto}</div>
										</td>
										<td>
											<div className="font-semibold text-slate-800">
												{formatCurrency(row.precio_total, row.moneda)}
											</div>
											{row.moneda === 'USD' && (
												<span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
													USD
												</span>
											)}
										</td>
										<td>
											<div className="flex flex-col gap-1">
												<PaymentProgressBar
													progreso={row.precio_total > 0 ? (row.total_pagado / row.precio_total) * 100 : 0}
													size="sm"
												/>
												<span className="text-xs text-slate-500">
													{row.cuotas_pagadas}/{row.total_cuotas} cuotas
												</span>
											</div>
										</td>
										<td>{getEstadoBadge(row.estado)}</td>
										<td>
											<div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
												<Link
													to={`/proyectos/ver/${row.id}`}
													onClick={(e) => e.stopPropagation()}
													className="p-2 rounded-lg hover:bg-cyan-50 text-slate-600 hover:text-cyan-600 transition-colors"
													title="Ver"
												>
													<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
														/>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
														/>
													</svg>
												</Link>
												<Link
													to={`/proyectos/editar/${row.id}`}
													onClick={(e) => e.stopPropagation()}
													className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors"
													title="Editar"
												>
													<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
														/>
													</svg>
												</Link>
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleDelete(row.id);
													}}
													className="p-2 rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
													title="Eliminar"
												>
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
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
