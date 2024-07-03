
// const API_KEY = window.API_KEY;
// const CLIENT_ID = window.CLIENT_ID;
// const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
// const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

// gapi.load('client', () => {
//     gapi.client.init({
//         apiKey: API_KEY,
//         discoveryDocs: DISCOVERY_DOCS
//     });
// });

// // Configurar el token de autenticación con GIS
// const tokenClient = google.accounts.oauth2.initTokenClient({
//     client_id: CLIENT_ID,
//     scope: SCOPES,
//     callback: (response) => {
//         if (response.error) {
//             console.error('Error al obtener el token de acceso:', response);
//             return;
//         }
//         getDataFromSheet(response.access_token);
//     }
// });

// // Solicitar el token de acceso
// tokenClient.requestAccessToken();
// }

// async function getDataFromSheet(accessToken) {
// const spreadsheetId = '1cseAr91fX0WjpxGUwPlvcRtpX0yYuWc9NcMJdBLZEZ4'; // Reemplaza con tu ID de hoja de cálculo
// const range = 'Hoja1!A:B'; // Rango de datos a obtener

// try {
//     gapi.client.setToken({ access_token: accessToken });

//     const response = await gapi.client.sheets.spreadsheets.values.get({
//         spreadsheetId: spreadsheetId,
//         range: range,
//     });

//     const data = response.result.values;
//     console.log(data);

//     // Aquí puedes continuar con tu lógica para modificar el PDF usando PDF-LIB y PDF.js

// } catch (error) {
//     console.error('Error al obtener los datos:', error);
// }