import app from './app';
import  'dotenv/config';
import connectDB from './config/db';


connectDB();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
