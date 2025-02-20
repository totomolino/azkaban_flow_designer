// proxyServer.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 4000; // You can change this port if needed

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(bodyParser.json()); // For parsing application/json

const baseURL = `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_AZKABAN_PORT}`;

app.post('/api/authenticate', async (req, res) => {
    try {
        const response = await axios.post(`${baseURL}/`, new URLSearchParams({
            action: 'login',
            username: req.body.username,
            password: req.body.password
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error("Error while connecting to Azkaban:", error);
        res.status(500).json({ error: 'Error connecting to Azkaban' });
    }
});

app.post('/api/createProject', async (req, res) => {
    try {
        const response = await axios.post(`${baseURL}/manager?action=create`, new URLSearchParams({
            'session.id': req.body.sessionId,
            name: req.body.projectName,
            description: `Project ${req.body.projectName}`
        }), { validateStatus: false });

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`Error while creating project ${req.body.projectName}:`, error);
        res.status(500).json({ error: 'Error creating project' });
    }
});

app.post('/api/uploadZip', async (req, res) => {
    const formData = new FormData();
    formData.append('session.id', req.body.sessionId);
    formData.append('project', req.body.projectName);
    formData.append('ajax', 'upload');
    formData.append('file', req.files.zipFile, `${req.body.projectName}.zip`); // You'll need to handle file uploads

    try {
        const response = await axios.post(`${baseURL}/manager`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            validateStatus: false
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`Error while uploading zip file:`, error);
        res.status(500).json({ error: 'Error uploading zip file' });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
