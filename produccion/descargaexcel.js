document.getElementById('descargarexcel').addEventListener('click', function () {
    const link = document.createElement('a');
    link.href = './plantillavacia.xlsx';
    link.download = 'plantillavacia.xlsx';
    link.click();
});