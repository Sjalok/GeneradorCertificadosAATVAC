document.addEventListener('DOMContentLoaded', async function () {
    const generateButton = document.getElementById('generar');
    generateButton.addEventListener('click', handleGenerateCertificate);

    async function handleGenerateCertificate(event) {
        event.preventDefault();

        const pdfMap = {
            'TSA': 'certificados/CertificadoTSA.pdf',
            'APC1': 'certificados/CertificadoAPC1.pdf',
            'APC2': 'certificados/CertificadoAPC2.pdf',
            'APC3': 'certificados/CertificadoAPC3.pdf',
            'RTC': 'certificados/CertificadoRTC.pdf',
            'CF': 'certificados/CertificadoCF.pdf',
            'evaluador': 'certificados/CertificadoEvaluador.pdf',
            'instructor': 'certificados/CertificadoInstructor.pdf'
        };

        const certificacion = document.getElementById('cursos').value;
        const url = pdfMap[certificacion];

        const nombre = document.getElementById('nombre').value;
        const dni = document.getElementById('dni').value;
        const ingreso = document.getElementById('ingreso').value;
        const formattedIngreso = formatDate(new Date(ingreso));
        const instructor = document.getElementById('instructor').value;
        const direccion = document.getElementById('direccion').value;
        const centroformacion = document.getElementById('centroformacion').value;

        if (!nombre || !dni || !ingreso || !instructor || !direccion || !centroformacion || !certificacion) {
            alert('Todos los campos son Obligatorios');
            return;
        }

        const yearsToAdd = (certificacion === 'TSA') ? 1 : 2;
        const expirationDate = addYearsToDate(ingreso, yearsToAdd);
        const formattedExpirationDate = formatDate(expirationDate);

        // Lógica para generar el certificado PDF utilizando los datos del formulario
        const pdfBytes = await generateCustomCertificate(url, nombre, dni, formattedIngreso, instructor, direccion, centroformacion, formattedExpirationDate);

        // Descargar el certificado generado
        if (pdfBytes) {
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Certificado-${nombre}.pdf`;
            link.click();
        }
    }

    async function generateCustomCertificate(url, nombre, dni, formattedIngreso, instructor, direccion, centroformacion, formattedExpirationDate) {
        const { PDFDocument, rgb } = PDFLib;

        // Cargar plantilla de certificado
        const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Configuración de fuentes
        const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

        // Tamaño de fuente para el nombre
        const fontSize = 40;
        const textWidth = helveticaBoldFont.widthOfTextAtSize(nombre, fontSize); // Tamaño 40 ajustable
        const xCentered = (width - textWidth) / 2;

        // Añadir texto al PDF
        firstPage.drawText(nombre, {
            x: xCentered,
            y: 350,
            size: fontSize,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`DNI: ${dni}`, {
            x: 370,
            y: 310,
            size: 17,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`Acreditacion profesional AATVAC Reg. Nº: 0257 - Fecha emision: ${formattedIngreso} - Expira: ${formattedExpirationDate}`, {
            x: 100,
            y: 440,
            size: 20,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`${instructor}`, {
            x: 100,
            y: 410,
            size: 20,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`${direccion}`, {
            x: 100,
            y: 380,
            size: 20,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`Dictado en Centro de formacion ${centroformacion}.`, {
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

function addYearsToDate(date, years) {
    const newDate = new Date(date);
    newDate.setFullYear(newDate.getFullYear() + years);
    return newDate;
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}/${month}/${day}`;
}