document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.querySelector('#formulario');
    const campoPassword = document.querySelector('#password');
    let serverPassword = '';

    // Obtener la contraseña desde el servidor
    fetch('/get-password')
        .then(response => response.json())
        .then(data => {
            serverPassword = data.password;
        })
        .catch(error => console.error('Error fetching password:', error));

    formulario.addEventListener('submit', (e) => {
        e.preventDefault();
        const contraseña = campoPassword.value;

        if (contraseña === serverPassword) {
            window.location.href = 'formulario.html';
        } else {
            alert('Contraseña incorrecta');
            limpiarFormulario(formulario, campoPassword);
        }
    });
});

function limpiarFormulario(formulario, campoPassword) {
    formulario.reset();
    campoPassword.value = '';
    campoPassword.focus();
}