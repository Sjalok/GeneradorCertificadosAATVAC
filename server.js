const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const port = process.env.PORT || 8080; // Usa 8080 si no se define en .env

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'produccion')));

app.get('/get-password', (req, res) => {
    res.json({ password: process.env.PASSWORD });
});

app.get('/formulario', (req, res) => {
    const password = req.query.password;
    if (password === process.env.PASSWORD) {
        res.sendFile(path.join(__dirname, 'produccion', 'formulario.html'));
    } else {
        res.status(401).send('Acceso denegado');
    }
});

app.get('/centroFormacion', (req, res) => {
    const password = req.query.password;
    if (password === process.env.PASSWORD) {
        res.sendFile(path.join(__dirname, 'produccion', 'centroFormacion.html'));
    } else {
        res.status(401).send('Acceso denegado');
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'produccion', 'index.html'));
});

app.listen(port, async () => {
    console.log(`Programa listo para usar en http://localhost:${port}`);
    const open = await import('open');
    open.default(`http://localhost:${port}`);
});