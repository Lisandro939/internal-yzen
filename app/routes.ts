import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
	layout("components/DashboardLayout.tsx", [
		index("routes/dashboard.tsx"),
		route("documentos/crear", "routes/documentos.crear.tsx"),
		route("documentos/editar/:id", "routes/documentos.editar.tsx"),
		route("documentos/ver/:id", "routes/documentos.ver.tsx"),
		route("proyectos", "routes/proyectos.tsx"),
		route("proyectos/crear", "routes/proyectos.crear.tsx"),
		route("proyectos/ver/:id", "routes/proyectos.ver.tsx"),
		route("proyectos/editar/:id", "routes/proyectos.editar.tsx"),
	]),
] satisfies RouteConfig;
