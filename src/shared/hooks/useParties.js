import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client.js';

// Parties of one type ('customer' | 'supplier') from the API.
export default function useParties(type) {
  const [parties, setParties] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    api
      .get(`/parties?type=${type}`)
      .then((list) => live && setParties(list))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [type]);

  const addParty = useCallback(
    async ({ name, phone }) => {
      const party = await api.post('/parties', { name, phone, type });
      setParties((list) => [...list, party].sort((a, b) => a.name.localeCompare(b.name)));
      return party;
    },
    [type]
  );

  return { parties, addParty, error };
}
