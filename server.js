const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'produccion')));

// Ruta para el formulario protegido
app.get('/formulario', (req, res) => {
    const password = req.query.password;
    if (password === 'tu_contraseña_secreta') {
        res.sendFile(path.join(__dirname, 'produccion', 'formulario.html'));
    } else {
        res.status(401).send('Acceso denegado');
    }
});

// Ruta para el centro de formación protegido
app.get('/centroFormacion', (req, res) => {
    const password = req.query.password;
    if (password === 'tu_contraseña_secreta') {
        res.sendFile(path.join(__dirname, 'produccion', 'centroFormacion.html'));
    } else {
        res.status(401).send('Acceso denegado');
    }
});

// Ruta para el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'produccion', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});