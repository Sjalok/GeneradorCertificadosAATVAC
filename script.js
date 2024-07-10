document.addEventListener('DOMContentLoaded', async function () {
    const generateButton = document.getElementById('generar');
    generateButton.addEventListener('click', handleGenerateCertificate);

    async function handleGenerateCertificate(event) {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const curso = document.getElementById('curso').value;
        const ingreso = document.getElementById('ingreso').value;
        const salida = document.getElementById('salida').value;
        const instructor = document.getElementById('instructor').value;
        const direccion = document.getElementById('direccion').value;
        const centroformacion = document.getElementById('centroformacion').value;

        if (!nombre || !curso || !ingreso || !salida || !instructor || !direccion || !centroformacion) {
            alert('Todos los campos son Obligatorios');
            return;
        }

        // Lógica para generar el certificado PDF utilizando los datos del formulario
        const pdfBytes = await generateCustomCertificate(nombre, curso, ingreso, salida, instructor, direccion, centroformacion);

        // Descargar el certificado generado
        if (pdfBytes) {
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Certificado-${nombre}.pdf`;
            link.click();
        }
    }

    async function generateCustomCertificate(nombre, curso, ingreso, salida, instructor, direccion, centroformacion) {
        // Usar fetch para obtener el archivo PDF base
        const response = await fetch('certificadoprueba.pdf'); // Reemplaza 'pdfestandar.pdf' con tu archivo base
        const arrayBuffer = await response.arrayBuffer();

        // Usar PDF-LIB para modificar el PDF base
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

        // Importar y registrar fontkit
        const fontkit = await import('fontkit');
        pdfDoc.registerFontkit(fontkit);

        // Cargar las fuentes personalizadas
        const arialBlackBytes = await fetch('fonts/arial-black.ttf').then(res => res.arrayBuffer());
        const arialBytes = await fetch('fonts/arial.ttf').then(res => res.arrayBuffer());
        const calibriBytes = await fetch('fonts/calibri.ttf').then(res => res.arrayBuffer());
        const verdanaBytes = await fetch('fonts/verdana.ttf').then(res => res.arrayBuffer());
        const lucidaSansUnicodeBytes = await fetch('fonts/lucida-sans-unicode.ttf').then(res => res.arrayBuffer());

        // Embed the fonts
        const arialBlackFont = await pdfDoc.embedFont(arialBlackBytes);
        const arialFont = await pdfDoc.embedFont(arialBytes);
        const calibriFont = await pdfDoc.embedFont(calibriBytes);
        const verdanaFont = await pdfDoc.embedFont(verdanaBytes);
        const lucidaSansUnicodeFont = await pdfDoc.embedFont(lucidaSansUnicodeBytes);

        // Modificar el PDF según los datos del formulario
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Ejemplo de modificación (ajustar según tu necesidad)
        firstPage.drawText(nombre, {
            x: 50,
            y: 550,
            size: 20,
            font: arialFont,
            color: PDFLib.rgb(0, 0, 0),
        });

        firstPage.drawText(curso, {
            x: 50,
            y: 520,
            size: 18,
            font: calibriFont,
            color: PDFLib.rgb(0, 0, 0),
        });

        firstPage.drawText(ingreso, {
            x: 50,
            y: 490,
            size: 18,
            font: verdanaFont,
            color: PDFLib.rgb(0, 0, 0),
        });

        firstPage.drawText(salida, {
            x: 50,
            y: 460,
            size: 18,
            font: arialFont,
            color: PDFLib.rgb(0, 0, 0),
        });

        firstPage.drawText(instructor, {
            x: 50,
            y: 430,
            size: 18,
            font: lucidaSansUnicodeFont,
            color: PDFLib.rgb(0, 0, 0),
        });

        firstPage.drawText(direccion, {
            x: 50,
            y: 400,
            size: 18,
            font: arialBlackFont,
            color: PDFLib.rgb(0, 0, 0),
        });

        firstPage.drawText(centroformacion, {
            x: 50,
            y: 370,
            size: 18,
            font: arialFont,
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