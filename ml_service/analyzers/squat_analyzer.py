# ml_service/analyzers/squat_analyzer.py
from mediapipe.python.solutions import pose as mp_pose
from .base_analyzer import BaseAnalyzer
from .repetition_counter import RepetitionCounter
from utils.math_utils import calculate_angle

class SquatAnalyzer(BaseAnalyzer):
    """Analyzes squat performance for repetitions and form."""

    def analyze(self) -> dict:
        hip = mp_pose.PoseLandmark.LEFT_HIP.value
        knee = mp_pose.PoseLandmark.LEFT_KNEE.value
        ankle = mp_pose.PoseLandmark.LEFT_ANKLE.value
        shoulder = mp_pose.PoseLandmark.LEFT_SHOULDER.value

        counter = RepetitionCounter(hip, enter_threshold=0.7, exit_threshold=0.6)

        min_knee_angle = 180.0
        max_back_angle = 0.0
        feedback_messages = []

        for frame_landmarks in self.landmarks:
            if not frame_landmarks or not frame_landmarks[hip] or not frame_landmarks[knee] or not frame_landmarks[ankle]:
                continue
            
            counter.update(frame_landmarks)

            # Calculate knee angle for depth
            knee_angle = calculate_angle(
                (frame_landmarks[hip].x, frame_landmarks[hip].y),
                (frame_landmarks[knee].x, frame_landmarks[knee].y),
                (frame_landmarks[ankle].x, frame_landmarks[ankle].y)
            )
            min_knee_angle = min(min_knee_angle, knee_angle)

            # Calculate back angle (hip-shoulder relative to vertical) for posture
            # Simplified approach: horizontal distance between hip and shoulder
            hip_x = frame_landmarks[hip].x
            shoulder_x = frame_landmarks[shoulder].x
            back_lean_metric = abs(hip_x - shoulder_x) * 100 
            max_back_lean_metric = max(max_back_angle, back_lean_metric)


        # Scoring and Feedback Logic
        reps = counter.count
        # Good depth is typically below 100 degrees
        depth_ok = min_knee_angle < 100 
        # Check for excessive forward lean
        posture_ok = max_back_lean_metric < 5 

        if not depth_ok:
            feedback_messages.append("Try to go deeper to reach at least parallel.")
        if not posture_ok:
            feedback_messages.append("Keep your chest up and back straight.")
        if reps == 0:
            feedback_messages.append("No full repetitions were detected.")
        else:
            feedback_messages.append(f"Great work on completing {reps} reps!")

        score = (int(depth_ok) * 50) + (int(posture_ok) * 50) + (reps * 10)
        score = min(100, score)

        return {
            "approved": score >= 75 and reps > 0,
            "score": score,
            "feedback": " ".join(feedback_messages),
            "metrics": {
                "repetitions": reps,
                "min_knee_angle": round(min_knee_angle, 2),
                "max_forward_lean_metric": round(max_back_lean_metric, 2)
            }
        }