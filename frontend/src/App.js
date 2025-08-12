import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, StatusBar } from 'react-native';
import { checkBackendStatus } from './config/api.config';

export default function App() {
  const [backendStatus, setBackendStatus] = useState('Vérification...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isBackendAvailable = await checkBackendStatus();
        setBackendStatus(isBackendAvailable ? 'Connecté' : 'Non connecté');
      } catch (error) {
        setBackendStatus('Erreur de connexion');
        console.error('Erreur lors de la vérification du backend:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Application Budget</Text>
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Statut du backend: </Text>
        <Text 
          style={[
            styles.statusValue, 
            backendStatus === 'Connecté' ? styles.connected : 
            backendStatus === 'Non connecté' ? styles.disconnected : 
            styles.checking
          ]}
        >
          {backendStatus}
        </Text>
      </View>
      
      {isLoading ? (
        <Text style={styles.loading}>Chargement...</Text>
      ) : (
        <View style={styles.content}>
          <Text style={styles.message}>
            {backendStatus === 'Connecté' 
              ? 'Application prête à être utilisée.' 
              : 'Veuillez vérifier la connexion au backend.'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  connected: {
    color: 'green',
  },
  disconnected: {
    color: 'red',
  },
  checking: {
    color: 'orange',
  },
  loading: {
    fontSize: 18,
    color: 'gray',
    marginTop: 20,
  },
  content: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
  },
}); 