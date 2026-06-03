import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import '../index.css';

function NotFound() {
  return (
    <div className="page not-found-page">
      <div className="not-found-content">
        <AlertCircle size={64} className="not-found-icon" />
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn btn-primary not-found-btn">
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
