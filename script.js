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

        //  if (!nombre || !dni || !ingreso || !instructor || !direccion || !centroformacion) {
        //     alert('Todos los campos son Obligatorios');
        //     return;
        // }

        // Lógica para generar el certificado PDF utilizando los datos del formulario
        const pdfBytes = await generateCustomCertificate(nombre, dni, ingreso, instructor, direccion, centroformacion);

        // Descargar el certificado generado
        if (pdfBytes) {
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Certificado-${nombre}.pdf`;
            link.click();
        }
    }

    async function generateCustomCertificate(nombre, dni, ingreso, instructor, direccion, centroformacion) {
        const { PDFDocument, rgb } = PDFLib;

        // Cargar plantilla de certificado
        const url = 'certificados/CertificadoAPC1.pdf'; // Reemplaza 'certificadoprueba.pdf' con tu archivo base
        const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Configuración de fuentes
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

        // Incluir firma del instructor
        const instructorFirmaImage = await embedImage(pdfDoc, instructor, 'jpeg') || await embedImage(pdfDoc, instructor, 'jpg');

        // Incluir firma de la dirección
        const direccionFirmaImage = await embedImage(pdfDoc, direccion, 'jpeg') || await embedImage(pdfDoc, direccion, 'jpg');

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

        // Añadir las imágenes de las firmas
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