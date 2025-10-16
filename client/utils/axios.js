import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:30000/api', // 👈 change this to your local backend port
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default instance;