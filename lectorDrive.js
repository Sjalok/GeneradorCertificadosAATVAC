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
        const range = 'Hoja1!A:B'; // Rango de datos a obtener

        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                range: range,
            });

            const data = response.result.values;
            console.log(data);

            // for (let i = 0; i < data.length; i++) {
            //     const nombre = data[i][0];

            //     // Generar el certificado PDF para cada fila de datos
            //     const pdfBytes = await generateCustomCertificate(nombre);

            //     // Descargar el certificado generado
            //     if (pdfBytes) {
            //         const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            //         const link = document.createElement('a');
            //         link.href = window.URL.createObjectURL(blob);
            //         link.download = `Certificado-${nombre}.pdf`;
            //         link.click();
            //     }
            // }

        } catch (error) {
            console.error('Error al obtener los datos:', error);
            console.log('Detalles del error:', error.result.error);
        }
    }

    window.gapiLoaded = gapiLoaded;
    window.gisLoaded = gisLoaded;
});