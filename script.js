document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('cursanteForm');
    form.addEventListener('submit', handleFormSubmit);

    async function handleFormSubmit(event) {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const fileInput = document.getElementById('pdfFile');
        const file = fileInput.files[0];

        if (!file) {
            alert('Por favor, selecciona un archivo PDF.');
            return;
        }

        const arrayBuffer = await file.arrayBuffer();

        // Usar PDF.js para extraer el contenido del PDF
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();

        let text = '';
        textContent.items.forEach(item => {
            text += item.str + ' ';
        });

        const textToReplace = 'Marketing Digital'; // Nombre actual en el PDF de prueba
        const newText = text.replace(textToReplace, "Tecnico operador de cuerdas");

        let textItems = [];
        textContent.items.forEach(item => {
            if (item.str.includes('Juliana Silva')) {
                textItems.push(item);
            }
        });

        // Modificar el PDF usando PDF-LIB
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        textItems.forEach(item => {
            // Eliminar el texto original cubriéndolo con un rectángulo blanco
            firstPage.drawRectangle({
                x: item.transform[4],
                y: item.transform[5] - 12, // Ajusta según la posición del texto
                width: 300, // Ajusta según el ancho del texto
                height: 20, // Ajusta según la altura del texto
                color: PDFLib.rgb(1, 1, 1),
            });

            // Calcular la posición X centrada para el nuevo texto
            const textWidth = helveticaFont.widthOfTextAtSize(nombre, 50); // Tamaño 50 ajustable
            const xCentered = (width - textWidth) / 2;

            // Dibujar el nuevo texto centrado en el PDF
            firstPage.drawText(nombre, {
                x: xCentered,
                y: item.transform[5], // Ajusta según la posición del texto original
                size: 50, // Ajusta según el tamaño del texto original
                font: helveticaFont,
                color: PDFLib.rgb(0.1, 0.1, 0.95), // Ajusta según el color del texto original
            });
        });

        const modifiedPdfBytes = await pdfDoc.save();

        // Descargar el PDF modificado
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `Certificado-${nombre}.pdf`; // Nombre del archivo con el nombre del formulario
        link.click();
    }
});