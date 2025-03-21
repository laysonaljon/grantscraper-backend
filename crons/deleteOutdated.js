import cron from 'node-cron';
import axios from 'axios'; 
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const deleteOudated = async () => {
    try {
        // Use the API base URL from environment variables
        const apiUrl = `${process.env.API}/scholarships/delete-outdated`;
        
        const response = await axios.post(apiUrl);

        console.log('Delete Outdated Endpoint triggered successfully:', response.data);
    } catch (error) {
        console.error('Error triggering the /delete-outdated endpoint: ', {
            message: 'apiUrl',
            stack: error.stack,
        });
    }
}

// commented to stop cron
cron.schedule('0 0 5 * * *', async () => {
    console.log(`Cron job triggered: Triggering /delete-outdated endpoint...`, new Date().toLocaleString());
    await deleteOudated();
});

export default deleteOudated;
