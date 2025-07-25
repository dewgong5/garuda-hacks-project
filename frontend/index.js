// Simple app initialization without ES6 modules
console.log('Cheating Mommy app initializing...');

// Load LitElement from CDN
const litScript = document.createElement('script');
litScript.src = 'https://unpkg.com/lit@3.0.0/index.js?module';
document.head.appendChild(litScript);

litScript.onload = () => {
    console.log('LitElement loaded successfully');
    
    // Load the app component
    const appScript = document.createElement('script');
    appScript.type = 'module';
    appScript.src = './components/App.js';
    document.head.appendChild(appScript);
    
    appScript.onload = () => {
        console.log('App component loaded successfully');
    };
    
    appScript.onerror = (error) => {
        console.error('Failed to load app component:', error);
    };
};

litScript.onerror = (error) => {
    console.error('Failed to load LitElement:', error);
};

// Set up global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
}); 