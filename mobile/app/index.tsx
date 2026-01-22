import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { pingAPI } from '../src/api/ping';

export default function Index() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');

  useEffect(() => {
    const checkAPI = async () => {
      const result = await pingAPI();
      if (result.status === 'OK') {
        console.log('API OK');
        setApiStatus('API OK');
      } else {
        console.log('API ERROR');
        setApiStatus('API ERROR');
      }
    };

    checkAPI();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 16, marginBottom: 10 }}>
        API Status: {apiStatus}
      </Text>
      <Text>Welcome to Wakef-Alik Mobile App</Text>
    </View>
  );
}
