document.addEventListener('DOMContentLoaded', function () {
    const generateButton = document.getElementById('generar');
    generateButton.addEventListener('click', handleGenerateCertificate);

    async function handleGenerateCertificate(event) {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value;

        // Lógica para generar el certificado PDF utilizando los datos del formulario
        const pdfBytes = await generateCustomCertificate(nombre);

        // Descargar el certificado generado
        if (pdfBytes) {
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Certificado-${nombre}.pdf`;
            link.click();
        }
    }

    async function generateCustomCertificate(nombre) {
        // Usar fetch para obtener el archivo PDF base
        const response = await fetch('pdfestandar.pdf'); // Reemplaza 'pdfestandar.pdf' con tu archivo base
        const arrayBuffer = await response.arrayBuffer();

        // Usar PDF-LIB para modificar el PDF base
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

        // Modificar el PDF según los datos del formulario
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Ejemplo de modificación (ajustar según tu necesidad)
        firstPage.drawText(nombre, {
            x: 50,
            y: 550,
            size: 20,
            font: helveticaFont,
            color: PDFLib.rgb(0, 0, 0),
        });

        // Devolver los bytes del PDF modificado
        return await pdfDoc.save();
    }

    // Función para generar certificados en base a una lista de nombres
    async function generateCertificates(names) {
        for (const name of names) {
            const pdfBytes = await generateCustomCertificate(name);

            if (pdfBytes) {
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = `Certificado-${name}.pdf`;
                link.click();
            }
        }
    }

    // Hacer la función disponible globalmente para que lectorDrive.js pueda llamarla
    window.generateCertificates = generateCertificates;
});