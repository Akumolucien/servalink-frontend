import { Link } from "react-router-dom";

function Screen({ code, title, text }: { code: string; title: string; text: string }) {
  return <div className="system-page"><span>{code}</span><h1>{title}</h1><p>{text}</p><Link className="btn-link" to="/">Back to Home</Link></div>;
}
export const NotFoundPage = () => <Screen code="404" title="Page not found" text="The page you're looking for doesn't exist or has moved." />;
export const UnauthorizedPage = () => <Screen code="403" title="Access denied" text="Your account doesn't have permission to view this page." />;
