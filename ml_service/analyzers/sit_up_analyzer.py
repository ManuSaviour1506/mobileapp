# ml_service/analyzers/sit_up_analyzer.py
from mediapipe.python.solutions import pose as mp_pose
from .base_analyzer import BaseAnalyzer
from .repetition_counter import RepetitionCounter
from utils.math_utils import calculate_angle

class SitUpAnalyzer(BaseAnalyzer):
    """Analyzes sit-up performance for repetitions and form."""

    def analyze(self) -> dict:
        print("Analyzing sit-ups...")
        
        # We'll use the shoulder as the primary landmark for counting reps
        shoulder = mp_pose.PoseLandmark.LEFT_SHOULDER.value
        
        # Initialize repetition counter based on shoulder movement
        # Thresholds are based on normalized y-coordinates.
        # This will need to be calibrated with real data.
        counter = RepetitionCounter(shoulder, enter_threshold=0.6, exit_threshold=0.3)

        reps = 0
        form_ok = True
        
        # You'd iterate through landmarks to update the counter and check form
        # For simplicity, we'll mock the reps and form check
        for frame_landmarks in self.landmarks:
            current_reps = counter.update(frame_landmarks)
            # You would add form validation here, e.g., checking the knee angle
            # at the start/end of a repetition to ensure it stays bent.
            reps = current_reps

        feedback_messages = []
        if reps == 0:
            feedback_messages.append("No full repetitions were detected.")
            form_ok = False
        else:
            feedback_messages.append(f"Great work on completing {reps} sit-ups!")
        
        if not form_ok:
            feedback_messages.append("Ensure you return to the starting position and touch your elbows to your knees.")

        # Scoring Logic: A combination of reps and form
        score = min(100, (reps * 10) + (50 if form_ok else 0))

        return {
            "approved": score >= 75 and reps > 0,
            "score": score,
            "feedback": " ".join(feedback_messages),
            "metrics": {
                "repetitions": reps,
            }
        }