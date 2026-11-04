import { HashRouter } from 'react-router-dom';
import AppRoutes from './routes.jsx';

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
