document.addEventListener('DOMContentLoaded', async function () {
    const generateButtonGeneral = document.getElementById('generar');
    const generateButtonCF = document.getElementById('generarCF');
    const uploadButton = document.getElementById('upload-button');

    const formulario = document.querySelector('#cursanteForm');

    

    if (generateButtonGeneral) {
        generateButtonGeneral.addEventListener('click', handleGenerateCertificateGeneral);
    }

    if (generateButtonCF) {
        generateButtonCF.addEventListener('click', handleGenerateCertificateCF);
    }

    if (uploadButton) {
        uploadButton.addEventListener('click', handleExcelUpload);
    }

    // const registros = {
    //     'Marcos Isis': '0264',
    //     'Rodriguez Juan Manuel': '0031',
    //     'Commegna Pablo': '0113',
    //     'Suarez Guido': '0015',
    //     'Lehner Ian': '0028',
    //     'Martin Santiago': '0022',
    //     'Castillo Pablo': '0192',
    //     'Sanchez Nicolas': '0141'
    // };


    async function handleGenerateCertificateGeneral(event) {
        event.preventDefault();

        const pdfMap = {
            'TSA': 'certificados/CertificadoTSA.pdf',
            'APC1': 'certificados/CertificadoAPC1.pdf',
            'APC2': 'certificados/CertificadoAPC2.pdf',
            'APC3': 'certificados/CertificadoAPC3.pdf',
            'RTC1': 'certificados/CertificadoRTC1.pdf',
            'RTC2': 'certificados/CertificadoRTC2.pdf',
            'evaluador': 'certificados/CertificadoEvaluador.pdf',
            'instructor': 'certificados/CertificadoInstructor.pdf'
        };

        const certificacion = document.getElementById('cursos').value;
        const url = pdfMap[certificacion];

        const nombre = document.getElementById('nombre').value;
        const dni = document.getElementById('dni').value;
        const dniFormateado = formatearDNI(dni);
        const ingreso = document.getElementById('ingreso').value;
        const fecha = new Date(ingreso);
        fecha.setDate(fecha.getDate() + 1);
        const formattedIngreso = formatDate(fecha);
        centroformacion = document.getElementById('centroformacion').value.trim();
        const registroTitulo= document.getElementById('registro-titulo').value;

        if (!centroformacion && certificacion !== 'evaluador' && certificacion !== 'instructor') {
            console.log("asd");
            alert('Todos los campos son Obligatorios');
            return;
        } else if (centroformacion) {
            centroformacion = `Dictado en Centro de formacion ${centroformacion}`;
        }
        
        if (!nombre || !dni || !ingreso || !certificacion || !registroTitulo) {
            if (certificacion === 'APC1' || certificacion === 'APC2' || certificacion === 'APC3') {
                let ayudin = 0;
            }
            else {
                alert('Todos los campos son Obligatorios');
                return;
            }
        }

        const yearsToAdd = (certificacion === 'TSA') ? 1 : 2;
        const expirationDate = addYearsToDate(fecha, yearsToAdd);
        const formattedExpirationDate = formatDate(expirationDate);

        const pdfBytes = await generateCustomCertificate(url, nombre, dniFormateado, formattedIngreso, centroformacion, formattedExpirationDate, certificacion, registroTitulo);

        if (pdfBytes) {
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Certificado-${nombre}.pdf`;
            link.click();
            formulario.reset();
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

        if (!nombre || !cuit || !ingreso || !calle || !ciudad || !provincia) {
            alert('Todos los campos son Obligatorios');
        }
        const expirationDate = addYearsToDate(ingreso, 1);
        const formattedExpirationDate = formatDate(expirationDate);

        const pdfBytes = await generarCFCertificado(url, nombre, cuit, formattedIngreso, calle, ciudad, provincia, formattedExpirationDate, 'CF');

        if (pdfBytes) {
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Certificado- Centro de formacion ${nombre}.pdf`;
            link.click();
        }
    };

    async function handleExcelUpload(event) {
        event.preventDefault();

        const fileInput = document.getElementById('archivoExcel');
        const file = fileInput.files[0];
        const pdfBytes = [];
        const progressBar = document.querySelector('[role="progressbar"]');
        const progressContainer = document.getElementById('progress-container');

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
        
            // Convertir el archivo Excel a JSON, comenzando desde la fila 2 para evitar los encabezados
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // Revisar todas las filas (sin encabezados)
            let contador = 0;
            const totalRows = jsonData.length;
            const zip = new JSZip();
        
            progressContainer.style.display = 'block';
        
            for (const row of jsonData) {
                // Verifica si la fila tiene datos en las columnas importantes
                if (!row || Object.keys(row).length === 0) {
                    console.log('Fila vacía o inválida, saltando...');
                    continue; // Salta esta fila y pasa a la siguiente
                }
                console.log(`Procesando fila ${contador + 2}: `, row); // Para ver cuál fila está procesando

                // Campos requeridos según la certificación
                const requiredFields = ["Certificacion", "Nombre", "Apellido", "DNI", "Numero Registro", "Fecha Emision",  "Centro de formacion"];
                const requiredFieldsAPC = ["Certificacion", "Nombre", "Apellido", "DNI", "Numero Registro", "Fecha Emision", "Centro de formacion"];
        
                const isAPC = ["APC1", "APC2", "APC3"].includes(row.Certificacion);
                const fieldsToCheck = isAPC ? requiredFieldsAPC : requiredFields;
        
                // Verifica si hay campos faltantes
                for (const field of fieldsToCheck) {
                    if (!row[field]) {
                        alert(`Faltan campos en la fila ${contador + 2}: ${JSON.stringify(row)}.`);
                        return;
                    }
                }
        
                // Formatear DNI y Fecha Emisión si es necesario
                if (row.DNI) {
                    row.DNI = formatearDNIExcel(row.DNI);
                }
        
                if (typeof row['Fecha Emision'] === 'number') {
                    const jsDate = excelDateToJSDate(row['Fecha Emision']);
                    row['Fecha Emision'] = formatDate(jsDate);
                }
        
                // Generar PDF para la fila actual
                const pdfBytes = await generateCertificateFromRow(row);
                const fileName = `Certificado_${row.Nombre}_${row.Apellido}.pdf`;
                zip.file(fileName, pdfBytes, { binary: true });
                contador++;
        
                const progress = Math.round((contador / totalRows) * 100);
                progressBar.style.setProperty('--value', progress);
                progressBar.setAttribute('aria-valuenow', progress);
            }
        
            // Generar y descargar el archivo ZIP
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(zipBlob);
            link.download = 'Certificados.zip';
            link.click();
        
            // Finalizar progreso
            progressBar.style.setProperty('--value', 100);
            progressBar.setAttribute('aria-valuenow', 100);
        
            setTimeout(() => {
                alert('¡Todos los certificados se han generado con éxito!');
                progressContainer.style.display = 'none';
            }, 500);
        };
        reader.readAsArrayBuffer(file);
    }

    async function generateCustomCertificate(url, nombre, dniFormateado, formattedIngreso, centroformacion, formattedExpirationDate, certificacion, registroTitulo) {
        const { PDFDocument, rgb } = PDFLib;

        const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const secondPage = pages[1];
        const { width } = firstPage.getSize();

        const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        const helveticaBoldObliqueFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBoldOblique);

        const fontSizeNombre = 40;
        const textWidthNombre = helveticaBoldFont.widthOfTextAtSize(nombre, fontSizeNombre);
        const xCenteredNombre = (width - textWidthNombre) / 2;

        const fontSizeCF = 13.5;
        const textWidthCF = helveticaFont.widthOfTextAtSize(centroformacion, fontSizeCF);
        const xCenteredCF = (width - textWidthCF) / 2;

        fecha = `Registro profesional AATTVAC Nº: ${registroTitulo} - Fecha emision: ${formattedIngreso} - Expira: ${formattedExpirationDate}`;

        const fontSizeFecha = 14;
        const textWidthFecha = helveticaBoldFont.widthOfTextAtSize(fecha, fontSizeFecha);
        const xCenteredFecha = (width - textWidthFecha) / 2;

        if (certificacion === 'RTC1') {
            firstPage.drawText(nombre, {
                x: xCenteredNombre,
                y: 362,
                size: fontSizeNombre,
                font: helveticaBoldFont,
                color: rgb(0, 0, 0),
            });
        } else if (certificacion === 'APC1' || certificacion === 'APC2' || certificacion === 'APC3') {
            firstPage.drawText(nombre, {
                x: xCenteredNombre,
                y: 360,
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

        if (certificacion === 'RTC1') {
            firstPage.drawText(`DNI: ${dniFormateado}`, {
                x: 360,
                y: 319,
                size: 17,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        } else if (certificacion === 'APC1' || certificacion === 'APC2' || certificacion === 'APC3') {
            firstPage.drawText(`DNI: ${dniFormateado}`, {
                x: 360,
                y: 319,
                size: 17,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        }
         else {
            firstPage.drawText(`DNI: ${dniFormateado}`, {
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
            if (certificacion === 'APC1' || certificacion === 'APC2' || certificacion === 'APC3') {
                firstPage.drawText(centroformacion, {
                    x: xCenteredCF,
                    y: 283,
                    size: fontSizeCF,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });
            } else if (certificacion === 'RTC1') {
                firstPage.drawText(centroformacion, {
                    x: xCenteredCF,
                    y: 280,
                    size: fontSizeCF,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });
             } else if (certificacion === 'RTC2') {
                    firstPage.drawText(centroformacion, {
                        x: xCenteredCF,
                        y: 259.5,
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
        
        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    }

    async function generarCFCertificado(url, nombre, cuit, formattedIngreso, calle, ciudad, provincia, formattedExpirationDate, certificacion) {
        const { PDFDocument, rgb } = PDFLib;

        const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width } = firstPage.getSize();

        const ubicacion = `ubicado en la calle ${calle}, ${ciudad}, ${provincia}`;

        const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        const helveticaBoldObliqueFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBoldOblique);

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

        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    }

    async function generateCertificateFromRow(row) {
        const pdfMap = {
            'TSA': 'certificados/CertificadoTSA.pdf',
            'APC1': 'certificados/CertificadoAPC1.pdf',
            'APC2': 'certificados/CertificadoAPC2.pdf',
            'APC3': 'certificados/CertificadoAPC3.pdf',
            'RTC1': 'certificados/CertificadoRTC1.pdf',
            'RTC2': 'certificados/CertificadoRTC2.pdf',
            'evaluador': 'certificados/CertificadoEvaluador.pdf',
            'instructor': 'certificados/CertificadoInstructor.pdf'
        };

        const certificacion = row['Certificacion'];
        const url = pdfMap[certificacion];

        const nombre = `${row['Nombre']} ${row['Apellido']}`;
        const dni = row['DNI'];
        const ingreso = row['Fecha Emision'];
        const centroformacion = `dictado en centro de formacion ${row['Centro de formacion']}`;
        const registroTitulo = row['Numero Registro'];

        const yearsToAdd = (certificacion === 'TSA') ? 1 : 2;
        const expirationDate = addYearsToDateExcel(ingreso, yearsToAdd);
        const formattedExpirationDate = formatDate(expirationDate);

        const pdfBytes = await generateCustomCertificate(url, nombre, dni, ingreso, centroformacion, formattedExpirationDate, certificacion, registroTitulo);

        return pdfBytes;
    }
});

function addYearsToDate(date, years) {
    const newDate = new Date(date);
    console.log(newDate)
    newDate.setFullYear(newDate.getFullYear() + years);
    return newDate;
}

function addYearsToDateExcel(date, years) {
    const partes = date.split('/');
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

function excelDateToJSDate(excelDateNumber) {
    const excelBaseDate = new Date(1900, 0, 1);
    const jsDate = new Date(excelBaseDate.getTime() + (excelDateNumber - 1) * 24 * 60 * 60 * 1000);
    if (excelDateNumber > 59) {
        jsDate.setDate(jsDate.getDate() - 1);
    }
    return jsDate;
}

function formatearDNIExcel(dni) {
    return dni.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatearDNI(dni) {
    return dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}