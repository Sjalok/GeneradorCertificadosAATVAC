const generateButton = document.getElementById('generar');
const cursosSelect = document.getElementById('cursos');
const ingresoInput = document.getElementById('ingreso');
const salidaInput = document.getElementById('salida');
const cursoInput = document.getElementById('curso'); // Asegúrate de que este ID esté en tu HTML
const fechaModal = document.getElementById('fechaModal');
const closeModal = document.getElementsByClassName('close')[0];
const guardarFechasButton = document.getElementById('guardarFechas');
const modalIngresoInput = document.getElementById('modalIngreso');
const modalSalidaInput = document.getElementById('modalSalida');
const cursoSeleccionadoText = document.getElementById('cursoSeleccionado');
const actualizarFechasButton = document.getElementById('actualizarFechas');



let fechas = JSON.parse(localStorage.getItem('fechas')) || {};

cursosSelect.addEventListener('change', function() {
    const selectedCourse = cursosSelect.value;
    cursoInput.value = selectedCourse; // Actualiza el input "curso" con el valor seleccionado

    if (fechas[selectedCourse]) {
        ingresoInput.value = fechas[selectedCourse].ingreso;
        salidaInput.value = fechas[selectedCourse].salida;
    } else {
        cursoSeleccionadoText.textContent = selectedCourse;
        modalIngresoInput.value = '';
        modalSalidaInput.value = '';
        fechaModal.style.display = 'block';
    }
});

closeModal.onclick = function() {
    fechaModal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target === fechaModal) {
        fechaModal.style.display = 'none';
    }
}

guardarFechasButton.addEventListener('click', function() {
    const selectedCourse = cursosSelect.value;
    const ingreso = modalIngresoInput.value;
    const salida = modalSalidaInput.value;
    if (ingreso && salida) {
        fechas[selectedCourse] = { ingreso, salida };
        localStorage.setItem('fechas', JSON.stringify(fechas));
        ingresoInput.value = ingreso;
        salidaInput.value = salida;
        fechaModal.style.display = 'none';
    } else {
        alert('Por favor, ingrese ambas fechas.');
    }
});

actualizarFechasButton.addEventListener('click', function(e) {
    e.preventDefault();
    const selectedCourse = cursosSelect.value;
    if (!selectedCourse) {
        alert('Por favor, seleccione un curso primero.');
        return;
    }

    cursoSeleccionadoText.textContent = selectedCourse;
    if (fechas[selectedCourse]) {
        modalIngresoInput.value = fechas[selectedCourse].ingreso;
        modalSalidaInput.value = fechas[selectedCourse].salida;
    } else {
        modalIngresoInput.value = '';
        modalSalidaInput.value = '';
    }
    fechaModal.style.display = 'block';
});