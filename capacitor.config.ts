import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'literature.com',
  appName: 'literature',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    // Разрешить запросы к локальному серверу
    allowNavigation: ['192.168.0.*'],
    // Для разработки раскомментируйте следующие строки 
    // и укажите IP-адрес вашего компьютера
    url: 'http://192.168.0.103:5000',
    cleartext: true
  },
  plugins: {
    // Настройки для HTTP-запросов
    CapacitorHttp: {
      enabled: true,
    }
  }
};

export default config;
