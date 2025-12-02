import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://10.37.16.90:8000';

export default function BankConnectionsScreenDebug() {
  const [connections, setConnections] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('=== DEBUG START ===');
        console.log('localStorage keys:', Object.keys(localStorage));
        console.log('localStorage.token:', localStorage.getItem('token'));
        console.log('localStorage.auth_token:', localStorage.getItem('auth_token'));
        
        const token = localStorage.getItem('auth_token'); // FIXÉ: utiliser 'auth_token' au lieu de 'token'
        console.log('Token exists:', !!token);
        console.log('Token length:', token?.length);
        
        const url = `${API_BASE_URL}/api/bank-connections`;
        console.log('Fetching from:', url);
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        const data = await response.json();
        console.log('Data received:', data);
        console.log('Data type:', typeof data);
        console.log('Is array:', Array.isArray(data));
        
        setConnections(data || []);
        setLoading(false);
        console.log('=== DEBUG END - SUCCESS ===');
      } catch (err) {
        console.error('=== DEBUG END - ERROR ===');
        console.error('Error type:', err.constructor.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) return <div style={{padding: '20px'}}>Chargement...</div>;
  if (error) return <div style={{padding: '20px', color: 'red'}}>Erreur: {error}</div>;

  return (
    <div style={{padding: '20px'}}>
      <h1>Bank Connections Debug</h1>
      <p>Nombre de connexions: {connections.length}</p>
      <pre>{JSON.stringify(connections, null, 2)}</pre>
    </div>
  );
}
