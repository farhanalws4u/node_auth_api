import mongoose from 'mongoose';
import app from './app.js';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' }); // will look for config.env file and save variable which are defined in that file to node process.env variables...

// database connection
mongoose
  .connect(process.env.DATABASE_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('db connection successful...'))
  .catch((err) => console.log('could not connect to db', err));

const port = process.env.PORT || 3000;

// starting our server
const server = app.listen(port, () =>
  console.log(`app is running on port ${port}....`)
);

// handling unhandled rejection and uncaught exceptions.....
process.on('uncaughtException', (err) => {
  console.log('unhandled exception , shutting server down');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (err) => {
  console.log('unhandled Rejection , shutting server down');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
console.log(process.env.NODE_ENV);
