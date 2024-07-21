document.addEventListener('DOMContentLoaded', async function () {
    const generateButton = document.getElementById('generar');
    generateButton.addEventListener('click', handleGenerateCertificate);

    async function handleGenerateCertificate(event) {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const dni = document.getElementById('dni').value;
        const ingreso = document.getElementById('ingreso').value;
        const instructor = document.getElementById('instructor').value;
        const direccion = document.getElementById('direccion').value;
        const centroformacion = document.getElementById('centroformacion').value;
        const nivelOperario = document.getElementById('nivelOperario').value;

        if (!nombre || !dni || !ingreso || !instructor || !direccion || !centroformacion) {
            alert('Todos los campos son Obligatorios');
            return;
        }

        // Lógica para generar el certificado PDF utilizando los datos del formulario
<<<<<<< HEAD
        const pdfBytes = await generateCustomCertificate(nombre, dni, curso, ingreso, salida, instructor, direccion, centroformacion, nivelOperario);
=======
        const pdfBytes = await generateCustomCertificate(nombre, dni, ingreso, instructor, direccion, centroformacion);
>>>>>>> 6eb7c4fb312575ef46380b4ad74e448f1d586816

        // Descargar el certificado generado
        if (pdfBytes) {
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Certificado-${nombre}.pdf`;
            link.click();
        }
    }

<<<<<<< HEAD
    async function generateCustomCertificate(nombre, dni, curso, ingreso, salida, instructor, direccion, centroformacion, nivelOperario) {
        // Usar fetch para obtener el archivo PDF base
        const response = await fetch('certificadoprueba.pdf'); // Reemplaza 'certificadoprueba.pdf' con tu archivo base
        const arrayBuffer = await response.arrayBuffer();
=======
    async function generateCustomCertificate(nombre, dni, ingreso, instructor, direccion, centroformacion) {
        const { PDFDocument, rgb } = PDFLib;
>>>>>>> 6eb7c4fb312575ef46380b4ad74e448f1d586816

        // Cargar plantilla de certificado
        const url = 'certificados/certificadoprueba.pdf'; // Reemplaza 'certificadoprueba.pdf' con tu archivo base
        const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Configuración de fuentes
        const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

        // Añadir texto al PDF
        firstPage.drawText(nombre, {
            x: 100,
            y: 500,
            size: 24,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`DNI: ${dni}`, {
            x: 100,
            y: 470,
            size: 20,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`Fecha de Ingreso: ${ingreso}`, {
            x: 100,
            y: 440,
            size: 20,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`Instructor: ${instructor}`, {
            x: 100,
            y: 410,
            size: 20,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`Dirección: ${direccion}`, {
            x: 100,
            y: 380,
            size: 20,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`Centro de Formación: ${centroformacion}`, {
            x: 100,
            y: 350,
            size: 20,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        // Serializar el PDF y devolver los bytes
        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
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