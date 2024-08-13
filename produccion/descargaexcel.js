document.getElementById('descargarexcel').addEventListener('click', function () {
    const link = document.createElement('a');
    link.href = './certificadoadescargar.xlsx';
    link.download = 'certificadoadescargar.xlsx';
    link.click();
});