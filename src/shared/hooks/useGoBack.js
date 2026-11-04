import { useLocation, useNavigate } from 'react-router-dom';

// Go to the previous page if the app has history, otherwise the Dashboard.
export default function useGoBack() {
  const navigate = useNavigate();
  const location = useLocation();
  return () => (location.key !== 'default' ? navigate(-1) : navigate('/'));
}
