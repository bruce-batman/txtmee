
# Secret Message API

A serverless API (Node.js, Express style) for anonymous secret messages, deployed on Vercel.

## Features
- Generate secret message link with username and password
- Receive anonymous questions/messages
- Optional name for question sender
- All messages saved in `data/messages.json`
- Messages can be deleted (with authentication)

## API Endpoints

### Create Secret Link
- `POST /api/create-link`
- Body: `{ "username": "yourname", "password": "yourpassword" }`
- Returns: `{ linkId, username, secretLink }`

### Send Message
- `POST /api/send-message?linkId=...`
- Body: `{ "askerName": "...", "question": "..." }`
- askerName optional, question required

### Get All Messages (Authentication Required)
- `GET /api/get-messages?linkId=...`
- Basic Auth header with username/password

### Delete Message (Authentication Required)
- `DELETE /api/delete-message?linkId=...&messageId=...`
- Basic Auth header with username/password

## Deploy/Run

- Fork or clone repository
- Install dependencies: `npm install`
- Run locally: `vercel dev`
- Deploy: `vercel --prod`

### JSON File Storage Notice
- All data stored in `data/messages.json`
- On Vercel, writing to files is **not persistent**. For real production storage, use a database.
