# ml_service/analyzers/sit_and_reach_analyzer.py
from .base_analyzer import BaseAnalyzer
from mediapipe.python.solutions import pose as mp_pose

class SitAndReachAnalyzer(BaseAnalyzer):
    """Analyzes the Sit and Reach Test for flexibility."""

    def analyze(self) -> dict:
        print("Analyzing Sit and Reach Test...")

        if not self.landmarks or len(self.landmarks) < 2:
            return {
                "approved": False,
                "score": 0,
                "feedback": "Not enough data to analyze Sit and Reach performance.",
                "metrics": {}
            }
        
        # We need to measure the distance of the hands past the feet.
        # This is a simplified approach using normalized coordinates.
        # In a real-world scenario, you'd need to set a reference point (e.g., the feet)
        # and measure the horizontal displacement of the wrists from that point.
        
        # Use the wrists as the keypoints for the reach
        wrist_left = mp_pose.PoseLandmark.LEFT_WRIST.value
        wrist_right = mp_pose.PoseLandmark.RIGHT_WRIST.value
        
        # Use the feet as the zero-point reference
        ankle_left = mp_pose.PoseLandmark.LEFT_ANKLE.value
        ankle_right = mp_pose.PoseLandmark.RIGHT_ANKLE.value
        
        # Find the max forward displacement (min x-coordinate)
        max_reach_metric = 0
        for frame_landmarks in self.landmarks:
            if not frame_landmarks or not frame_landmarks[wrist_left] or not frame_landmarks[wrist_right]:
                continue
                
            # Get the wrist and ankle x-coordinates
            wrist_x = (frame_landmarks[wrist_left].x + frame_landmarks[wrist_right].x) / 2
            ankle_x = (frame_landmarks[ankle_left].x + frame_landmarks[ankle_right].x) / 2
            
            # Calculate the reach relative to the ankles
            reach_displacement = ankle_x - wrist_x
            
            if reach_displacement > max_reach_metric:
                max_reach_metric = reach_displacement
                
        # Scoring based on reach
        # This will require calibration to actual physical measurements.
        # Example conversion: 1 normalized unit = 100 cm
        estimated_reach_cm = max_reach_metric * 100
        score = min(100, max(0, int(estimated_reach_cm * 2)))

        feedback = f"Excellent flexibility! Estimated reach: {estimated_reach_cm:.2f} cm."
        approved = estimated_reach_cm > 20 # Example threshold

        return {
            "approved": approved,
            "score": score,
            "feedback": feedback,
            "metrics": {
                "estimated_reach_cm": round(estimated_reach_cm, 2),
            }
        }