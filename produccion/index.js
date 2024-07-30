document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.querySelector('#formulario');
    const campoPassword = document.querySelector('#password');
    let intentos = 0;

    formulario.addEventListener('submit', (e) => {
        e.preventDefault();
        const contraseña = campoPassword.value;

        if (contraseña === '1234' && intentos === 0) {
            alert('Contraseña incorrecta');
            intentos++;
            limpiarFormulario(formulario, campoPassword);
        } else if (contraseña === '1234' && intentos === 1) {
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