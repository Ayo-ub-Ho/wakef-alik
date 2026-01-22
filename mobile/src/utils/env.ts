// API Base URL Configuration
// For Android Emulator: Use 10.0.2.2 (this is the host machine's IP from the emulator)
// For Physical Phone on LAN: Use your machine's IP address (e.g., 192.168.x.x)

const API_BASE_URL = __DEV__ ? 'http://10.0.2.2:3000' : 'http://api.production.com';

export { API_BASE_URL };
