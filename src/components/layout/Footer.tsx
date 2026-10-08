import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import "./Footer.css";

export function Footer() {
  const loc = useLocation();
  const nav = useNavigate();
  function go(id: string) {
    const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    if (loc.pathname !== "/") { nav("/"); setTimeout(scroll, 150); } else scroll();
  }
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-intro">
          <Link className="fbrand" to="/">SERVA<span>link</span></Link>
          <p>Connecting you with trusted local professionals in your community.</p>
          <div className="footer-note"><ShieldCheck size={18} /><span>Bookings and reviews, kept together.</span></div>
        </div>
        <nav className="footer-column" aria-label="Platform"><b>Platform</b>
          <Link to="/services">Find Services</Link>
          <button onClick={() => go("how-it-works")}>How It Works</button>
          <button onClick={() => go("about")}>About</button>
        </nav>
        <nav className="footer-column" aria-label="For providers"><b>For Providers</b>
          <Link to="/become-provider">Become a Provider</Link>
          <Link to="/login">Provider Login</Link>
          <Link to="/provider">Provider Tools</Link>
        </nav>
        <nav className="footer-column" aria-label="Support"><b>Support</b>
          <Link to="/help">Help & Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} SERVAlink</span>
        <span><Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link></span>
      </div>
    </footer>
  );
}
