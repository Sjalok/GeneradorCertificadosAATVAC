document.addEventListener('DOMContentLoaded', async function () {
    const generateButtonGeneral = document.getElementById('generar');
    const generateButtonCF = document.getElementById('generarCF');
    const uploadButton = document.getElementById('upload-button');

    if (generateButtonGeneral) {
        generateButtonGeneral.addEventListener('click', handleGenerateCertificateGeneral);
    }

    if (generateButtonCF) {
        generateButtonCF.addEventListener('click', handleGenerateCertificateCF);
    }

    if (uploadButton) {
        uploadButton.addEventListener('click', handleExcelUpload);
    }

    async function handleGenerateCertificateGeneral(event) {
        event.preventDefault();

        const pdfMap = {
            'TSA': 'certificados/CertificadoTSA.pdf',
            'APC1': 'certificados/CertificadoAPC1.pdf',
            'APC2': 'certificados/CertificadoAPC2.pdf',
            'APC3': 'certificados/CertificadoAPC3.pdf',
            'RTC': 'certificados/CertificadoRTC.pdf',
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
        const registroTitulo= document.getElementById('registro-titulo').value;
        const registroInstructor= document.getElementById('registro-instructor').value;
        const registroDireccion= document.getElementById('registro-direccion').value;


        // if (!nombre || !dni || !ingreso || !instructor || !direccion || !centroformacion || !certificacion) {
        //     alert('Todos los campos son Obligatorios');
        //     return;
        // }

        const yearsToAdd = (certificacion === 'TSA') ? 1 : 2;
        const expirationDate = addYearsToDate(ingreso, yearsToAdd);
        const formattedExpirationDate = formatDate(expirationDate);

        const pdfBytes = await generateCustomCertificate(url, nombre, dni, formattedIngreso, instructor, direccion, centroformacion, formattedExpirationDate, certificacion, registroTitulo, registroInstructor, registroDireccion);

        if (pdfBytes) {
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Certificado-${nombre}.pdf`;
            link.click();
        }
    }

    async function handleGenerateCertificateCF(event) {
        event.preventDefault();

        const url = 'certificados/CertificadoCF.pdf';

        const nombre = document.getElementById('nombreCF').value;
        const cuit = document.getElementById('cuitCF').value;
        const ingreso = document.getElementById('ingresoCF').value;
        const formattedIngreso = formatDate(new Date(ingreso));
        const instructor = document.getElementById('instructor').value;
        const direccion = document.getElementById('direccion').value;
        const calle = document.getElementById('calleCF').value;
        const ciudad = document.getElementById('ciudadCF').value;
        const provincia = document.getElementById('provinciaCF').value;
        const registroInstructor= document.getElementById('registro-instructor').value;
        const registroDireccion= document.getElementById('registro-direccion').value;

        // if (!nombre || !cuit || !ingreso || !instructor || !direccion || !calle || !ciudad || !provincia || !registroDireccion || !registroInstructor) {
        //     alert('Todos los campos son Obligatorios');
        //     return;
        // }

        const expirationDate = addYearsToDate(ingreso, 2); // Asumiendo que CF siempre expira en 2 años
        const formattedExpirationDate = formatDate(expirationDate);

        const pdfBytes = await generarCFCertificado(url, nombre, cuit, formattedIngreso, instructor, direccion, calle, ciudad, provincia, formattedExpirationDate, 'CF', registroInstructor, registroDireccion);

        if (pdfBytes) {
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Certificado- Centro de formacion ${nombre}.pdf`;
            link.click();
        }
    }

    async function handleExcelUpload(event) {
        event.preventDefault();

        const fileInput = document.getElementById('archivoExcel');
        const file = fileInput.files[0];

        if (!file) {
            alert('Por favor, carga un archivo Excel primero.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            console.log(jsonData);

            for (const row of jsonData) {
                await generateCertificateFromRow(row);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    async function generateCustomCertificate(url, nombre, dni, formattedIngreso, instructor, direccion, centroformacion, formattedExpirationDate, certificacion, registroTitulo, registroInstructor, registroDireccion) {
        const { PDFDocument, rgb } = PDFLib;

        const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width } = firstPage.getSize();

        console.log("hola");

        const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        const helveticaBoldObliqueFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBoldOblique); // Fuente en negrita y cursiva

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

        fecha = `Acreditacion profesional AATVAC Reg. Nº: ${registroTitulo} - Fecha emision: ${formattedIngreso} - Expira: ${formattedExpirationDate}`;

        const fontSizeFecha = 14;
        const textWidthFecha = helveticaBoldFont.widthOfTextAtSize(fecha, fontSizeFecha);
        const xCenteredFecha = (width - textWidthFecha) / 2;

        if (certificacion === 'RTC') {
            firstPage.drawText(nombre, {
                x: xCenteredNombre,
                y: 362,
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
                y: 319,
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

        if (certificacion != 'evaluador' && certificacion != 'instructor') {
            if (certificacion === 'APC1') {
                firstPage.drawText(centroformacion, {
                    x: xCenteredCF,
                    y: 272,
                    size: fontSizeCF,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });
            } else if (certificacion === 'RTC') {
                firstPage.drawText(centroformacion, {
                    x: xCenteredCF,
                    y: 280,
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
            if (instructor === 'Rodriguez Juan Manuel') {
                firstPage.drawText(instructor, {
                    x: fixedPositionXLeft, // Coordenadas específicas para este nombre
                    y: baseYPosition,
                    size: 9,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });
            
                firstPage.drawText(`Reg. N° ${registroInstructor} - Dirección`, {
                    x: fixedPositionXLeft - 5, // Coordenadas específicas para este nombre
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
            
                firstPage.drawText(`Reg. N° ${registroInstructor} - Dirección`, {
                    x: fixedPositionXLeft - 15,
                    y: baseYPosition - 12, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                    size: 10,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                });
            }
        }

        // Añadir texto alineado para la dirección
        if (direccion) {
            if (direccion === 'Rodriguez Juan Manuel') {
                firstPage.drawText(direccion, {
                    x: fixedPositionXRight, // Coordenadas específicas para este nombre
                    y: baseYPosition,
                    size: 9,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });
            
                firstPage.drawText(`Reg. N° ${registroDireccion} - Equipo académico`, {
                    x: fixedPositionXRight - 30,
                    y: baseYPosition - 12, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                    size: 10,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                });
            } else {
                firstPage.drawText(direccion, {
                    x: fixedPositionXRight + 15,
                    y: baseYPosition,
                    size: 9,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });
            
                firstPage.drawText(`Reg. N° ${registroDireccion} - Equipo académico`, {
                    x: fixedPositionXRight - 28,
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

    async function generarCFCertificado(url, nombre, cuit, formattedIngreso, instructor, direccion, calle, ciudad, provincia, formattedExpirationDate, certificacion, registroInstructor, registroDireccion) {
        const { PDFDocument, rgb } = PDFLib;

        const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width } = firstPage.getSize();

        const ubicacion = `ubicado en la calle ${calle}, ${ciudad}, ${provincia}`;

        const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        const helveticaBoldObliqueFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBoldOblique); // Fuente en negrita y cursiva

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

        const fontSizeNombre = 95;
        const textWidthNombre = helveticaBoldFont.widthOfTextAtSize(nombre, fontSizeNombre);
        const xCenteredNombre = (width - textWidthNombre) / 2;

        cuit2 = `CUIT: ${cuit}`;

        const fontSizeCuit = 40;
        const textWidthCuit = helveticaFont.widthOfTextAtSize(cuit2, fontSizeCuit);
        const xCenteredCuit = (width - textWidthCuit) / 2;

        fecha = `Fecha de emision: ${formattedIngreso} - expira: ${formattedExpirationDate}`;

        const fontSizeFecha = 25;
        const textWidthFecha = helveticaBoldFont.widthOfTextAtSize(fecha, fontSizeFecha);
        const xCenteredFecha = (width - textWidthFecha) / 2;

        const fontSizeUbicacion = 35;
        const textWidthUbicacion = helveticaFont.widthOfTextAtSize(ubicacion, fontSizeUbicacion);
        const xCenteredUbicacion = (width - textWidthUbicacion) / 2;

        firstPage.drawText(nombre, {
            x: xCenteredNombre,
            y: 700,
            size: fontSizeNombre,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(cuit2, {
            x: xCenteredCuit,
            y: 610,
            size: fontSizeCuit,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(ubicacion, {
            x: xCenteredUbicacion,
            y: 485,
            size: fontSizeUbicacion,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(fecha, {
            x: xCenteredFecha,
            y: 390,
            size: fontSizeFecha,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
        });

        // Añadir las imágenes de las firmas
        if (instructorFirmaImage) {
            firstPage.drawImage(instructorFirmaImage, {
                x: 220,
                y: 200,
                width: 180,
                height: 140,
            });
        }

        if (direccionFirmaImage) {
            firstPage.drawImage(direccionFirmaImage, {
                x: 1180,
                y: 200,
                width: 180,
                height: 140,
            });
        }

        const fixedPositionXLeft = 220; // Posición fija para la columna izquierda
        const fixedPositionXRight = 1180; // Posición fija para la columna derecha
        const baseYPosition = 180; // Posición base Y

        // Añadir texto alineado para el instructor
        if (instructor) {
            if (instructor === 'Rodriguez Juan Manuel') {
                firstPage.drawText(instructor, {
                    x: fixedPositionXLeft - 20, // Coordenadas específicas para este nombre
                    y: baseYPosition,
                    size: 19,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });
            
                firstPage.drawText(`Reg. N° ${registroInstructor} - Dirección`, {
                    x: fixedPositionXLeft - 25, // Coordenadas específicas para este nombre
                    y: baseYPosition - 22,
                    size: 20,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                });
            } else {
                firstPage.drawText(instructor, {
                    x: fixedPositionXLeft + 15,
                    y: baseYPosition,
                    size: 19,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });
            
                firstPage.drawText(`Reg. N° ${registroInstructor} - Dirección`, {
                    x: fixedPositionXLeft - 35,
                    y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                    size: 20,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                });
            }
        }

        // Añadir texto alineado para la dirección
        if (direccion) {
            if (direccion === 'Rodriguez Juan Manuel') {
                firstPage.drawText(direccion, {
                    x: fixedPositionXRight - 20, // Coordenadas específicas para este nombre
                    y: baseYPosition,
                    size: 19,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });
            
                firstPage.drawText(`Reg. N° ${registroDireccion} - Equipo académico`, {
                    x: fixedPositionXRight - 65,
                    y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                    size: 20,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                });
            } else {
                firstPage.drawText(direccion, {
                    x: fixedPositionXRight + 15,
                    y: baseYPosition,
                    size: 19,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });
            
                firstPage.drawText(`Reg. N° ${registroDireccion} - Equipo académico`, {
                    x: fixedPositionXRight - 75,
                    y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                    size: 20,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                });
            }
        }

        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    }

    async function generateCertificateFromRow(row) {
        const pdfMap = {
            'TSA': 'certificados/CertificadoTSA.pdf',
            'APC1': 'certificados/CertificadoAPC1.pdf',
            'APC2': 'certificados/CertificadoAPC2.pdf',
            'APC3': 'certificados/CertificadoAPC3.pdf',
            'RTC': 'certificados/CertificadoRTC.pdf',
            'evaluador': 'certificados/CertificadoEvaluador.pdf',
            'instructor': 'certificados/CertificadoInstructor.pdf'
        };

        const certificacion = row['certificacion'];
        const url = pdfMap[certificacion];

        const nombre = row['nombre'];
        const dni = row['dni'];
        const ingreso = row['Fecha Emision'];
        const formattedIngreso = convertirFecha(ingreso);
        const instructor = row['Evaluador'];
        const direccion = row['Direccion'];
        const centroformacion = `dictado en centro de formacion ${row['Centro de formacion']}`;
        const registroTitulo = row['Numero Registro'];
        const registroInstructor = row['Nro Evaluador'];
        const registroDireccion = row['Nro Direccion'];

        const yearsToAdd = (certificacion === 'TSA') ? 1 : 2;
        const expirationDate = addYearsToDateExcel(formattedIngreso, yearsToAdd);
        const formattedExpirationDate = formatDate(expirationDate);

        // console.log(`Nombre: ${nombre}, DNI: ${dni}, Fecha Ingreso: ${formattedIngreso}, Instructor: ${instructor}, Direccion: ${direccion}, Centro Formacion: ${centroformacion}, Registro Titulo: ${registroTitulo}, Registro Instructor: ${registroInstructor}, Registro Direccion: ${registroDireccion}`);

        const pdfBytes = await generateCustomCertificate(url, nombre, dni, formattedIngreso, instructor, direccion, centroformacion, formattedExpirationDate, certificacion, registroTitulo, registroInstructor, registroDireccion);

        if (pdfBytes) {
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Certificado-${nombre}.pdf`;
            link.click();
        }
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
    console.log(date);
    const newDate = new Date(date);
    console.log(newDate);
    newDate.setFullYear(newDate.getFullYear() + years);
    return newDate;
}

function addYearsToDateExcel(dateStr, years) {
    const partes = dateStr.split('/');
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const anio = parseInt(partes[2], 10);
    
    const newDate = new Date(anio, mes, dia);

    newDate.setFullYear(newDate.getFullYear() + years);
    
    return newDate;
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function convertirFecha(fechaStr) {
    // Se asume que el formato original es "aaaa/dd/mm"
    const partes = fechaStr.split('/');
    const anio = partes[0];
    const dia = partes[1];
    const mes = partes[2];

    // Construir la nueva fecha en formato "dd/mm/aaaa"
    const fechaFormateada = `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${anio}`;

    return fechaFormateada;
}