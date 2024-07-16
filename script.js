document.addEventListener('DOMContentLoaded', async function () {
    const generateButton = document.getElementById('generar');
    generateButton.addEventListener('click', handleGenerateCertificate);

    async function handleGenerateCertificate(event) {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const dni = document.getElementById('dni').value;
        const curso = document.getElementById('curso').value;
        const ingreso = document.getElementById('ingreso').value;
        const salida = document.getElementById('salida').value;
        const instructor = document.getElementById('instructor').value;
        const direccion = document.getElementById('direccion').value;
        const centroformacion = document.getElementById('centroformacion').value;
        const dni = document.getElementById('dni').value;
        const nivelOperario = document.getElementById('nivelOperario').value;

        if (!nombre || !dni || !curso || !ingreso || !salida || !instructor || !direccion || !centroformacion) {
            alert('Todos los campos son Obligatorios');
            return;
        }

<<<<<<< HEAD

        //Lógica para generar el certificado PDF utilizando los datos del formulario
        const pdfBytes = await generateCustomCertificate(nombre, curso, ingreso, salida, instructor, direccion, centroformacion,dni, nivelOperario);
=======
        // Lógica para generar el certificado PDF utilizando los datos del formulario
        const pdfBytes = await generateCustomCertificate(nombre, dni, curso, ingreso, salida, instructor, direccion, centroformacion);
>>>>>>> 82f1b52c3bc27736e3cdef51a4a7ce5660cdd041

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
    async function generateCustomCertificate(nombre, curso, ingreso, salida, instructor, direccion, centroformacion,dni, nivelOperario) {
=======
    async function generateCustomCertificate(nombre, dni, curso, ingreso, salida, instructor, direccion, centroformacion) {
>>>>>>> 82f1b52c3bc27736e3cdef51a4a7ce5660cdd041
        // Usar fetch para obtener el archivo PDF base
        const response = await fetch('certificadoprueba.pdf'); // Reemplaza 'certificadoprueba.pdf' con tu archivo base
        const arrayBuffer = await response.arrayBuffer();

        // Usar PDF-LIB para modificar el PDF base
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

        // Cargar las fuentes estándar de PDF-LIB
        const [helveticaBoldFont, helveticaFont, timesRomanFont, helveticaItalicFont] = await Promise.all([
            pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold),
            pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica),
            pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman),
            pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBoldOblique),
        ]);

        // Modificar el PDF según los datos del formulario
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();



        // Ejemplo de modificación (ajustar según tu necesidad)
        firstPage.drawText(nombre, {
            x: 150,
            y: 350,
            size: 40,
            font: helveticaBoldFont,
            color: PDFLib.rgb(0, 0, 0),
        });

        firstPage.drawText("DNI: " + dni, {
            x: 50,
            y: 500,
            size: 20,
            font: helveticaFont,
            color: PDFLib.rgb(0, 0, 0),
        });

        firstPage.drawText(curso, {
            x: 130,
            y: 430,
            size: 60,
            font: helveticaBoldFont,
            color: PDFLib.rgb(0, 0, 0),
        });

        const textoDni= `DNI: ${dni}` 
        firstPage.drawText(textoDni, {
            x: 370,
            y: 310,
            size: 17,
            font: helveticaFont,
            color: PDFLib.rgb(0, 0, 0),
        });

        const emision= `Acreditacion Profesional AATTVAC Reg. N°: 0450 - Fecha Emision: ${ingreso} - Expira: ${salida}`
        firstPage.drawText(emision, {
            x: 130,
            y: 200,
            size: 15,
            font: timesRomanFont,
            color: PDFLib.rgb(0, 0, 0),
        });

        const nivel= `Fue calificado como ${nivelOperario}: Profesional en Acceso por Cuerdas Industrial (40HS).`
        firstPage.drawText(nivel, {
            x: 140,
            y: 290,
            size: 13,
            font: helveticaFont,
            color: PDFLib.rgb(0, 0, 0),
        });

        const formacion= `Dictado en Centro de formacion AATTVAC, Pcia de ${centroformacion}, Argentina.`
        firstPage.drawText(formacion, {
            x: 200,
            y: 270,
            size: 13,
            font: helveticaBoldFont,
            color: PDFLib.rgb(0, 0, 0),
        });

        // Posición X deseada para que el texto termine en (por ejemplo, 50 píxeles desde la derecha)
        const desiredRightMargin = 100;
        // Calcular el ancho del texto
        const instructorTextWidth = helveticaBoldFont.widthOfTextAtSize(instructor, 10);
        // Calcular la posición X
        const instructorX = width - desiredRightMargin - instructorTextWidth;
        firstPage.drawText(instructor, {
            x: instructorX,
            y: 103,
            size: 10,
            font: helveticaItalicFont,
            color: PDFLib.rgb(0, 0, 0),
        });

        firstPage.drawText(direccion, {
            x: 140,
            y: 100,
            size: 10,
            font: helveticaItalicFont,
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