# User Story: Reportar Publicación

## General Information
- **Sprint**: Sprint 3
- **Project**: UCR Connect
- **Team**: Desarrollo Mobile
- **Technology**: Flutter

---

## User Story Details
**Name**: Reportar Publicación de Usuario  
**As a** user of the mobile application,  
**I want to** report another user's post,  
**So that** I can inform about inappropriate content or community guideline violations.

---

## Acceptance Criteria
1. Implement a modal/popup with post options.
2. Include a "Report" button in the modal.
3. Validate that users cannot report their own posts.
4. Send the following data to the backend:
   - Reported post
   - Post author
   - Reporting user
5. Notify the user of the result:
   - **Success**: "Post reported"
   - **Error**: "Error reporting" or "You have already reported this post"
6. Automatically hide the reported post (if the report is successful).
7. Follow the established format for backend communication.

---

## Related Functional Requirements
- **RF20**: Administrators must be able to review reported content.

---

## Relevant Non-Functional Requirements
- **RNF3**: Response time < 2 seconds.
- **RNF7**: Protection against XSS/CSRF attacks.
- **RNF18**: Intuitive UI (Material Design).
- **RNF21**: Responsive design.
- **RNF24**: 80% test coverage.

---

## Use Case: Reportar Publicación
**Name**: Report Content  
**Actor**: Registered User  
**Precondition**: Post visible in the feed  

### Main Flow
1. User opens post options.
2. Selects "Report".
3. System sends the report to the backend.
4. Backend validates and registers the report.
5. System notifies the user of the result.
6. Locally hides the post.

### Alternative Flows
- **Duplicate Report**: Notify "You have already reported this post".
- **Connection Error**: Show "Error reporting, try again later".
- **Own Post**: Hide the report option.

---

## Preconditions
- User is authenticated.
- Post is visible in the feed.
- Post is not the user's own.

---

## Postconditions
- Report is registered in the system (if successful).
- Post is locally hidden (if successful).
- Visual feedback is provided to the user.

---

## Endpoint Specification: Report User Post

### Endpoint Details
- **Method**: POST
- **URL**: `/api/posts/report`
- **Headers**:
  - `Authorization`: Bearer `<JWT_TOKEN>`
  - `Content-Type`: application/json
- **Request Body**:
  ```json
  {
    "postId": "string (UUID)",
    "reason": "string",
    "reportedBy": "string (UUID)"
  }
  ```
- **Responses**:
  - **200 OK**:
    ```json
    {
      "message": "Report has been successfully saved"
    }
    ```
  - **400 Bad Request**:
    ```json
    {
      "message": "Validation error",
      "errors": ["error details"]
    }
    ```
  - **500 Internal Server Error**:
    ```json
    {
      "message": "Failed to report the post."
    }
    ```


## Additional Resources
- ![Sequence Diagram](https://t9013818188.p.clickup-attachments.com/t9013818188/0b8b0688-068c-4bb5-970c-6f74b16130cf/image.png)
- ![Flow Diagram](https://t9013818188.p.clickup-attachments.com/t9013818188/18b6c690-d379-41f4-bbb7-8fb460851aa6/image.png)