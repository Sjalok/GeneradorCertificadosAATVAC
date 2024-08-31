document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.querySelector('#formulario');
    const campoPassword = document.querySelector('#password');
    let serverPassword = '';

    fetch('/get-password')
        .then(response => response.json())
        .then(data => {
            serverPassword = data.password;
            console.log('Contraseña del servidor:', serverPassword);
        })
        .catch(error => console.error('Error fetching password:', error));

    formulario.addEventListener('submit', (e) => {
        const contraseña = campoPassword.value;

        console.log('Contraseña ingresada:', contraseña);
        console.log('Contraseña del servidor:', serverPassword);

        if (contraseña === serverPassword) {
            console.log("asd");
            window.location.href = `/formulario`;
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