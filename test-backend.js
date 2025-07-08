// Script de prueba para verificar la conexión con el backend
const axios = require('axios');

const BASE_URL = "https://backend-gestion-forestal.vercel.app";

async function testBackendConnection() {
  console.log("🧪 Probando conexión con el backend...");
  console.log("URL:", BASE_URL);
  
  try {
    // Probar el endpoint de login
    const testCredentials = {
      email: "admin@sistema.com",
      password: "admin"
    };
    
    console.log("📡 Enviando request de login...");
    const response = await axios.post(`${BASE_URL}/api/usuarios_admin/login`, testCredentials, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });
    
    console.log("✅ Respuesta exitosa del backend:");
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log("🎉 ¡El backend está funcionando correctamente!");
    } else {
      console.log("⚠️ El backend respondió pero con error:", response.data.message);
    }
    
  } catch (error) {
    console.error("❌ Error al conectar con el backend:");
    console.error("Message:", error.message);
    
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("No se recibió respuesta del servidor");
    }
  }
}

// Ejecutar la prueba
testBackendConnection(); 