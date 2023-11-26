web: echo "I don't want a web process"
service: npm start
echo ${GOOGLE_CREDENTIALS} > /app/google-credentials.json
