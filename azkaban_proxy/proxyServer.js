// proxyServer.js
require('dotenv').config();
const FormData = require('form-data');
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs'); // Add this line to import the fs module

const app = express();
const upload = multer({ dest: 'uploads/' }); // Stores files in 'uploads/' directory
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

app.post('/api/uploadZip', upload.single('zipFile'), async (req, res) => {
    console.log(req.file);  // Log to check if file is received
    console.log(req.body);  // Log request body (sessionId, projectName)

    if (!req.file) {
        return res.status(400).json({ error: 'File not received' });
    }

    const formData = new FormData();
    formData.append('session.id', req.body.sessionId);
    formData.append('project', req.body.projectName);
    formData.append('ajax', 'upload');

    // Read the uploaded file and append to formData
    const fileStream = fs.createReadStream(req.file.path);
    formData.append('file', fileStream, { filename: req.file.originalname, contentType: 'application/zip' }); // Specify filename and content type

    try {
        const response = await axios.post(`${baseURL}/manager`, formData, {
            headers: {
                ...formData.getHeaders(), // Use formData's headers for multipart/form-data
                validateStatus: false,
            },
        });

        // Check the response and return accordingly
        if (response.status === 200) {
            console.log(`Zip file uploaded successfully to ${req.body.projectName}.`);
            res.status(200).json(response.data);
        } else {
            console.error(`Failed to upload zip file to ${req.body.projectName}:`, response.data);
            res.status(response.status).json({ error: `Failed to upload zip file: ${response.data}` });
        }
    } catch (error) {
        console.error(`Error while uploading zip file:`, error);
        res.status(500).json({ error: 'Error uploading zip file' });
    }
});


app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
