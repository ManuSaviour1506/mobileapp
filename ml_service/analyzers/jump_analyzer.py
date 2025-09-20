# ml_service/analyzers/jump_analyzer.py
from .base_analyzer import BaseAnalyzer
from mediapipe.python.solutions import pose as mp_pose

class JumpAnalyzer(BaseAnalyzer):
    """Analyzes jump performance by calculating jump height and counting repetitions from pose landmarks."""

    def analyze(self) -> dict:
        print("Analyzing jump...")
        
        if not self.landmarks or not any(self.landmarks):
            return {
                "approved": False,
                "score": 0,
                "feedback": "No pose detected in the video.",
                "metrics": {}
            }
        
        # Use the hip landmark as a proxy for the center of mass
        hip_y_index = mp_pose.PoseLandmark.LEFT_HIP.value
        
        # Filter out frames where the hip landmark is not detected
        valid_landmarks = [lm[hip_y_index].y for lm in self.landmarks if lm and lm[hip_y_index]]
        
        if not valid_landmarks:
            return {
                "approved": False,
                "score": 0,
                "feedback": "No hip landmark detected in the video.",
                "metrics": {}
            }
        
        # Find the starting position (at rest) and detect jumps
        min_y_per_jump = []
        max_y_per_jump = []
        is_jumping = False
        start_y = valid_landmarks[0]
        
        for y_coord in valid_landmarks:
            # Detect downward movement (start of a jump)
            if not is_jumping and y_coord > start_y + 0.05: # Threshold for downward motion
                is_jumping = True
                max_y_per_jump.append(y_coord)
            
            # Detect upward movement (end of a jump)
            if is_jumping and y_coord < start_y - 0.05: # Threshold for upward motion
                is_jumping = False
                min_y_per_jump.append(y_coord)
        
        number_of_jumps = len(min_y_per_jump)
        
        max_jump_height_cm = 0
        if number_of_jumps > 0:
            # Calculate the height for each detected jump
            jump_heights_normalized = [start_y - min_y for min_y in min_y_per_jump]
            max_jump_height_normalized = max(jump_heights_normalized)
            
            # Use a placeholder conversion factor. This should be calibrated with real-world data.
            # Assuming 1 normalized unit of vertical displacement is roughly 100 cm.
            conversion_factor = 100 
            max_jump_height_cm = round(max_jump_height_normalized * conversion_factor, 2)

        # Scoring logic: combination of number of jumps and max height
        score = min(100, max(0, int(max_jump_height_cm * 2) + number_of_jumps * 5))
        
        feedback = f"Analyzed {number_of_jumps} jumps. Max jump height: {max_jump_height_cm} cm."
        approved = max_jump_height_cm > 20 # Example threshold for a good jump

        return {
            "approved": approved,
            "score": score,
            "feedback": feedback,
            "metrics": {
                "number_of_jumps": number_of_jumps,
                "max_jump_height_cm": max_jump_height_cm,
            }
        }