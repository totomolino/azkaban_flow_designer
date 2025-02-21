import axios from 'axios';

const proxyURL = 'http://10.232.75.44:4000/api'; // Proxy server URL

export async function authenticate() {
    const username = window.prompt("Enter your Azkaban username:");
    const password = window.prompt("Enter your Azkaban password:");

    if (!username || !password) {
        console.error("Authentication cancelled or invalid input.");
        return null;
    }

    try {
        const response = await axios.post(`${proxyURL}/authenticate`, {
            username,
            password
        });

        if (response.status === 200 && response.data['session.id']) {
            console.log("Authentication successful.");
            return response.data['session.id'];
        } else {
            console.error("Authentication failed:", response.data);
            return null;
        }
    } catch (error) {
        console.error("Error while connecting to Azkaban:", error);
        return null;
    }
}

export async function createProject(sessionId, projectName) {
    try {
        const response = await axios.post(`${proxyURL}/createProject`, {
            sessionId,
            projectName
        });

        if (response.status === 200 && response.data.status === "success") {
            console.log(`Project ${projectName} created successfully.`);
            return true;
        } else {
            console.error(`Failed to create project ${projectName}:`, response.data);
            return false;
        }
    } catch (error) {
        console.error(`Error while creating project ${projectName}:`, error);
        return false;
    }
}

export async function uploadZip(sessionId, projectName, zipFile) {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('projectName', projectName);
    formData.append('zipFile', zipFile);

    try {
        const response = await axios.post(`${proxyURL}/uploadZip`, formData, {
            validateStatus: false
        });

        if (response.status === 200) {
            console.log(`Zip file uploaded successfully to ${projectName}.`);
        } else {
            console.error(`Failed to upload zip file to ${projectName}:`, response.data);
        }
    } catch (error) {
        console.error(`Error while uploading zip file:`, error);
    }
}

