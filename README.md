💬 Asklyy Anonymous Messaging API Documentation This API powers the
Asklyy service, allowing users to create personal links to receive
anonymous messages.

## Base URL

The base URL for all endpoints is `https://asklyy.vercel.app/`.

## Security & Authentication

Endpoints marked **(PRIVATE)** require Basic HTTP Authentication in the
request header using the username and password used during link
creation.

**Header Format:**\
`Authorization: Basic [base64_encoded(username:password)]`

------------------------------------------------------------------------

## Endpoints

### 1. Create Link (Register)

Creates a new user account and generates a unique, public link ID.

**Method:** `POST`\
**Path:** `/api/createlink`\
**Access:** PUBLIC

**Request Body (application/json):** \| Field \| Type \| Description \|
\|--------\|------\|-------------\| \| username \| string \| Unique
username for account login. \| \| password \| string \| Password for
account login. \|

**Example Response (201 Created):**

``` json
{
  "success": true,
  "linkId": "kwnynvi",
  "message": "Link created successfully"
}
```

------------------------------------------------------------------------

### 2. Send Message

Allows anyone to send a message to a registered link ID.

**Method:** `POST`\
**Path:** `/api/sendmessages`\
**Access:** PUBLIC

**Request Body (application/json):** \| Field \| Type \| Description \|
\|--------\|------\|-------------\| \| linkId \| string \| The unique ID
of the target recipient. (Required) \| \| name \| string \| The name of
the sender (optional, defaults to "Anonymous"). \| \| text \| string \|
The content of the message. (Required) \|

**Example Response (201 Created):**

``` json
{
  "success": true,
  "message": {
    "messageId": "p8t0lmge5b3q",
    "linkId": "kwnynvi",
    "name": "TestSender",
    "text": "Hello! This is a test message.",
    "createdAt": "2025-10-23T07:00:00.000Z"
  }
}
```

------------------------------------------------------------------------

### 3. Get All Messages

Retrieves all messages sent to a specific link ID. Requires
Authentication.

**Method:** `GET`\
**Path:** `/api/getmessages`\
**Access:** PRIVATE

**Query Parameters:** \| Parameter \| Description \|
\|------------\|-------------\| \| linkId \| The unique ID whose
messages are being requested. \|

**Example curl Request:**

``` bash
curl -u "makkitest3:12345" "https://asklyy.vercel.app/api/getmessages?linkId=kwnynvi"
```

**Example Response (200 OK):**

``` json
{
  "success": true,
  "messages": [
    { "messageId": "p8t0lmge5b3q", "name": "TestSender", "text": "...", "createdAt": "..." }
  ]
}
```

------------------------------------------------------------------------

### 4. Delete Single Message

Deletes a specific message associated with the authenticated user's
link. Requires Authentication.

**Method:** `POST`\
**Path:** `/api/dltmessage`\
**Access:** PRIVATE

**Request Body (application/json):** \| Field \| Type \| Description \|
\|--------\|------\|-------------\| \| linkId \| string \| The owner's
unique link ID. (Must match authenticated user's ID) \| \| messageId \|
string \| The ID of the message to be deleted. \|

**Example curl Request (Unix/PowerShell):**

``` bash
curl -X POST -u "makkitest3:12345"      -H "Content-Type: application/json"      -d '{"linkId":"kwnynvi","messageId":"p8t0lmge5b3q"}'      "https://asklyy.vercel.app/api/dltmessage"
```

**Example Response (200 OK):**

``` json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

------------------------------------------------------------------------

### 5. Delete Link (Account Deletion)

Deletes the user account and ALL associated messages. Requires
Authentication.

**Method:** `POST`\
**Path:** `/api/dltlink`\
**Access:** PRIVATE

**Request Body (application/json):** \| Field \| Type \| Description \|
\|--------\|------\|-------------\| \| linkId \| string \| The unique
link ID to be deleted. (Must match authenticated user's ID) \|

**Example curl Request (Unix/PowerShell):**

``` bash
curl -X POST -u "makkitest3:12345"      -H "Content-Type: application/json"      -d '{"linkId":"kwnynvi"}'      "https://asklyy.vercel.app/api/dltlink"
```

**Example Response (200 OK):**

``` json
{
  "success": true,
  "message": "Link kwnynvi and 2 associated messages deleted successfully."
}
```
