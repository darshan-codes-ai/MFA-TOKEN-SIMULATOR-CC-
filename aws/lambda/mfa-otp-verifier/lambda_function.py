import json
import boto3

iot_client = boto3.client("iot-data")

EXPECTED_DEVICE_ID = "mfa-token-simulator"
RESULT_TOPIC = "mfa/result"


def lambda_handler(event, context):
    device_id = event.get("deviceId", "")
    otp = str(event.get("otp", ""))
    expected_otp = str(event.get("expectedOtp", ""))
    correlation_id = event.get("correlationId", "")
    action = event.get("action", "VERIFY")

    verified = True
    reason = "OK"

    if device_id != EXPECTED_DEVICE_ID:
        verified = False
        reason = "UNKNOWN_DEVICE"
    elif action == "GENERATE":
        verified = True
        reason = "OTP_GENERATED"
    elif not (otp.isdigit() and len(otp) == 6):
        verified = False
        reason = "MALFORMED_OTP"
    elif otp != expected_otp:
        verified = False
        reason = "OTP_MISMATCH"

    result = {
        "deviceId": device_id,
        "otp": otp,
        "verified": verified,
        "reason": reason,
        "correlationId": correlation_id,
        "action": action,
    }

    print("Verification result:", json.dumps(result))

    iot_client.publish(
        topic=RESULT_TOPIC,
        qos=0,
        payload=json.dumps(result).encode("utf-8"),
    )

    return result
