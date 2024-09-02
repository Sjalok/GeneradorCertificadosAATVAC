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

    const registros = {
        'Marcos Isis': '0264',
        'Rodriguez Juan Manuel': '0031',
        'Commegna Pablo': '0113',
        'Suarez Guido': '0015',
        'Lehner Ian': '0028',
        'Martin Santiago': '0022',
        'Castillo Pablo': '0192',
        'Sanchez Nicolas': '0141'
    };


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
        const instructor = document.getElementById('instructor').value;
        const direccion = document.getElementById('direccion').value;
        centroformacion = document.getElementById('centroformacion').value.trim();
        const registroTitulo= document.getElementById('registro-titulo').value;
        const registroInstructor = registros[instructor] || 'No disponible';
        const registroDireccion = registros[direccion] || 'No disponible';

        if (instructor === 'Seleccione Coordinacion, Evaluador o Comite de Imparcialidad:' || direccion === 'Seleccione Coordinacion, Evaluador o Comite de Imparcialidad:') {
            alert('No se ha seleccionado direccion o segundo cargo.');
            console.log(instructor);
            return;
        }

        if (!centroformacion && certificacion !== 'evaluador' && certificacion !== 'instructor') {
            alert('Todos los campos son Obligatorios');
            return;
        } else if (centroformacion) {
            centroformacion = `Dictado en Centro de formacion ${centroformacion}`;
        }
        
        if (!nombre || !dni || !ingreso || !instructor || !direccion || !certificacion || !registroTitulo || !registroDireccion || !registroInstructor) {
            alert('Todos los campos son Obligatorios');
            return;
        }

        if (direccion === instructor) {
            alert('La misma persona no puede ocupar los dos cargos.')
            return;
        }



        const yearsToAdd = (certificacion === 'TSA') ? 1 : 2;
        const expirationDate = addYearsToDate(fecha, yearsToAdd);
        const formattedExpirationDate = formatDate(expirationDate);

        const pdfBytes = await generateCustomCertificate(url, nombre, dniFormateado, formattedIngreso, instructor, direccion, centroformacion, formattedExpirationDate, certificacion, registroTitulo, registroInstructor, registroDireccion);

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
        const registroInstructor = registros[instructor] || 'No disponible';
        const registroDireccion = registros[direccion] || 'No disponible';

        if (!nombre || !cuit || !ingreso || !instructor || !direccion || !calle || !ciudad || !provincia || !registroDireccion || !registroInstructor) {
            alert('Todos los campos son Obligatorios');
        }
        const expirationDate = addYearsToDate(ingreso, 1);
        const formattedExpirationDate = formatDate(expirationDate);

        const pdfBytes = await generarCFCertificado(url, nombre, cuit, formattedIngreso, instructor, direccion, calle, ciudad, provincia, formattedExpirationDate, 'CF', registroInstructor, registroDireccion);

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
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            let contador = 0;
            const totalRows = jsonData.length;
            const zip = new JSZip();

            progressContainer.style.display = 'block';

            for (const row of jsonData) {
                const requiredFields = ["Certificacion", "Nombre","Apellido", "DNI", "Numero Registro", "Fecha Emision", "Direccion", "Segundo Cargo", "Centro de formacion"];

                for (const field of requiredFields) {
                    if (!row[field]) {
                        alert(`Faltan campos en la fila: ${JSON.stringify(row)}.`);
                        return;
                    }
                }

                if (row.DNI) {
                    row.DNI = formatearDNIExcel(row.DNI);
                }

                if (typeof row['Fecha Emision'] === 'number') {
                    const jsDate = excelDateToJSDate(row['Fecha Emision']);
                    row['Fecha Emision'] = formatDate(jsDate);
                }

                if (row.Certificacion) {
                    const certificacionLower = row.Certificacion.toLowerCase();
                    
                    if (certificacionLower === "evaluador" || certificacionLower === "instructor") {
                        row.Certificacion = certificacionLower;
                    }
            
                    else if (["apc1", "tsa", "apc2", "apc3", "rtc1", "rtc2"].includes(certificacionLower)) {
                        row.Certificacion = row.Certificacion.toUpperCase();
                    }

                    const segundoCargo = row['Segundo Cargo'].trim();
                    const direccion = row['Direccion'].trim();

                    if (segundoCargo === 'Sanchez Nicolas' && certificacionLower !== 'evaluador') {
                        alert(`"Sanchez Nicolas" solo puede estar en "Segundo Cargo" si la certificación es "evaluador". Se han generado todos los certificados hasta la fila ${contador + 2}`);
                        return;
                    }
    
                    if (segundoCargo === 'Castillo Pablo' && certificacionLower !== 'instructor') {
                        alert(`"Castillo Pablo" solo puede estar en "Segundo Cargo" si la certificación es "instructor". Se han generado todos los certificados hasta la fila ${contador + 2}`);
                        return;
                    }
                    if (direccion === 'Castillo Pablo') {
                        alert(`"Castillo Pablo" no puede estar en la columna "Direccion". Se han generado todos los certificados hasta la fila ${contador + 2}`);
                        return;
                    }
    
                    if (segundoCargo && !registros.hasOwnProperty(segundoCargo)) {
                        alert(`Error en la escritura del nombre en "Segundo Cargo": ${row['Segundo Cargo']} no está en los registros. Se han generado todos los certificados hasta la fila ${contador + 2}`);
                        console.log(row['Segundo Cargo']);
                        return;
                    }

                    if (direccion === segundoCargo) {
                        alert(`ERROR: hay una persona ejerciendo los dos cargos en un mismo certificado. Se han generado todos los certificados hasta la fila ${contador + 2}`)
                        return;
                    }
                }
                const pdfBytes = await generateCertificateFromRow(row);
                const fileName = `Certificado_${row.Nombre}_${row.Apellido}.pdf`;
                zip.file(fileName, pdfBytes, { binary: true });
                contador ++;

                const progress = Math.round((contador / totalRows) * 100);
                progressBar.style.setProperty('--value', progress);
                progressBar.setAttribute('aria-valuenow', progress);
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(zipBlob);
            link.download = 'Certificados.zip';
            link.click();

            progressBar.style.setProperty('--value', 100);
            progressBar.setAttribute('aria-valuenow', 100);
    
            
            setTimeout(() => {
                alert('¡Todos los certificados se han generado con éxito!');
                progressContainer.style.display = 'none';
            }, 500);
        };
        reader.readAsArrayBuffer(file);
    }

    async function generateCustomCertificate(url, nombre, dniFormateado, formattedIngreso, instructor, direccion, centroformacion, formattedExpirationDate, certificacion, registroTitulo, registroInstructor, registroDireccion) {
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

        //LADO DERECHO
        const coordenadasFirmasDireccion = {
            'RodriguezJuanManuel': { x: 650, y: 100, width: 100, height: 80 },
            'LehnerIan': { x: 650, y: 100, width: 100, height: 80 },
            'MarcosIsis': { x: 630, y: 100, width: 100, height: 80 },
            'SuarezGuido': { x: 650, y: 110, width: 100, height: 80 },
            'CommegnaPablo': { x: 650, y: 110, width: 100, height: 80 }
            // Añade más firmas aquí
        };
    
        //LADO IZQUIERDO
        const coordenadasFirmasInstructor = {
            'RodriguezJuanManuel': { x: 100, y: 100, width: 100, height: 80 },
            'SanchezNicolas': { x: 100, y: 110, width: 100, height: 80 },
            'LehnerIan': { x: 100, y: 100, width: 100, height: 80 },
            'MarcosIsis': { x: 100, y: 100, width: 100, height: 80 },
            'SuarezGuido': { x: 100, y: 110, width: 100, height: 80 },
            'CastilloPablo': { x: 95, y: 110, width: 100, height: 80 },
            'CommegnaPablo': { x: 100, y: 110, width: 100, height: 80 }
            // Añade más firmas aquí
        };
        

        const instructorFirmaImage = await embedImage(pdfDoc, instructor, 'jpeg') || await embedImage(pdfDoc, instructor, 'jpg');
        const direccionFirmaImage = await embedImage(pdfDoc, direccion, 'jpeg') || await embedImage(pdfDoc, direccion, 'jpg');

        const fontSizeNombre = 40;
        const textWidthNombre = helveticaBoldFont.widthOfTextAtSize(nombre, fontSizeNombre);
        const xCenteredNombre = (width - textWidthNombre) / 2;

        const fontSizeCF = 13.5;
        const textWidthCF = helveticaFont.widthOfTextAtSize(centroformacion, fontSizeCF);
        const xCenteredCF = (width - textWidthCF) / 2;

        fecha = `Registro de formacion profesional AATVAC Reg. Nº: ${registroTitulo} - Fecha emision: ${formattedIngreso} - Expira: ${formattedExpirationDate}`;

        const fontSizeFecha = 14;
        const textWidthFecha = helveticaBoldFont.widthOfTextAtSize(fecha, fontSizeFecha);
        const xCenteredFecha = (width - textWidthFecha) / 2;

        textoDireccion = `Reg. N° ${registroDireccion} - Dirección`;

        if (certificacion === 'TSA') {
            textoInstructor = `Reg. N° ${registroInstructor} - Coordinacion`;
        } else if (certificacion === 'evaluador') {
            textoInstructor = `Reg. N° ${registroInstructor} - Comite de imparcialidad`;
        } else {
            textoInstructor = `Reg. N° ${registroInstructor} - Evaluador`;
        }

        if (certificacion === 'RTC1') {
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

        if (certificacion === 'RTC1') {
            firstPage.drawText(`DNI: ${dniFormateado}`, {
                x: 360,
                y: 319,
                size: 17,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        } else {
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
            if (certificacion === 'APC1') {
                firstPage.drawText(centroformacion, {
                    x: xCenteredCF,
                    y: 272,
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
            } else if (certificacion === 'APC2') {
                firstPage.drawText(centroformacion, {
                    x: xCenteredCF,
                    y: 274.5,
                    size: fontSizeCF,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });
            } else if (certificacion === 'APC3') {
                firstPage.drawText(centroformacion, {
                    x: xCenteredCF,
                    y: 273,
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

        // Intercambiar las imágenes de las firmas
        if (instructorFirmaImage) {
            const nombreInstructor = instructor.replace(/ /g, '');
            const coordenadasDireccion = coordenadasFirmasDireccion[nombreInstructor] || { x: 650, y: 120, width: 100, height: 80 };
            firstPage.drawImage(instructorFirmaImage, coordenadasDireccion);
        }

        if (direccionFirmaImage) {
            const nombreDireccion = direccion.replace(/ /g, '');
            const coordenadasInstructor = coordenadasFirmasInstructor[nombreDireccion] || { x: 100, y: 120, width: 100, height: 80 };
            firstPage.drawImage(direccionFirmaImage, coordenadasInstructor);
        }

        if (instructor === direccion && instructorFirmaImage) {
            const coordenadasDireccion = coordenadasFirmasDireccion[instructor.replace(/ /g, '')] || { x: 650, y: 120, width: 100, height: 80 };
            firstPage.drawImage(instructorFirmaImage, coordenadasDireccion);
        }

        const fixedPositionXLeft = 100; // Posición fija para la columna izquierda
        const fixedPositionXRight = 650; // Posición fija para la columna derecha
        const baseYPosition = 100; // Posición base Y

        // Añadir texto alineado para el instructor
        if (direccion) {
            if (direccion === 'Rodriguez Juan Manuel') {
                firstPage.drawText(direccion, {
                    x: fixedPositionXLeft, // Coordenadas específicas para este nombre
                    y: baseYPosition,
                    size: 9,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });
            } else if (direccion === 'Commegna Pablo') {
                firstPage.drawText(direccion, {
                    x: fixedPositionXLeft + 10,
                    y: baseYPosition,
                    size: 9,
                    font: helveticaBoldObliqueFont,
                    color: rgb(0, 0, 0),
                });
            } else if (direccion === 'Martin Santiago') {
                firstPage.drawText(direccion, {
                    x: fixedPositionXLeft + 16,
                    y: baseYPosition,
                    size: 9,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });
            }else if (direccion === 'Suarez Guido') {
                firstPage.drawText(direccion, {
                    x: fixedPositionXLeft + 12,
                    y: baseYPosition,
                    size: 9,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });
            } else {
                firstPage.drawText(direccion, {
                    x: fixedPositionXLeft + 25,
                    y: baseYPosition,
                    size: 9,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });
            }
        }

        firstPage.drawText(textoDireccion, {
            x: fixedPositionXLeft - 7, // Coordenadas específicas para este nombre
            y: baseYPosition - 12,
            size: 10,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
        });

        // Añadir texto alineado para la dirección
        if (instructor) {
            if (instructor === 'Rodriguez Juan Manuel') {
                firstPage.drawText(instructor, {
                    x: fixedPositionXRight, // Coordenadas específicas para este nombre
                    y: baseYPosition,
                    size: 9,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });
            } else {
                firstPage.drawText(instructor, {
                    x: fixedPositionXRight + 15,
                    y: baseYPosition,
                    size: 9,
                    font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                    color: rgb(0, 0, 0),
                });
            }
        }

        if (certificacion === 'TSA') {
            if (instructor === 'Marcos Isis' || instructor === 'Lehner Ian') {
                firstPage.drawText(textoInstructor, {
                    x: fixedPositionXRight - 24,
                    y: baseYPosition - 12,
                    size: 10,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                })
            } else if (instructor === 'Suarez Guido') {
                firstPage.drawText(textoInstructor, {
                    x: fixedPositionXRight - 21,
                    y: baseYPosition - 12,
                    size: 10,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                })
            }else {
                firstPage.drawText(textoInstructor, {
                    x: fixedPositionXRight - 14,
                    y: baseYPosition - 12,
                    size: 10,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                })
            };
        } else if (certificacion === 'evaluador') {
            if (instructor === 'Suarez Guido') {
                firstPage.drawText(textoInstructor, {
                    x: fixedPositionXRight - 47,
                    y: baseYPosition - 12,
                    size: 10,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                })
            } else {
            firstPage.drawText(textoInstructor, {
                x: fixedPositionXRight - 43,
                y: baseYPosition - 12,
                size: 10,
                font: helveticaBoldFont,
                color: rgb(0, 0, 0),
            })
        };
        } else {
            if (instructor === 'Marcos Isis' || instructor === 'Lehner Ian') {
                firstPage.drawText(textoInstructor, {
                    x: fixedPositionXRight - 16,
                    y: baseYPosition - 12,
                    size: 10,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                })
            } else if (instructor === 'Suarez Guido') {
                firstPage.drawText(textoInstructor, {
                    x: fixedPositionXRight - 13,
                    y: baseYPosition - 12,
                    size: 10,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                })
            } else {
                firstPage.drawText(textoInstructor, {
                    x: fixedPositionXRight - 6,
                    y: baseYPosition - 12,
                    size: 10,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
            });
        }
        }

        // Añadir firmas y nombres en la segunda página (analítico)
        const secondPageWidth = secondPage.getSize().width;
        const secondPageHeight = secondPage.getSize().height;
        
        // Ajusta las posiciones y tamaños según el diseño del analítico
        const signatureYPosition = secondPageHeight - 150; // Ajusta según sea necesario
        const signatureSize = { width: 100, height: 80 };
        
        //LADO IZQUIERDO
        // Coordenadas para APC3, evaluador, instructor, TSA
        const coordenadasFirmasInstructorSegundaPaginaGrupo1 = {
            'RodriguezJuanManuel': { x: 100, y: 90, width: 100, height: 80 },
            'CommegnaPablo': { x: 100, y: 100, width: 100, height: 80 },
            'SuarezGuido': { x: 100, y: 100, width: 100, height: 80 },
            'CastilloPablo': { x: 100, y: 100, width: 100, height: 80 },
            'MarcosIsis': { x: 90, y: 100, width: 100, height: 80 },
            'LehnerIan': { x: 100, y: 100, width: 100, height: 80 },
            'SanchezNicolas': { x: 100, y: 100, width: 100, height: 80 },
            'MartinSantiago': { x: 100, y: 100, width: 100, height: 80 },
            // Añade más firmas aquí
        };

        //LADO DERECHO
        const coordenadasFirmasDireccionSegundaPaginaGrupo1 = {
            'RodriguezJuanManuel': { x: 640, y: 90, width: 100, height: 80 },
            'CommegnaPablo': { x: 620, y: 100, width: 100, height: 80 },
            'SuarezGuido': { x: 650, y: 100, width: 100, height: 80 },
            'CastilloPablo': { x: 625, y: 100, width: 100, height: 80 },
            'MarcosIsis': { x: 640, y: 100, width: 100, height: 80 },
            'LehnerIan': { x: 650, y: 100, width: 100, height: 80 },
            'SanchezNicolas': { x: 650, y: 100, width: 100, height: 80 },
            'MartinSantiago': { x: 630, y: 100, width: 100, height: 80 },
            // Añade más firmas aquí
        };

        //LADO IZQUIERDO
        // Coordenadas para APC1, APC2, RTC1, RTC2, evaluador, instructor
        const coordenadasFirmasInstructorSegundaPaginaGrupo2 = {
            'RodriguezJuanManuel': { x: 95, y: 85, width: 100, height: 48 },
            'CommegnaPablo': { x: 90, y: 90, width: 90, height: 38 },
            'SuarezGuido': { x: 100, y: 90, width: 90, height: 38 },
            'CastilloPablo': { x: 100, y: 90, width: 90, height: 38 },
            'MarcosIsis': { x: 90, y: 90, width: 90, height: 38 },
            'LehnerIan': { x: 95, y: 85, width: 100, height: 48 },
            'SanchezNicolas': { x: 100, y: 90, width: 90, height: 38 },
            'MartinSantiago': { x: 100, y: 90, width: 90, height: 38 },
            // Añade más firmas aquí
        };
        //LADO DERECHO
        const coordenadasFirmasDireccionSegundaPaginaGrupo2 = {
            'RodriguezJuanManuel': { x: 640, y: 80, width: 100, height: 48 },
            'CommegnaPablo': { x: 625, y: 90, width: 90, height: 38 },
            'SuarezGuido': { x: 635, y: 90, width: 90, height: 38 },
            'CastilloPablo': { x: 625, y: 90, width: 90, height: 38 },
            'MarcosIsis': { x: 620, y: 90, width: 90, height: 38 },
            'LehnerIan': { x: 635, y: 85, width: 100, height: 48 },
            'SanchezNicolas': { x: 640, y: 90, width: 90, height: 38 },
            'MartinSantiago': { x: 635, y: 90, width: 90, height: 38 },
            // Añade más firmas aquí
        };

        // Función para obtener las coordenadas según el grupo de certificación
        function obtenerCoordenadas(nombre, grupo) {
            const nombreSinEspacios = nombre.replace(/ /g, '');
            return grupo[nombreSinEspacios] || { x: 100, y: 100, width: 100, height: 80 };
        }

        if (certificacion === 'APC3' || certificacion === 'evaluador' || certificacion === 'instructor' || certificacion === 'TSA') {
            // Intercambiar las imágenes de las firmas
            if (instructorFirmaImage) {
                const coordenadasDireccion = obtenerCoordenadas(instructor, coordenadasFirmasDireccionSegundaPaginaGrupo1);
                secondPage.drawImage(instructorFirmaImage, coordenadasDireccion);
            }
            if (direccionFirmaImage) {
                const coordenadasInstructor = obtenerCoordenadas(direccion, coordenadasFirmasInstructorSegundaPaginaGrupo1);
                secondPage.drawImage(direccionFirmaImage, coordenadasInstructor);
            }
        } else {
            // Intercambiar las imágenes de las firmas
            if (instructorFirmaImage) {
                const coordenadasDireccion = obtenerCoordenadas(instructor, coordenadasFirmasDireccionSegundaPaginaGrupo2);
                secondPage.drawImage(instructorFirmaImage, coordenadasDireccion);
            }
            if (direccionFirmaImage) {
                const coordenadasInstructor = obtenerCoordenadas(direccion, coordenadasFirmasInstructorSegundaPaginaGrupo2);
                secondPage.drawImage(direccionFirmaImage, coordenadasInstructor);
            }
        }
        
        // Verificar si la firma del instructor y la dirección son la misma persona y dibujarla nuevamente si es necesario
        // if (instructor === direccion && instructorFirmaImage) {
        //     const coordenadasDireccion = obtenerCoordenadas(instructor, certificacion === 'APC3' || certificacion === 'evaluador' || certificacion === 'instructor' || certificacion === 'TSA' ? coordenadasFirmasDireccionSegundaPaginaGrupo1 : coordenadasFirmasDireccionSegundaPaginaGrupo2);
        //     secondPage.drawImage(instructorFirmaImage, coordenadasDireccion);
        // }
        

        if (certificacion === 'APC3') {
            // Segunda Pagina, LADO IZQUIERDO
            if (direccion) {
                if (direccion === 'Rodriguez Juan Manuel') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoDireccion, {
                        x: fixedPositionXLeft - 5, // Coordenadas específicas para este nombre
                        y: baseYPosition - 22,
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                    //COMEGNA LADO IZQUIERDO NOMBRE
                } else if (direccion === 'Commegna Pablo') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 10,
                        y: signatureYPosition -354,
                        size: 9,
                        font: helveticaBoldObliqueFont,
                        color: rgb(0, 0, 0),
                    });
                    //COMEGNA LADO IZQUIERDO  DIRECCION
                    secondPage.drawText(textoDireccion, {
                        x: fixedPositionXLeft - 10,
                        y: signatureYPosition -366,
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                    //Santiago LADO IZQUIERDO NOMBRE 
                } else if (direccion === 'Martin Santiago') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 10,
                        y: signatureYPosition -354,
                        size: 9,
                        font: helveticaBoldObliqueFont,
                        color: rgb(0, 0, 0),
                    });
                //Santiago LADO IZQUIERDO  DIRECCION
                    secondPage.drawText(textoDireccion, {
                        x: fixedPositionXLeft - 10,
                        y: signatureYPosition -366,
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }else {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 15,
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoDireccion, {
                        x: fixedPositionXLeft - 15,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }
            }
             
            // Añadir texto alineado para la dirección
            if (instructor) {
                //LADO DERECHO NOMBRE
                if (instructor === 'Rodriguez Juan Manuel') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight - 14, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                //LADO DERECHO TEXTO EVALUADOR
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 20,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                    //LADO DERECHO NOMBRE
                } else if (instructor === 'Commegna Pablo') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight - 10, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 28,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                } else if (instructor === 'Martin Santiago') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight - 10, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 33,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }else {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight + 15,
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 20,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }
            }
        }else if( certificacion === 'TSA'){
            // Segunda Pagina, LADO IZQUIERDO
            if (direccion) {
                if (direccion === 'Rodriguez Juan Manuel') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    // secondPage.drawText(textoDireccion, {
                    //     x: fixedPositionXLeft - 5, // Coordenadas específicas para este nombre
                    //     y: baseYPosition - 22,
                    //     size: 10,
                    //     font: helveticaBoldFont,
                    //     color: rgb(0, 0, 0),
                    // });
                    //COMEGNA LADO IZQUIERDO NOMBRE
                } else if (direccion === 'Commegna Pablo') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 10,
                        y: signatureYPosition -354,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                    //COMEGNA LADO IZQUIERDO  DIRECCION
                    // secondPage.drawText(textoDireccion, {
                    //     x: fixedPositionXLeft - 10,
                    //     y: signatureYPosition -366,
                    //     size: 10,
                    //     font: helveticaBoldFont,
                    //     color: rgb(0, 0, 0),
                    // });
                    //Santiago LADO IZQUIERDO NOMBRE 
                }else if (direccion === 'Suarez Guido') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 14,
                        y: signatureYPosition -354,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                }else if (direccion === 'Martin Santiago') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 10,
                        y: signatureYPosition -354,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                //Santiago LADO IZQUIERDO  DIRECCION
                    // secondPage.drawText(textoDireccion, {
                    //     x: fixedPositionXLeft - 10,
                    //     y: signatureYPosition -366,
                    //     size: 10,
                    //     font: helveticaBoldFont,
                    //     color: rgb(0, 0, 0),
                    // });
                } else {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 25,
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                }
            }

            secondPage.drawText(textoDireccion, {
                x: fixedPositionXLeft - 7,
                y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                size: 10,
                font: helveticaBoldFont,
                color: rgb(0, 0, 0),
            });
             
            // Añadir texto alineado para la dirección
            if (instructor) {
                //LADO DERECHO NOMBRE
                if (instructor === 'Rodriguez Juan Manuel') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight - 14, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                //LADO DERECHO TEXTO EVALUADOR
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 30,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                    //LADO DERECHO NOMBRE
                } else if (instructor === 'Commegna Pablo') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight - 10, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 35,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                } else if (instructor === 'Martin Santiago') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight - 10, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 37,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }else if (instructor === 'Suarez Guido') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight + 12, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 20,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }else {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight + 15,
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 28,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }
            }
        }
        else if(certificacion === 'instructor'){
            if (direccion) {
                if (direccion === 'Rodriguez Juan Manuel') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoDireccion, {
                        x: fixedPositionXLeft - 5, // Coordenadas específicas para este nombre
                        y: baseYPosition - 22,
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                    //COMEGNA LADO IZQUIERDO NOMBRE
                } else if (direccion === 'Commegna Pablo') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 10,
                        y: signatureYPosition -354,
                        size: 9,
                        font: helveticaBoldObliqueFont,
                        color: rgb(0, 0, 0),
                    });
                    //COMEGNA LADO IZQUIERDO  DIRECCION
                    secondPage.drawText(textoDireccion, {
                        x: fixedPositionXLeft - 10,
                        y: signatureYPosition -366,
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                    //Santiago LADO IZQUIERDO NOMBRE 
                } else if (direccion === 'Martin Santiago') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 10,
                        y: signatureYPosition -354,
                        size: 9,
                        font: helveticaBoldObliqueFont,
                        color: rgb(0, 0, 0),
                    });
                //Santiago LADO IZQUIERDO  DIRECCION
                    secondPage.drawText(textoDireccion, {
                        x: fixedPositionXLeft - 10,
                        y: signatureYPosition -366,
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }else {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 15,
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoDireccion, {
                        x: fixedPositionXLeft - 15,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }
            }


            // Añadir texto alineado para la dirección
            if (instructor) {
                //LADO DERECHO NOMBRE
                if (instructor === 'Rodriguez Juan Manuel') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight - 14, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                //LADO DERECHO TEXTO EVALUADOR
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 30,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,   
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                    //LADO DERECHO NOMBRE
                } else if (instructor === 'Commegna Pablo') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight - 10, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 37,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                } else if (instructor === 'Martin Santiago') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight - 10, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 30,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }else {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight ,
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 28,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }
            }

        }else if(certificacion === 'evaluador' ){
            if (direccion) {
                if (direccion === 'Rodriguez Juan Manuel') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoDireccion, {
                        x: fixedPositionXLeft - 5, // Coordenadas específicas para este nombre
                        y: baseYPosition - 22,
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                    //COMEGNA LADO IZQUIERDO NOMBRE
                } else if (direccion === 'Commegna Pablo') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 10,
                        y: signatureYPosition -354,
                        size: 9,
                        font: helveticaBoldObliqueFont,
                        color: rgb(0, 0, 0),
                    });
                    //COMEGNA LADO IZQUIERDO  DIRECCION
                    secondPage.drawText(textoDireccion, {
                        x: fixedPositionXLeft - 10,
                        y: signatureYPosition -366,
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                    //Santiago LADO IZQUIERDO NOMBRE 
                } else if (direccion === 'Martin Santiago') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 10,
                        y: signatureYPosition -354,
                        size: 9,
                        font: helveticaBoldObliqueFont,
                        color: rgb(0, 0, 0),
                    });
                //Santiago LADO IZQUIERDO  DIRECCION
                    secondPage.drawText(textoDireccion, {
                        x: fixedPositionXLeft - 10,
                        y: signatureYPosition -366,
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }else {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 15,
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoDireccion, {
                        x: fixedPositionXLeft - 15,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }
            }


            // Añadir texto alineado para la dirección
            if (instructor) {
                //LADO DERECHO NOMBRE
                if (instructor === 'Rodriguez Juan Manuel') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight -15, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                //LADO DERECHO TEXTO EVALUADOR
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 50,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,   
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                    //LADO DERECHO NOMBRE
                } else if (instructor === 'Commegna Pablo') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight - 10, // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 57,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }else if (instructor === 'Marcos Isis') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight +15  , // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 47,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }else if (instructor === 'Lehner Ian') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight +15  , // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 47,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    }); 
                }else if (instructor === 'Martin Santiago') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight -5  , // Coordenadas específicas para este nombre
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 56,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    }); 
                }else {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight ,
                        y: baseYPosition - 10,
                        size: 9,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 50,
                        y: baseYPosition - 22, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }
            }
        }
        else {
            // Aquí puedes agregar la lógica para los demás certificados
            if (direccion) {
                if (direccion === 'Rodriguez Juan Manuel') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft , // Coordenadas específicas para este nombre
                        y: baseYPosition - 28,
                        size: 7,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                } else if (direccion === 'Commegna Pablo') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 10,
                        y: signatureYPosition - 372,
                        size: 7,
                        font: helveticaBoldObliqueFont,
                        color: rgb(0, 0, 0),
                    });
                } else if (direccion === 'Martin Santiago') {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 12,
                        y: baseYPosition - 28,
                        size: 7,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                } else {
                    secondPage.drawText(direccion, {
                        x: fixedPositionXLeft + 15,
                        y: baseYPosition - 28,
                        size: 7,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                }
            }
                secondPage.drawText(textoDireccion, {
                    x: fixedPositionXLeft - 7, // Coordenadas específicas para este nombre
                    y: baseYPosition - 38,
                    size: 8,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                });
        
            if (instructor) {
                if (instructor === 'Rodriguez Juan Manuel') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight - 5, // Coordenadas específicas para este nombre
                        y: baseYPosition - 28,
                        size: 7,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 10,
                        y: baseYPosition - 38, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 8,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                } else if (instructor === 'Commegna Pablo') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight - 8, // Coordenadas específicas para este nombre
                        y: baseYPosition - 28,
                        size: 7,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 23,
                        y: baseYPosition - 38, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 8,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }else if (instructor === 'Marcos Isis') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight , // Coordenadas específicas para este nombre
                        y: baseYPosition - 28,
                        size: 7,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 23,
                        y: baseYPosition - 38, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 8,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }else if (instructor === 'Suarez Guido') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight, // Coordenadas específicas para este nombre
                        y: baseYPosition - 28,
                        size: 7,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 23,
                        y: baseYPosition - 38, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 8,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }else if (instructor === 'Martin Santiago') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight - 3, // Coordenadas específicas para este nombre
                        y: baseYPosition - 28,
                        size: 7,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 23,
                        y: baseYPosition - 38, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 8,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    }); 
                }else if (instructor === 'Lehner Ian') {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight + 10, // Coordenadas específicas para este nombre
                        y: baseYPosition - 28,
                        size: 7,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight -12,
                        y: baseYPosition - 38, // Ajusta la posición 'y' para colocar el texto debajo del nombre
                        size: 8,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    }); 
                }else {
                    secondPage.drawText(instructor, {
                        x: fixedPositionXRight + 10,
                        y: baseYPosition - 28,
                        size: 7,
                        font: helveticaBoldObliqueFont, // Usa la fuente en negrita y cursiva
                        color: rgb(0, 0, 0),
                    });
                
                    secondPage.drawText(textoInstructor, {
                        x: fixedPositionXRight - 7,
                        y: baseYPosition - 38,
                        size: 8,
                        font: helveticaBoldFont,
                        color: rgb(0, 0, 0),
                    });
                }
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
        const helveticaBoldObliqueFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBoldOblique);

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

        textoDireccion = `Reg. N° ${registroDireccion} - Direccion`;
        textoInspeccion = `Reg. N° ${registroInstructor} - Inspeccion`;

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

        if (direccionFirmaImage) {
            firstPage.drawImage(direccionFirmaImage, {
                x: 220,
                y: 200,
                width: 180,
                height: 140,
            });
        }
        
        if (instructorFirmaImage) {
            firstPage.drawImage(instructorFirmaImage, {
                x: 1180,
                y: 200,
                width: 180,
                height: 140,
            });
        }

        const fixedPositionXLeft = 220; // Posición fija para la columna izquierda
        const fixedPositionXRight = 1180; // Posición fija para la columna derecha
        const baseYPosition = 180; // Posición base Y

        if (direccion) {
            if (direccion === 'Rodriguez Juan Manuel') {
                firstPage.drawText(direccion, {
                    x: fixedPositionXLeft - 20,
                    y: baseYPosition,
                    size: 19,
                    font: helveticaBoldObliqueFont,
                    color: rgb(0, 0, 0),
                });
            
                firstPage.drawText(textoDireccion, {
                    x: fixedPositionXLeft - 25,
                    y: baseYPosition - 22,
                    size: 20,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                });
            } else if (direccion === 'Commegna Pablo') {
                firstPage.drawText(direccion, {
                    x: fixedPositionXLeft + 10,
                    y: baseYPosition,
                    size: 19,
                    font: helveticaBoldObliqueFont,
                    color: rgb(0, 0, 0),
                });
                firstPage.drawText(textoDireccion, {
                    x: fixedPositionXLeft - 16,
                    y: baseYPosition - 22,
                    size: 20,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                });
            } else {
                firstPage.drawText(direccion, {
                    x: fixedPositionXLeft + 15,
                    y: baseYPosition,
                    size: 19,
                    font: helveticaBoldObliqueFont,
                    color: rgb(0, 0, 0),
                });
            
                firstPage.drawText(textoDireccion, {
                    x: fixedPositionXLeft - 35,
                    y: baseYPosition - 22,
                    size: 20,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                });
            }
        }

        if (instructor) {
            if (instructor === 'Rodriguez Juan Manuel') {
                firstPage.drawText(instructor, {
                    x: fixedPositionXRight - 20,
                    y: baseYPosition,
                    size: 19,
                    font: helveticaBoldObliqueFont,
                    color: rgb(0, 0, 0),
                });
            
                firstPage.drawText(textoInspeccion, {
                    x: fixedPositionXRight - 25,
                    y: baseYPosition - 22,
                    size: 20,
                    font: helveticaBoldFont,
                    color: rgb(0, 0, 0),
                });
            } else {
                firstPage.drawText(instructor, {
                    x: fixedPositionXRight + 15,
                    y: baseYPosition,
                    size: 19,
                    font: helveticaBoldObliqueFont,
                    color: rgb(0, 0, 0),
                });
            
                firstPage.drawText(textoInspeccion, {
                    x: fixedPositionXRight - 25,
                    y: baseYPosition - 22,
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
        console.log(ingreso);
        let instructor = row['Segundo Cargo'].trim();
        if (certificacion === 'instructor') {
            instructor = 'Castillo Pablo';
        }
        const direccion = row['Direccion'].trim();
        const centroformacion = `dictado en centro de formacion ${row['Centro de formacion']}`;
        const registroTitulo = row['Numero Registro'];
        const registroInstructor = registros[instructor] || 'No disponible';
        const registroDireccion = registros[direccion] || 'No disponible';

        const yearsToAdd = (certificacion === 'TSA') ? 1 : 2;
        const expirationDate = addYearsToDateExcel(ingreso, yearsToAdd);
        const formattedExpirationDate = formatDate(expirationDate);

        const pdfBytes = await generateCustomCertificate(url, nombre, dni, ingreso, instructor, direccion, centroformacion, formattedExpirationDate, certificacion, registroTitulo, registroInstructor, registroDireccion);

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