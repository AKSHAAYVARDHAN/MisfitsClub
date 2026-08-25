# Security Specification & Test Payloads

## 1. Data Invariants
1. **User Identity & Isolation**: A user document in `/users/{userId}` can only be created or written if `request.auth.uid == userId`. Users can update their profile information, but cannot spoof other users' profiles or change their user ID.
2. **Curiosity Board Integrity**: Any post created in `/boardPosts/{postId}` must have `authorId == request.auth.uid`. Authors can update or delete their own posts, and other authenticated members can increment/react to likes and reply counts.
3. **Connections Privacy**: Connection documents in `/connections/{connectionId}` can only be read or modified by participants (`requesterId == request.auth.uid` or `targetId == request.auth.uid`).
4. **Direct Messaging Security**: Messages in `/messages/{messageId}` require `senderId == request.auth.uid`, and only authenticated participants in that connection can write or read messages.

## 2. The Dirty Dozen Test Payloads
1. **Payload 01 (Spoof User Profile Creation)**: An attacker authenticated as `user_A` attempts to write to `/users/user_B`. (Must return PERMISSION_DENIED).
2. **Payload 02 (Oversized User Bio Attack)**: A user submits a bio exceeding 1000 characters to `/users/{userId}`. (Must return PERMISSION_DENIED).
3. **Payload 03 (Unauthenticated Board Post Creation)**: An unauthenticated client attempts to create a document in `/boardPosts/post_123`. (Must return PERMISSION_DENIED).
4. **Payload 04 (Board Post Author Spoofing)**: User `user_A` creates a board post with `authorId: 'user_B'`. (Must return PERMISSION_DENIED).
5. **Payload 05 (Oversized Board Post Body)**: A post containing >3000 chars payload. (Must return PERMISSION_DENIED).
6. **Payload 06 (Non-Author Board Post Deletion)**: User `user_B` attempts to delete post owned by `user_A`. (Must return PERMISSION_DENIED).
7. **Payload 07 (Unauthorized Connection Snooping)**: User `user_C` attempts to read `/connections/conn_AB` between `user_A` and `user_B`. (Must return PERMISSION_DENIED).
8. **Payload 08 (Connection Tampering by Outsider)**: User `user_C` attempts to update status on `/connections/conn_AB`. (Must return PERMISSION_DENIED).
9. **Payload 09 (Message Sender Spoofing)**: User `user_A` submits a message with `senderId: 'user_B'`. (Must return PERMISSION_DENIED).
10. **Payload 10 (Message Flooding / Massive Payload)**: Submitting a message text exceeding 4000 characters. (Must return PERMISSION_DENIED).
11. **Payload 11 (ID Injection Attack)**: Writing to a document with illegal characters or excessive ID length. (Must return PERMISSION_DENIED).
12. **Payload 12 (Ghost Field Privilege Escalation)**: Injecting system-level properties like `isAdmin: true` into a profile update. (Must return PERMISSION_DENIED).
