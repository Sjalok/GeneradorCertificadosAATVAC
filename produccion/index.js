document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.querySelector('#formulario');
    const campoPassword = document.querySelector('#password');
    let intentos = 0;

    localStorage.setItem('autenticado', 'false');

    formulario.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = campoPassword.value;

        // Convierte la contraseña a número para la comparación
        const passwordCorrecto = '1234';

        if (password === passwordCorrecto && intentos === 0) {
            alert('Contraseña incorrecta');
            intentos++;
            limpiarFormulario(formulario, campoPassword);
        } else if (password === passwordCorrecto && intentos === 1) {
            localStorage.setItem('autenticado', 'true');
            window.location.href = 'formulario.html';
        } else {
            alert('password incorrecto');
            intentos = 0;
            limpiarFormulario(formulario, campoPassword);
        }
    });
});

function limpiarFormulario(formulario, campoPassword) {
    formulario.reset();
    campoPassword.value = '';
    campoPassword.focus();
}