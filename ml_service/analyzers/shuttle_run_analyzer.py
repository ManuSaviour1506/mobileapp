# ml_service/analyzers/shuttle_run_analyzer.py
from .base_analyzer import BaseAnalyzer
import numpy as np
import time

class ShuttleRunAnalyzer(BaseAnalyzer):
    """Analyzes 4x10m shuttle run performance by tracking horizontal movement."""

    def analyze(self) -> dict:
        print("Analyzing shuttle run...")
        
        if not self.landmarks or not self.landmarks[0]:
            return {
                "approved": False,
                "score": 0,
                "feedback": "No pose detected in the video.",
                "metrics": {}
            }

        start_time = time.time()
        turns = 0
        current_direction = None # 'right' or 'left'
        
        # Simplified start position from the first frame
        start_x = self.landmarks[0][mp_pose.PoseLandmark.LEFT_HIP.value].x
        
        for frame_landmarks in self.landmarks:
            if not frame_landmarks:
                continue

            hip_x = frame_landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x
            
            # This is a very basic turn detection based on direction change
            if current_direction is None:
                if hip_x > start_x:
                    current_direction = 'right'
                elif hip_x < start_x:
                    current_direction = 'left'
            else:
                if current_direction == 'right' and hip_x < start_x:
                    turns += 1
                    current_direction = 'left'
                elif current_direction == 'left' and hip_x > start_x:
                    turns += 1
                    current_direction = 'right'
            
            # In a real scenario, you'd check if the hip landmark crosses a virtual line
            # at each end of the 10m course.
            
        end_time = time.time()
        
        # Mocking values for demonstration
        mock_time_seconds = end_time - start_time
        
        # Scoring based on time and number of turns
        expected_turns = 3
        
        if turns < expected_turns:
            feedback = f"Foul: Only {turns} turns were detected. You must complete 4x10m."
            approved = False
        else:
            feedback = f"Great run! Time: {mock_time_seconds:.2f} seconds."
            approved = True

        score = max(0, 100 - (mock_time_seconds * 5)) # Example scoring

        return {
            "approved": approved,
            "score": int(score),
            "feedback": feedback,
            "metrics": {
                "time_taken_seconds": round(mock_time_seconds, 2),
                "turns_detected": turns
            }
        }