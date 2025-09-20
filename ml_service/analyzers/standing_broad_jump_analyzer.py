import cv2
import mediapipe as mp
import numpy as np

# --- STATE VARIABLES ---
standing_reach_y = None
jump_peak_y = 1  # Start with 1 (bottom of screen) to easily find the minimum y (top of screen)
pixel_to_cm_ratio = None
A4_PAPER_HEIGHT_CM = 29.7 # Standard height of an A4 paper

# Initialize MediaPipe Holistic
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5)
mp_drawing = mp.solutions.drawing_utils

# --- IMPORTANT: CHANGE THIS LINE ---
VIDEO_FILE_PATH = 'my_jump.mp4' # Make sure this is the correct name of your video file in the project folder

cap = cv2.VideoCapture(VIDEO_FILE_PATH)

# Instructions for the user
print("--- Vertical Jump Analyzer ---")
print("1. A video window will open. Let it play.")
print("2. When you see a reference object (like an A4 paper), press 'c' to calibrate.")
print("3. When you see the athlete in the 'standing reach' pose, press 's' to save the reach height.")
print("4. Let the video of the jump play through. The highest point will be tracked automatically.")
print("5. Press 'q' to quit at any time. The final score will be calculated at the end.")

frame_height_for_calculation = None

if not cap.isOpened():
    print(f"Error: Could not open video file '{VIDEO_FILE_PATH}'")
else:
    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break

        if frame_height_for_calculation is None:
            frame_height_for_calculation = frame.shape[0]

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame_rgb.flags.writeable = False
        results = holistic.process(frame_rgb)
        frame.flags.writeable = True

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
            
        if key == ord('c'):
            reference_height_pixels = frame.shape[0] / 2 
            pixel_to_cm_ratio = A4_PAPER_HEIGHT_CM / reference_height_pixels
            print(f"[CALIBRATED] Pixel-to-CM ratio set to: {pixel_to_cm_ratio:.4f}")

        try:
            hand_landmarks = results.right_hand_landmarks.landmark
            
            # --- THIS IS THE CORRECTED LINE ---
            middle_finger_tip = hand_landmarks[mp_holistic.HandLandmark.MIDDLE_FINGER_TIP.value]
            current_finger_y = middle_finger_tip.y

            if key == ord('s'):
                standing_reach_y = current_finger_y
                print(f"[SAVED] Standing Reach Y-coordinate (normalized): {standing_reach_y:.4f}")

            jump_peak_y = min(jump_peak_y, current_finger_y)

        except:
            pass
        
        mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS)
        mp_drawing.draw_landmarks(frame, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
        mp_drawing.draw_landmarks(frame, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS)

        cal_status = "CALIBRATED" if pixel_to_cm_ratio else "Press 'c' to Calibrate"
        cv2.putText(frame, cal_status, (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        reach_status = "REACH SAVED" if standing_reach_y else "Press 's' for Standing Reach"
        cv2.putText(frame, reach_status, (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        cv2.imshow('Vertical Jump Analyzer', frame)

cap.release()

if standing_reach_y and pixel_to_cm_ratio and frame_height_for_calculation:
    jump_height_normalized = standing_reach_y - jump_peak_y
    if jump_height_normalized > 0:
        jump_height_pixels = jump_height_normalized * frame_height_for_calculation
        jump_height_cm = jump_height_pixels * pixel_to_cm_ratio
        
        print("\n--- JUMP ANALYSIS COMPLETE ---")
        print(f"Vertical Jump Score: {jump_height_cm:.2f} cm")

        final_screen = np.zeros((300, 800, 3), dtype="uint8")
        cv2.putText(final_screen, f"Vertical Jump: {jump_height_cm:.2f} cm", (50, 150), 
                    cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 3)
        cv2.imshow("Final Score", final_screen)
        cv2.waitKey(0)
    else:
        print("\n[INFO] Jump peak was not higher than standing reach. No score calculated.")
else:
    print("\n[ERROR] Could not calculate score. Ensure you calibrated ('c') and saved the standing reach ('s').")

cv2.destroyAllWindows()