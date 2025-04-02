import cron from 'node-cron';
import axios from 'axios'; 
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const deleteOutdated = async () => {
    try {
        const apiUrl = `${process.env.API}/scholarships/delete-outdated`;
        const response = await axios.delete(apiUrl);
        console.log('Successfully triggered /delete-outdated endpoint: ', response.data);
    } catch (error) {
        console.error('Error triggering the /delete-outdated endpoint:', error.message);
    }
};

// Uncomment this to enable the cron job
cron.schedule('0 5 * * *', async () => {
    console.log(`Cron job triggered: Triggering /delete-outdated endpoint...`, new Date().toLocaleString());
    await deleteOutdated();
});

export default deleteOutdated;
