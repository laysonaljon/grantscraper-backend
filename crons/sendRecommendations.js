import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Function to trigger the /recommend endpoint
const sendRecommendations = async () => {
    console.log('Triggering the /recommend endpoint...');
    const apiUrl = `${process.env.API}/users/recommend`;
    try {
        await axios.post(apiUrl);
        console.log('Recommendations triggered successfully:', new Date().toLocaleString());
    } catch (error) {
        console.error('Error triggering the /recommend endpoint: ', {
            message: apiUrl,
            stack: error.stack,
        });
    }
};

export default sendRecommendations;
