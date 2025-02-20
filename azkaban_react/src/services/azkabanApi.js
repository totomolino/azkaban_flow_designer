import axios from 'axios';

const baseURL = `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_AZKABAN_PORT}`;

export async function authenticate() {
    const username = window.prompt("Enter your Azkaban username:");
    const password = window.prompt("Enter your Azkaban password:");

    console.log(baseURL);
    
    if (!username || !password) {
        console.error("Authentication cancelled or invalid input.");
        return null;
    }

    try {
        const response = await axios.post(`${baseURL}/`, new URLSearchParams({
            action: 'login',
            username,
            password
        }), { validateStatus: false });

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
        const response = await axios.post(`${baseURL}/manager?action=create`, new URLSearchParams({
            'session.id': sessionId,
            name: projectName,
            description: `Project ${projectName}`
        }), { validateStatus: false });

        if (response.status === 200 && response.data.toLowerCase().includes("success")) {
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
    try {
        const formData = new FormData();
        formData.append('session.id', sessionId);
        formData.append('project', projectName);
        formData.append('ajax', 'upload');
        formData.append('file', zipFile, `${projectName}.zip`);

        const response = await axios.post(`${baseURL}/manager`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
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
