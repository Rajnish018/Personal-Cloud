import mongoose from "mongoose";

let isConnected = false;
let retryCount = 0;
const MAX_RETRIES = 5;

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;

    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    if (isConnected) {
      console.log("MongoDB already connected");
      return mongoose.connection;
    }

    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 20,
      minPoolSize: 5,
      autoIndex: false,
    });

    isConnected = true;
    retryCount = 0;

    // console.log(
    //   `MongoDB Connected: ${conn.connection.host}`
    // );

    return conn;
  } catch (error) {
    isConnected = false;

    console.error(
      ` MongoDB Connection Error: ${error.message}`
    );

    if (retryCount < MAX_RETRIES) {
      retryCount++;

      console.log(
        ` Retrying connection (${retryCount}/${MAX_RETRIES})...`
      );

      setTimeout(() => {
        connectDB();
      }, 5000);
    } else {
      console.error(
        " Maximum retry attempts reached. Exiting..."
      );

      process.exit(1);
    }
  }
};

mongoose.connection.on("connected", () => {
  console.log(" MongoDB connection established");
});

mongoose.connection.on("error", (err) => {
  console.error(" MongoDB error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn(" MongoDB disconnected");
});

export default connectDB;