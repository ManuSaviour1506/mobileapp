// controllers/videoController.js
import asyncHandler from "express-async-handler";
import axios from "axios";
import Video from "../models/Video.js";
import User from "../models/User.js";
import Sport from "../models/Sport.js";

// @desc    Request analysis for an uploaded video
// @route   POST /api/videos/request-analysis
// @access  Private
const requestAnalysis = asyncHandler(async (req, res) => {
  const { videoUrl, sportId, isQualificationAttempt, testType } = req.body;

  if (!videoUrl || !sportId || !testType) {
    res.status(400);
    throw new Error("Missing videoUrl, sportId, or testType");
  }

  const sport = await Sport.findById(sportId);
  if (!sport) {
    res.status(404);
    throw new Error("Sport not found");
  }

  // 1. Create a video record in our DB
  const video = await Video.create({
    user: req.user._id,
    sport: sportId,
    videoUrl,
    testType,
    isQualificationAttempt,
    analysisStatus: "Pending",
  });

  // 2. Send request to ML service (fire-and-forget)
  try {
    const mlServiceUrl = `${process.env.ML_SERVICE_URL}/analyze`;
    const webhookUrl = `http://<your-backend-ngrok-or-public-url>/api/videos/analysis-webhook/${video._id}`;

    // Add a secret key for authentication
    const webhookSecret = process.env.WEBHOOK_SECRET;

    await axios.post(mlServiceUrl, {
      video_url: videoUrl,
      sport: sport.mlIdentifier,
      test_type: testType,
      webhook_url: webhookUrl,
      webhook_secret: webhookSecret,
    });

    video.analysisStatus = "Processing";
    await video.save();

    res.status(202).json({
      message: "Analysis request accepted and is being processed.",
      videoId: video._id, // RETURN THE VIDEO ID
    });
  } catch (error) {
    video.analysisStatus = "Failed";
    await video.save();
    console.error("Error contacting ML service:", error.message);
    res.status(500);
    throw new Error("Failed to initiate video analysis with ML service.");
  }
});

// @desc    Webhook for ML service to post results back
// @route   POST /api/videos/analysis-webhook/:id
// @access  Public (should be secured, e.g., with a secret key)
const handleAnalysisWebhook = asyncHandler(async (req, res) => {
  // Validate the incoming request with the secret key
  const receivedSecret = req.headers["x-webhook-secret"];
  if (receivedSecret !== process.env.WEBHOOK_SECRET) {
    res.status(403);
    throw new Error("Forbidden: Invalid webhook secret");
  }

  const videoId = req.params.id;
  const results = req.body;

  const video = await Video.findById(videoId);

  if (!video) {
    res.status(404);
    throw new Error("Video record not found for this analysis.");
  }

  // Update video record with results
  video.analysisStatus = "Complete";
  video.results = results;
  await video.save();

  // If it was a qualification attempt and the user passed, update their role
  if (video.isQualificationAttempt && results.approved) {
    await User.findByIdAndUpdate(video.user, { role: "Athlete" });
  }

  // TODO: Implement a push notification to the user
  console.log(
    `Analysis complete for video ${videoId}. User role updated if qualified.`
  );

  res.status(200).send("Webhook received.");
});

// @desc    Get user's video history
// @route   GET /api/videos
// @access  Private
const getVideoHistory = asyncHandler(async (req, res) => {
  const videos = await Video.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("sport", "name");
  res.json(videos);
});

export { requestAnalysis, handleAnalysisWebhook, getVideoHistory };
