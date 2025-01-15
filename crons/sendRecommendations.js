import cron from 'node-cron';
import axios from 'axios'; // Ensure you have axios installed
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// Function to trigger the /recommend endpoint
const sendRecommendations = async () => {
    console.log('Triggering the /recommend endpoint...');
    try {
        // Use the API base URL from environment variables
        const apiUrl = `${process.env.API}/users/recommend`;
        
        const response = await axios.post(apiUrl);

        console.log('Recommendations triggered successfully:', response.data);
    } catch (error) {
        console.error('Error triggering the /recommend endpoint: ', {
            message: apiUrl,
            stack: error.stack,
        });
    }
};
// commented to stop cron
// cron.schedule('*/50 * * * * *', async () => {
//     console.log('Cron job triggered: Triggering /recommend endpoint...');
//     await sendRecommendations();
// });

export default sendRecommendations;
