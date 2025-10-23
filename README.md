💬 Asklyy Anonymous Messaging API DocumentationThis API powers the Asklyy service, allowing users to create personal links to receive anonymous messages.Base URLThe base URL for all endpoints is https://asklyy.vercel.app/.Security & AuthenticationEndpoints marked (PRIVATE) require Basic HTTP Authentication in the request header using the username and password used during link creation.Header Format: Authorization: Basic [base64_encoded(username:password)]Endpoints1. Create Link (Register)Creates a new user account and generates a unique, public link ID.MethodPathAccessPOST/api/createlinkPUBLICRequest Body (application/json):FieldTypeDescriptionusernamestringUnique username for account login.passwordstringPassword for account login.Example Response (201 Created):{
  "success": true,
  "linkId": "kwnynvi",
  "message": "Link created successfully"
}
2. Send MessageAllows anyone to send a message to a registered link ID.MethodPathAccessPOST/api/sendmessagesPUBLICRequest Body (application/json):FieldTypeDescriptionlinkIdstringThe unique ID of the target recipient. (Required)namestringThe name of the sender (optional, defaults to "Anonymous").textstringThe content of the message. (Required)Example Response (201 Created):{
  "success": true,
  "message": {
    "messageId": "p8t0lmge5b3q",
    "linkId": "kwnynvi",
    "name": "TestSender",
    "text": "Hello! This is a test message.",
    "createdAt": "2025-10-23T07:00:00.000Z"
  }
}
3. Get All MessagesRetrieves all messages sent to a specific link ID. Requires Authentication.MethodPathAccessGET/api/getmessagesPRIVATEQuery Parameters:ParameterDescriptionlinkIdThe unique ID whose messages are being requested.Example curl Request:curl -u "makkitest3:12345" "[https://asklyy.vercel.app/api/getmessages?linkId=kwnynvi](https://asklyy.vercel.app/api/getmessages?linkId=kwnynvi)"
Example Response (200 OK):{
  "success": true,
  "messages": [
    { "messageId": "p8t0lmge5b3q", "name": "TestSender", "text": "...", "createdAt": "..." },
    // ... more messages
  ]
}
4. Delete Single MessageDeletes a specific message associated with the authenticated user's link. Requires Authentication.MethodPathAccessPOST/api/dltmessagePRIVATERequest Body (application/json):FieldTypeDescriptionlinkIdstringThe owner's unique link ID. (Must match authenticated user's ID)messageIdstringThe ID of the message to be deleted.Example curl Request:curl -X POST -u "makkitest3:12345" \
     -H "Content-Type: application/json" \
     -d "{\"linkId\":\"kwnynvi\",\"messageId\":\"p8t0lmge5b3q\"}" \
     "[https://asklyy.vercel.app/api/dltmessage](https://asklyy.vercel.app/api/dltmessage)"
Example Response (200 OK):{
  "success": true,
  "message": "Message deleted successfully"
}
5. Delete Link (Account Deletion)Deletes the user account and ALL associated messages. Requires Authentication.MethodPathAccessPOST/api/dltlinkPRIVATERequest Body (application/json):FieldTypeDescriptionlinkIdstringThe unique link ID to be deleted. (Must match authenticated user's ID)Example curl Request:curl -X POST -u "makkitest3:12345" \
     -H "Content-Type: application/json" \
     -d "{\"linkId\":\"kwnynvi\"}" \
     "[https://asklyy.vercel.app/api/dltlink](https://asklyy.vercel.app/api/dltlink)"
Example Response (200 OK):{
  "success": true,
  "message": "Link kwnynvi and 2 associated messages deleted successfully."
}
