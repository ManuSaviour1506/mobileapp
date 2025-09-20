// models/Video.js
import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    sport: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Sport",
    },
    videoUrl: {
      type: String,
      required: true,
    },
    testType: {
      // New field to store the specific test type
      type: String,
      enum: [
        "sit-ups",
        "standing-vertical-jump",
        "shuttle-run",
        "squat",
        "sprint",
      ],
      required: true,
    },
    analysisStatus: {
      type: String,
      enum: ["Pending", "Processing", "Complete", "Failed"],
      default: "Pending",
    },
    results: {
      type: Object, // Stores the JSON response from the ML service
      default: null,
    },
    isQualificationAttempt: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Video = mongoose.model("Video", videoSchema);
export default Video;
