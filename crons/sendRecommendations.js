import cron from 'node-cron';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Function to trigger the /recommend endpoint
const sendRecommendations = async () => {
    console.log('Triggering the /recommend endpoint...');
    try {
        // Use the API base URL from environment variables
        const apiUrl = `${process.env.API}/users/recommend`;
        
        const response = await axios.post(apiUrl);
    } catch (error) {
        console.error('Error triggering the /recommend endpoint: ', {
            message: apiUrl,
            stack: error.stack,
        });
    }
};

cron.schedule('0 15 9 * * *', async () => {
    console.log(`Cron job triggered: Triggering /recommend endpoint...`, new Date().toLocaleString());
    await sendRecommendations();
});

export default sendRecommendations;
