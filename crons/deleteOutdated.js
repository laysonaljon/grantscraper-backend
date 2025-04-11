import axios from 'axios'; 
import dotenv from 'dotenv';

dotenv.config();

const deleteOutdated = async () => {
    try {
        const apiUrl = `${process.env.API}/scholarships/delete-outdated`;
        const response = await axios.delete(apiUrl);
        console.log('Successfully triggered /delete-outdated endpoint: ', response.data);
    } catch (error) {
        console.error('Error triggering the /delete-outdated endpoint:', error.message);
    }
};

export default deleteOutdated;
