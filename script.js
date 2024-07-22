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
        const centroformacion = document.getElementById('centroformacion').value.trim(); // Trim spaces

        if (!nombre || !dni || !ingreso || !instructor || !direccion || !centroformacion || !certificacion) {
            alert('Todos los campos son Obligatorios');
            return;
        }

        const yearsToAdd = (certificacion === 'TSA') ? 1 : 2;
        const expirationDate = addYearsToDate(ingreso, yearsToAdd);
        const formattedExpirationDate = formatDate(expirationDate);

        const pdfBytes = await generateCustomCertificate(url, nombre, dni, formattedIngreso, instructor, direccion, centroformacion, formattedExpirationDate);

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

        const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width } = firstPage.getSize();

        const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

        async function embedImage(pdfDoc, name, format) {
            try {
                const response = await fetch(`./firmas/${name.replace(' ', '')}.${format}`);
                if (!response.ok) {
                    throw new Error('Image not found');
                }
                const bytes = await response.arrayBuffer();
                if (format === 'jpeg') {
                    return await pdfDoc.embedJpg(bytes);
                } else if (format === 'jpg') {
                    return await pdfDoc.embedJpg(bytes);
                } else if (format === 'png') {
                    return await pdfDoc.embedPng(bytes);
                }
            } catch (error) {
                console.error(`Failed to embed image: ${error.message}`);
                return null;
            }
        }

        const instructorFirmaImage = await embedImage(pdfDoc, instructor, 'jpeg') || await embedImage(pdfDoc, instructor, 'jpg');
        const direccionFirmaImage = await embedImage(pdfDoc, direccion, 'jpeg') || await embedImage(pdfDoc, direccion, 'jpg');

        const fontSizeNombre = 40;
        const textWidthNombre = helveticaBoldFont.widthOfTextAtSize(nombre, fontSizeNombre);
        const xCenteredNombre = (width - textWidthNombre) / 2;

        const fontSizeCF = 13.5;
        const textWidthCF = helveticaFont.widthOfTextAtSize(centroformacion, fontSizeCF);
        const xCenteredCF = (width - textWidthCF) / 2;

        fecha = `Acreditacion profesional AATVAC Reg. Nº: 0257 - Fecha emision: ${formattedIngreso} - Expira: ${formattedExpirationDate}`;

        const fontSizeFecha = 14;
        const textWidthFecha = helveticaBoldFont.widthOfTextAtSize(fecha, fontSizeFecha);
        const xCenteredFecha = (width - textWidthFecha) / 2;

        firstPage.drawText(nombre, {
            x: xCenteredNombre,
            y: 350,
            size: fontSizeNombre,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`DNI: ${dni}`, {
            x: 360,
            y: 310,
            size: 17,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(fecha, {
            x: xCenteredFecha,
            y: 210,
            size: fontSizeFecha,
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

        firstPage.drawText(centroformacion, {
            x: xCenteredCF,
            y: 263.8,
            size: fontSizeCF,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        if (instructorFirmaImage) {
            firstPage.drawImage(instructorFirmaImage, {
                x: 100,
                y: 100,
                width: 100,
                height: 50,
            });
        }

        if (direccionFirmaImage) {
            firstPage.drawImage(direccionFirmaImage, {
                x: 650,
                y: 100,
                width: 100,
                height: 50,
            });
        }

        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    }

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