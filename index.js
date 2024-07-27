document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.querySelector('#formulario');
    const campoPassword = document.querySelector('#password');
    let intentos = 0;

    localStorage.setItem('autenticado', 'false');

    formulario.addEventListener('submit', (e) => {
        e.preventDefault();
        const contraseña = campoPassword.value;

        // Convierte la contraseña a número para la comparación
        const contraseñaCorrecta = '1234';

        if (contraseña === contraseñaCorrecta && intentos === 0) {
            alert('Contraseña incorrecta');
            intentos++;
            limpiarFormulario(formulario, campoPassword);
        } else if (contraseña === contraseñaCorrecta && intentos === 1) {
            localStorage.setItem('autenticado', 'true');
            window.location.href = 'formulario.html';
        } else {
            alert('Contraseña incorrecta');
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