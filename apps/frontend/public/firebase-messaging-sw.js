importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCucjyoK44CFY4Ogy96uZYP-GnFAgMejis',
  authDomain: 'restaumanger-16cf4.firebaseapp.com',
  projectId: 'restaumanger-16cf4',
  storageBucket: 'restaumanger-16cf4.firebasestorage.app',
  messagingSenderId: '820468328886',
  appId: '1:820468328886:web:5e72bd71599f8b55487917',
  measurementId: 'G-MWMNVBP8S2',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'RestoManager';
  const options = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192.png',
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.target || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(target);
      return undefined;
    })
  );
});
