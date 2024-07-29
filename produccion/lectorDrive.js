document.addEventListener('DOMContentLoaded', function () {
    const downloadButton = document.getElementById('descargar');
    downloadButton.addEventListener('click', handleDownloadCertificates);

    const API_KEY = window.API_KEY;
    const CLIENT_ID = window.CLIENT_ID;
    const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
    const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

    let tokenClient;
    let gapiInited = false;
    let gisInited = false;

    function gapiLoaded() {
        gapi.load('client', initializeGapiClient);
    }

    async function initializeGapiClient() {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        maybeEnableButtons();
    }

    function gisLoaded() {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // defined later
        });
        gisInited = true;
        maybeEnableButtons();
    }

    function maybeEnableButtons() {
        if (gapiInited && gisInited) {
            document.getElementById('descargar').disabled = false;
        }
    }

    function handleDownloadCertificates(event) {
        event.preventDefault();
        if (!tokenClient) {
            console.error('Token client is not initialized');
            return;
        }
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                console.error(resp);
                return;
            }
            await getDataFromSheet();
        };

        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    }

    async function getDataFromSheet() {
        const spreadsheetId = '1cseAr91fX0WjpxGUwPlvcRtpX0yYuWc9NcMJdBLZEZ4'; // Reemplaza con tu ID de hoja de cálculo
        const range = 'Hoja1!A:A'; // Rango de datos a obtener (solo nombres)

        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                range: range,
            });

            const data = response.result.values;
            const names = data.map(row => row[0]);
            console.log(names);
            
            // Almacenar los nombres en window para que script.js pueda acceder a ellos
            window.namesFromSheet = names;

            // Llamar a la función para generar certificados con los nombres obtenidos
            generateCertificates(names);

        } catch (error) {
            console.error('Error al obtener los datos:', error);
            console.log('Detalles del error:', error.result.error);
        }
    }

    window.gapiLoaded = gapiLoaded;
    window.gisLoaded = gisLoaded;
});