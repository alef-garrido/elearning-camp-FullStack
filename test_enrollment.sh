#!/bin/bash

# Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@gmail.com","password":"123456"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: $TOKEN"

# Test enrollment status
COURSE_ID="5d7a514b5d2c12c7449be045"
echo -e "\nTesting enrollment status for course: $COURSE_ID"

STATUS_RESPONSE=$(curl -s -X GET "http://localhost:5000/api/v1/courses/$COURSE_ID/enrollment-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response: $STATUS_RESPONSE"

# Parse enrolled value
ENROLLED=$(echo $STATUS_RESPONSE | grep -o '"enrolled":[^,}]*' | cut -d':' -f2)
echo -e "\nEnrolled value: $ENROLLED"
echo "Type check - should be 'true' or 'false': $(echo $ENROLLED | grep -E 'true|false')"
