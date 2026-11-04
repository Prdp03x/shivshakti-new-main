import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

// Items (with live stock) from the API.
export default function useItems() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    api
      .get('/items')
      .then((list) => live && setItems(list))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, []);

  return { items, error };
}
