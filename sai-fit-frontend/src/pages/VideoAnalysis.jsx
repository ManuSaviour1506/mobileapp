// src/pages/VideoAnalysis.jsx
import { useState, useEffect } from 'react';
import { getSports, requestAnalysis, getVideoHistory } from '../api'; // Added getVideoHistory for polling
import ImageKit from 'imagekit-javascript';
import { useNavigate } from 'react-router-dom';

const testIcons = {
  'sit-ups': '💪',
  'squat': '🏋️',
  'jump': '🤸',
  'shuttle-run': '🏃',
  'endurance-run': '⏱️',
  'standing-broad-jump': '🦵',
  'sit-and-reach': '🧘',
};

const testInstructions = {
  'sit-ups': 'Instructions for Sit-ups: Lie on your back with knees bent and feet flat. Place your hands behind your head. Lift your torso until your elbows touch your knees. Return to the starting position. Make sure to complete each rep fully for accurate analysis.',
  'squat': 'Instructions for Squats: Stand with your feet shoulder-width apart. Lower your hips as if sitting in a chair, keeping your back straight and chest up. Your thighs should be at least parallel to the floor. Return to the standing position.',
  'jump': 'Instructions for Standing Vertical Jump: Stand with your side to the camera. Use a marker or reference point for your standing reach. Jump as high as you can, touching the highest point possible at the peak of your jump.',
  'shuttle-run': 'Instructions for 4x10m Shuttle Run: Mark two parallel lines 10 meters apart. On the "go" signal, run from one line to the other, touching the line with your hand, and immediately turn back. Repeat this for a total of four times.',
  'endurance-run': 'Instructions for Endurance Run: Record yourself at the start and end of the race (800m for U-12, 1.6km for 12+). The video will be used to verify your start and finish. The time will be used for scoring.',
  'standing-broad-jump': 'Instructions for Standing Broad Jump: Stand behind a marked line with feet apart. Swing your arms and bend your knees to jump as far as possible, landing on both feet without falling backward. The video will measure the distance of your jump.',
  'sit-and-reach': 'Instructions for Sit and Reach: Sit on the floor with your legs straight and feet against a box. Reach forward as far as you can with both hands, holding the position. The video will measure your flexibility based on your reach.',
};

const VideoAnalysis = () => {
  const [file, setFile] = useState(null);
  const [testType, setTestType] = useState('');
  const [isQualification, setIsQualification] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize ImageKit with your public key and URL endpoint
  const imagekit = new ImageKit({
    publicKey: "public_LSNp012QVTYVNFVfmYmBzlrd0cA=",
    urlEndpoint: "https://ik.imagekit.io/Mobileapp",
  });

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const sportsList = await getSports();
        setSports(sportsList);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch sports', error);
        setLoading(false);
      }
    };
    fetchSports();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleTestSelect = (test) => {
    setTestType(test);
    setFile(null);
    setAnalysisStatus(null);
    setAnalysisResult(null);
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  };

  const startPolling = (videoId, token) => {
    const interval = setInterval(async () => {
      try {
        const videoHistory = await getVideoHistory(token);
        const video = videoHistory.find(v => v._id === videoId);
        if (video) {
          setAnalysisStatus(video.analysisStatus);
          if (video.analysisStatus === 'Complete' || video.analysisStatus === 'Failed') {
            clearInterval(interval);
            setPollInterval(null);
            setAnalysisResult(video.results);
          }
        }
      } catch (error) {
        console.error('Polling failed', error);
        clearInterval(interval);
        setPollInterval(null);
        setAnalysisStatus('Failed');
      }
    }, 5000); // Poll every 5 seconds
    setPollInterval(interval);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a video file to upload.');
      return;
    }

    setUploading(true);
    setAnalysisStatus('Uploading...');
    setAnalysisResult(null);
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    try {
      // 1. Get authentication parameters from your backend
      const response = await fetch('http://localhost:5001/api/uploads/imagekit-auth', {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
        },
      });
      const authParams = await response.json();

      // 2. Upload the file to ImageKit
      const uploadResponse = await new Promise((resolve, reject) => {
        imagekit.upload({
          file: file,
          fileName: file.name,
          token: authParams.token,
          signature: authParams.signature,
          expire: authParams.expire,
          folder: '/sports_analysis',
          onSuccess: resolve,
          onError: reject,
        });
      });
      
      const videoUrl = uploadResponse.url;

      // 3. Submit the ImageKit URL to your backend for analysis
      setAnalysisStatus('Processing...');
      const analysisRequest = await requestAnalysis(videoUrl, 'general_fitness', testType, isQualification, userInfo.token);
      
      if (analysisRequest.videoId) {
        startPolling(analysisRequest.videoId, userInfo.token);
      }
      
      alert('Video submitted for analysis successfully! Results will appear below when ready.');
      setUploading(false);
      setFile(null);
      setTestType('');
      
    } catch (error) {
      console.error('Video submission failed', error);
      alert('Video submission failed. Please try again.');
      setUploading(false);
      setAnalysisStatus('Failed');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Select a Test to Analyze</h1>
      
      <div className="flex flex-wrap justify-center gap-6 mb-8">
        {Object.entries(testIcons).map(([test, icon]) => (
          <div
            key={test}
            onClick={() => handleTestSelect(test)}
            className={`flex flex-col items-center p-4 rounded-lg shadow-md cursor-pointer transition-transform duration-200 hover:scale-105
              ${testType === test ? 'bg-blue-200 ring-2 ring-blue-500' : 'bg-white'}`}
          >
            <span className="text-4xl">{icon}</span>
            <span className="mt-2 text-sm font-medium text-center">{test.replace(/-/g, ' ').toUpperCase()}</span>
          </div>
        ))}
      </div>

      {testType && (
        <div className="bg-white p-6 rounded shadow-md max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-4">Instructions for {testType.replace(/-/g, ' ').toUpperCase()}</h2>
          <p className="text-gray-700 mb-6">{testInstructions[testType]}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700">Upload Video</label>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">
                <input
                  type="checkbox"
                  checked={isQualification}
                  onChange={(e) => setIsQualification(e.target.checked)}
                  className="mr-2"
                />
                This is a qualification attempt
              </label>
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={uploading || analysisStatus}
            >
              {uploading ? 'Uploading...' : 'Submit for Analysis'}
            </button>
          </form>
        </div>
      )}

      {analysisStatus && (
        <div className="mt-8 p-6 bg-white rounded shadow-md max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-4">Analysis Status</h2>
          <p className="text-lg"><strong>Status:</strong> {analysisStatus}</p>
          {analysisResult && (
            <>
              <h3 className="text-xl font-semibold mt-4">Results</h3>
              <p className="text-lg"><strong>Score:</strong> <span className="font-semibold text-green-600">{analysisResult.score}</span></p>
              <p className="text-lg"><strong>Feedback:</strong> {analysisResult.feedback}</p>
              <p className="mt-4 text-sm text-gray-500">
                You can view the full analysis details on your dashboard.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoAnalysis;