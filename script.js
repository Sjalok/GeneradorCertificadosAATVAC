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
        const centroformacion = document.getElementById('centroformacion').value.trim();

        if (!nombre || !dni || !ingreso || !instructor || !direccion || !centroformacion || !certificacion) {
            alert('Todos los campos son Obligatorios');
            return;
        }

        const yearsToAdd = (certificacion === 'TSA') ? 1 : 2;
        const expirationDate = addYearsToDate(ingreso, yearsToAdd);
        const formattedExpirationDate = formatDate(expirationDate);

        const pdfBytes = await generateCustomCertificate(url, nombre, dni, formattedIngreso, instructor, direccion, centroformacion, formattedExpirationDate, certificacion);

        if (pdfBytes) {
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Certificado-${nombre}.pdf`;
            link.click();
        }
    }

    async function generateCustomCertificate(url, nombre, dni, formattedIngreso, instructor, direccion, centroformacion, formattedExpirationDate, certificacion) {
        const { PDFDocument, rgb } = PDFLib;

        const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width } = firstPage.getSize();

        const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        const helveticaBoldObliqueFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBoldOblique); // Fuente en negrita y cursiva

        // Mapa de números de registro
        const registroMap = {
            'Rodriguez Juan Manuel': '0257',
            'Suarez Guido': '0321',
            'Lehner Ian': '0018',
            'Commegna Pablo': '0016',
            'Martin Santiago': '2161',
            'Isis Marcos': '5161'
            // Agrega aquí todos los nombres y sus números de registro correspondientes
        };

        async function embedImage(pdfDoc, name, format) {
            try {
                const response = await fetch(`./firmas/${name.replace(/ /g, '')}.${format}`);
                if (!response.ok) {
                    throw new Error('Image not found');
                }
                const bytes = await response.arrayBuffer();
                if (format === 'jpeg' || format === 'jpg') {
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
        
        if (certificacion === 'RTC') {
            firstPage.drawText(nombre, {
                x: xCenteredNombre,
                y: 365,
                size: fontSizeNombre,
                font: helveticaBoldFont,
                color: rgb(0, 0, 0),
            });
        } else {
            firstPage.drawText(nombre, {
                x: xCenteredNombre,
                y: 350,
                size: fontSizeNombre,
                font: helveticaBoldFont,
                color: rgb(0, 0, 0),
            });
        }
        
        if (certificacion === 'RTC') {
            firstPage.drawText(`DNI: ${dni}`, {
                x: 360,
                y: 325,
                size: 17,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        } else {
            firstPage.drawText(`DNI: ${dni}`, {
                x: 360,
                y: 310,
                size: 17,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        }
        
        firstPage.drawText(fecha, {
            x: xCenteredFecha,
            y: 210,
            size: fontSizeFecha,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
        });

        if (certificacion === 'RTC') {
            firstPage.drawText(centroformacion, {
                x: xCenteredCF,
                y: 280,
                size: fontSizeCF,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        } else if (certificacion === 'APC1') {
            firstPage.drawText(centroformacion, {
                x: xCenteredCF,
                y: 272,
                size: fontSizeCF,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        } else {
            firstPage.drawText(centroformacion, {
                x: xCenteredCF,
                y: 263.8,
                size: fontSizeCF,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        }
        
        // Añadir las imágenes de las firmas
        if (instructorFirmaImage) {
            firstPage.drawImage(instructorFirmaImage, {
                x: 100,
                y: 120,
                width: 100,
                height: 80,
            });
        }

        if (direccionFirmaImage) {
            firstPage.drawImage(direccionFirmaImage, {
                x: 650,
                y: 120,
                width: 100,
                height: 80,
            });
        }

        const fixedPositionXLeft = 100; // Posición fija para la columna izquierda
        const fixedPositionXRight = 650; // Posición fija para la columna derecha
        const baseYPosition = 100; // Posición base Y

        // Añadir texto alineado para el instructor
        if (instructor) {
            if (instructor.value === 'Rodriguez Juan Manuel') {
                firstPage.drawText(instructor, {
                    x: fixedPositionXLeft - 10, // Coordenadas específicas para este nombre
                    y: baseYPosition,
                    size: 9,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });

                const registroInstructor = registroMap[instructor] || 'XXXX';
                firstPage.drawText(`Reg. N° ${registroInstructor} - Dirección`, {
                    x: fixedPositionXLeft - 14, // Coordenadas específicas para este nombre
                    y: baseYPosition - 12,
                    size: 10,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                });
            } else {
                firstPage.drawText(instructor, {
                    x: fixedPositionXLeft + 15,
                    y: baseYPosition,
                    size: 9,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });

                const registroInstructor = registroMap[instructor] || 'XXXX';
                firstPage.drawText(`Reg. N° ${registroInstructor} - Dirección`, {
                    x: fixedPositionXLeft - 4,
                    y: baseYPosition - 12, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                    size: 10,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                });
            }
        }

        // Añadir texto alineado para la dirección
        if (direccion) {
            if (nombre.value === 'Rodriguez Juan Manuel') {
                firstPage.drawText(direccion, {
                    x: fixedPositionXRight + 20, // Coordenadas específicas para este nombre
                    y: baseYPosition,
                    size: 9,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });

                const registroDireccion = registroMap[direccion] || 'XXXX';
                firstPage.drawText(`Reg. N° ${registroDireccion} - Equipo académico`, {
                    x: fixedPositionXRight - 3,
                    y: baseYPosition - 12, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                    size: 10,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                });
            } else {
                firstPage.drawText(direccion, {
                    x: fixedPositionXRight + 25,
                    y: baseYPosition,
                    size: 9,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });

                const registroDireccion = registroMap[direccion] || 'XXXX';
                firstPage.drawText(`Reg. N° ${registroDireccion} - Equipo académico`, {
                    x: fixedPositionXRight - 20,
                    y: baseYPosition - 12, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                    size: 10,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                });
            }
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