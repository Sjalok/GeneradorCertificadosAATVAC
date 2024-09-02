const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const port = process.env.PORT || 8080;
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'produccion')));

app.get('/certificados', (req, res) => {
    res.sendFile(path.join(__dirname, 'produccion', 'certificados.html'));
});

app.get('/get-password', (req, res) => {
    res.json({ password: process.env.PASSWORD });
});

app.post('/formulario', (req, res) => {
    const password = req.body.password;
    if (password === process.env.PASSWORD) {
        res.sendFile(path.join(__dirname, 'produccion', 'formulario.html'));
    } else {
        res.status(401).send('Acceso denegado: Contraseña incorrecta.');
    }
});

app.get('/centroFormacion', (req, res) => {
    const password = req.body.password;
    if (password === process.env.PASSWORD) {
        res.sendFile(path.join(__dirname, 'produccion', 'centroFormacion.html'));
    } else {
        res.status(401).send('Acceso denegado: Contraseña incorrecta.');
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'produccion', 'index.html'));
});

app.listen(port, async () => {
    console.log(`Programa listo para usar en http://localhost:${port}`);
});