import type { ProjectListItem } from '~/types/project';

interface ProjectStatsCardsProps {
	projects: ProjectListItem[];
}

const formatARS = (amount: number): string =>
	new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

export default function ProjectStatsCards({ projects }: ProjectStatsCardsProps) {
	const totalProyectos = projects.length;

	const proyectosActivos = projects.filter((p) => p.estado === 'activo').length;

	const totalCobradoARS = projects
		.filter((p) => p.moneda === 'ARS')
		.reduce((sum, p) => sum + p.total_pagado, 0);

	const totalPendienteARS = projects
		.filter((p) => p.moneda === 'ARS' && p.estado !== 'cancelado')
		.reduce((sum, p) => sum + (p.precio_total - p.total_pagado), 0);

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
			{/* Total Proyectos */}
			<div className="stats-card">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-cyan-100 text-sm font-medium">Total Proyectos</p>
						<p className="text-4xl font-bold mt-1">{totalProyectos}</p>
					</div>
					<div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
						<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
							/>
						</svg>
					</div>
				</div>
			</div>

			{/* Activos */}
			<div className="bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-500 rounded-2xl p-6 text-white shadow-lg">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-emerald-100 text-sm font-medium">Activos</p>
						<p className="text-4xl font-bold mt-1">{proyectosActivos}</p>
					</div>
					<div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
						<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
				</div>
			</div>

			{/* Cobrado */}
			<div className="bg-gradient-to-br from-violet-400 via-violet-500 to-purple-500 rounded-2xl p-6 text-white shadow-lg">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-violet-100 text-sm font-medium">Cobrado</p>
						<p className="text-4xl font-bold mt-1">{formatARS(totalCobradoARS)}</p>
					</div>
					<div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
						<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
				</div>
			</div>

			{/* Pendiente */}
			<div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-amber-100 text-sm font-medium">Pendiente</p>
						<p className="text-4xl font-bold mt-1">{formatARS(totalPendienteARS)}</p>
					</div>
					<div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
						<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
				</div>
			</div>
		</div>
	);
}
