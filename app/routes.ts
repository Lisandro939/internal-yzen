import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
	layout("components/DashboardLayout.tsx", [
		index("routes/dashboard.tsx"),
		route("documentos/crear", "routes/documentos.crear.tsx"),
		route("documentos/editar/:id", "routes/documentos.editar.tsx"),
		route("documentos/ver/:id", "routes/documentos.ver.tsx"),
	]),
] satisfies RouteConfig;
