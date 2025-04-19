To run our app follow these steps:
1. CD into the typeracefolder
2. run npm install
3. Create an .env file in the coderacer directory
4. Create 3 variables with the following names and values:
 - VITE_GEMINI_KEY
    - obtain this by generating a Google Gemini API key
    - This should be a mix of numbers as well as upper and lower case letters
 - VITE_GOOGLE_CLIENT_ID
    - obtain this by generating a Google OAuth 2.0 Client ID
    - This should be a long string of numbers and letters ending with ".apps.googleusercontent.com"
 - VITE_FIREBASE_CONFIG
    - obtain this by creating a Firestore database and locating the given config settings
    - Please format the config settings into the following format:
    '{"apiKey":"???",
    "authDomain":"???
    ","projectId":"???",
    "storageBucket":"???",
    "messagingSenderId":"???",
    "appId":"???", 
    "measurementId":"???"}'
5. Alternatively to step 4, you can emial us at sozinsky@uw.edu or droser@uw.edu and we will provide you with the .env file, if we like you
6. Run npm run dev to start the app and navigate to http://localhost:5173/ to view the app in action

** hosting coming soon **
