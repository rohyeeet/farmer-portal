# Varaha Farmer Portal
## End-to-End Functional, UX, Frontend, and Backend Specification

## 1. Purpose

This document defines the complete implementation specification for the new Varaha Farmer Portal based on:

- the updated business requirements shared in this thread
- the updated prototype code from [farmer-portal (1).zip](/Users/mac/Downloads/farmer-portal%20(1).zip)
- the whiteboard reference flow shared in the image
- the broader Varaha / Vann product context around farmer, farm, kyaari, CRA, FPIC, Aadhaar eKYC, and bank account verification

This document is intended to be detailed enough to drive implementation via engineering directly, including through Claude Code.

## 2. Source of Truth

The source of truth for this version is:

1. your latest written flow requirements
2. the updated prototype in `farmer-portal (1).zip`
3. the whiteboard flow image where backend sequence and branching were refined

If any older documentation differs from the above, this document should be treated as the updated implementation reference.

## 3. Product Objective

The Farmer Portal is a multilingual, authenticated, mobile-first web experience where a farmer can:

- log in using their registered mobile number
- verify identity using OTP
- confirm that the profile retrieved from Varaha is theirs
- complete Aadhaar eKYC if required
- complete or correct bank account verification if required
- view their farms and kyaaris
- view legal and project-related documents
- understand verification and consent statuses
- access FAQs and support
- receive system notifications on verification progress and outcomes

The product is intentionally trust-first and gated. Until identity verification requirements are adequately completed, the farmer should be able to browse limited information but should not be allowed to perform deeper actions such as viewing legally restricted content or proceeding through unlocked downstream registry experiences.

## 4. Updated High-Level Journey

The whiteboard flow and updated prototype together imply the following sequence:

1. Farmer enters registered mobile number
2. System validates number format on frontend
3. System validates mobile existence on backend
4. OTP is sent through AWS messaging
5. Farmer enters OTP
6. Login is verified
7. System fetches a consolidated farmer bootstrap response
8. Bootstrap response returns:
   - farmer details
   - consent / farmer identity confirmation status
   - Aadhaar eKYC status
   - bank verification status
   - farm list summary
9. If verification remediation is required, user is routed through:
   - profile confirmation
   - Aadhaar eKYC
   - BAV flow if applicable
10. Once submitted, statuses become `IN_PROGRESS`
11. User returns to home and can browse farms, documents, notifications, support, and profile with gating rules applied

## 5. Updated System Architecture View

At a high level, the system has four layers:

### 5.1 Presentation Layer

- React + TypeScript frontend
- mobile-first responsive experience
- route-based flow
- i18n-based language switching

### 5.2 Portal Backend / BFF Layer

A backend-for-frontend service should aggregate and normalize responses for the farmer portal. This service should:

- validate login OTP sessions
- provide bootstrap response
- orchestrate Aadhaar eKYC initiation and verification
- orchestrate bank verification initiation/update
- expose farm, kyaari, and document summaries
- expose notification and support data

### 5.3 Core Domain Services

These may already exist in Varaha backend or need explicit integration:

- farmer profile service
- farm and kyaari service
- document registry service
- consent / CRA / FPIC service
- eKYC service
- bank account verification service
- notifications service

### 5.4 External Integrations

- AWS for OTP messaging
- Aadhaar eKYC provider / workflow
- BAV provider / workflow
- Google Maps for polygon rendering

## 6. Product-Wide Rules

### 6.1 Login Rule

Only a farmer’s registered mobile number can be used to log in.

### 6.2 Indian Mobile Validation Rule

Frontend must validate Indian mobile number syntax before calling the backend.

Recommended regex:

```txt
^[6-9]\d{9}$
```

API transport should use normalized E.164:

```txt
+91XXXXXXXXXX
```

### 6.3 Language Rule

Language selection must be available on login and persist across the entire portal.

Current language set:

- English
- Hindi
- Kannada
- Tamil

The UI control must be a dropdown because more languages will be added later.

### 6.4 Verification Gating Rule

If Aadhaar eKYC or BAV status is:

- `MISSING`
- `REJECTED`

then the portal must prominently ask the farmer to complete verification.

If either status is:

- `IN_PROGRESS`

the user should be informed that verification is underway and additional modification capabilities remain blocked until completion.

### 6.5 Legal Document Access Rule

CRA / FPIC viewing must remain gated by Aadhaar eKYC completion. Until Aadhaar eKYC is accepted, the farmer should not be able to view final legal documents.

### 6.6 Bank Verification Visibility Rule

If BAV status is `ACCEPTED`, the BAV remediation flow should not be shown.

### 6.7 Aadhaar Flow Visibility Rule

If Aadhaar eKYC status is `ACCEPTED`, the Aadhaar remediation flow and banner should not be shown.

## 7. Recommended Frontend Architecture

The updated prototype still uses a custom React language context. For production implementation, use:

- `react-i18next`
- `react-router-dom`
- `@tanstack/react-query`
- `react-hook-form`
- `zod`

This is preferred because the app now has:

- more branching
- asynchronous status checks
- multiple screens dependent on backend state
- several user inputs needing validation
- persistent localization needs

## 8. Updated Route Map

Recommended production route structure:

- `/login`
- `/login/otp`
- `/onboarding/claim`
- `/onboarding/ekyc-intro`
- `/onboarding/ekyc-otp`
- `/onboarding/bav-intro`
- `/onboarding/bav-form`
- `/onboarding/bav-mismatch`
- `/onboarding/success`
- `/`
- `/farm/:farmId`
- `/document/:id`
- `/notifications`
- `/support`
- `/profile`

The current prototype keeps onboarding inside one page-level component with internal step state. That is acceptable short term, but route-separation is recommended for production for observability, recoverability, and deep-link debugging.

## 9. Status Definitions

### 9.1 Aadhaar eKYC

- `MISSING`
- `PENDING`
- `IN_PROGRESS`
- `ACCEPTED`
- `REJECTED`

### 9.2 Bank Account Verification

- `MISSING`
- `PENDING`
- `IN_PROGRESS`
- `ACCEPTED`
- `REJECTED`

### 9.3 Farmer Identity Confirmation

- `NOT_CONFIRMED`
- `CONFIRMED`

### 9.4 CRA / FPIC Document State

- `SKELETON_ONLY`
- `GENERATING`
- `GENERATED`
- `GENERATED_SIGNED`
- `REJECTED`

### 9.5 Farm Eligibility / Document Status

- `ACCEPTED`
- `PENDING`
- `REJECTED`

### 9.6 Kyaari Verification Status

- `ACCEPTED`
- `PENDING`
- `REJECTED`

## 10. Bootstrap API Principle

The whiteboard clearly points toward a consolidated bootstrap response after login. Instead of forcing the frontend to independently call multiple APIs before deciding the next flow, the backend should expose one primary bootstrap endpoint that returns the minimum required top-level state.

That bootstrap should include:

- farmer profile summary
- identity confirmation status
- Aadhaar eKYC status
- BAV status
- masked Aadhaar
- masked bank account
- farms summary
- region details
- any blocking or gating reason

This one response should determine whether the user lands directly on home or is routed through remediation.

## 11. End-to-End Screen Specification

Below, every wireframe is shown as a full-screen layout rather than a partial component sketch.

---

## Screen 1: Login - Mobile Entry

### Purpose

Allow the farmer to start login using their registered mobile number.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
|                                                              |
|                         VARAHA LOGO                           |
|                                                              |
|                       VARAHA PORTAL                           |
|          Login to verify identity and access documents        |
|                                                              |
|                    [ Language: English v ]                   |
|                                                              |
|  Registered Mobile Number                                    |
|  +91 [______________________________]                        |
|                                                              |
|  [ Send OTP ]                                                |
|                                                              |
|                                                              |
|                                                              |
|                                                              |
|                 VERIFIED SECURE ACCESS                       |
|                                                              |
+--------------------------------------------------------------+
```

### UI Requirements

- centered logo and heading
- language dropdown near top or just below heading
- mobile input with `+91` prefix
- strong primary CTA
- subtle footer line indicating secure access

### Validation

- allow only digits in the input
- hard max length = 10
- must begin with 6, 7, 8, or 9
- invalid input should show inline message, not only toast/alert

### Frontend Behavior

- button disabled until input is syntactically valid
- on submit:
  - call backend to validate mobile and send OTP
- response must return:
  - `otp_request_id`
  - resend cooldown
  - masked mobile echo if needed

### Backend API

`POST /api/v1/farmer-auth/send-otp`

Request:

```json
{
  "mobileNumber": "+919876523410"
}
```

Response:

```json
{
  "success": true,
  "otpRequestId": "otp_req_123",
  "maskedMobileNumber": "+91 98XXXXXX10",
  "otpLength": 6,
  "resendCooldownSeconds": 45
}
```

Error cases:

- farmer not found
- farmer inactive
- OTP rate limit exceeded

---

## Screen 2: Login - OTP Verification

### Purpose

Verify the OTP sent to the farmer’s mobile number.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
|                                                              |
|                         VARAHA LOGO                           |
|                                                              |
|                     Verify & Login                            |
|                                                              |
|          OTP sent to +91 98XXXXXX10                          |
|                                                              |
|               [ _ _ _ _ _ _ ]                                |
|                                                              |
|                Resend OTP in 00:45                           |
|                                                              |
|  [ Verify & Login ]                                          |
|  [ Back to Mobile ]                                          |
|                                                              |
|                                                              |
|                                                              |
+--------------------------------------------------------------+
```

### Behavior

- 6-digit OTP for current release
- input only numeric
- verify button enabled only when six digits are entered
- if valid:
  - backend verifies OTP
  - backend returns access token/session
  - frontend calls bootstrap API
- on failure:
  - show inline invalid OTP
- support resend based on cooldown and attempt count

### Backend APIs

`POST /api/v1/farmer-auth/verify-otp`

```json
{
  "otpRequestId": "otp_req_123",
  "otp": "123456"
}
```

`POST /api/v1/farmer-auth/resend-otp`

```json
{
  "otpRequestId": "otp_req_123"
}
```

Verify response:

```json
{
  "success": true,
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "farmerId": "farmer_123"
}
```

---

## Screen 3: Post-Login Bootstrap Decision

### Purpose

Immediately after OTP verification, determine what the farmer should see next.

### Logic

Call:

`GET /api/v1/farmers/me/bootstrap`

Expected response:

```json
{
  "farmerId": "farmer_123",
  "preferredLanguage": "kn",
  "identityConfirmed": false,
  "ekycStatus": "REJECTED",
  "bavStatus": "MISSING",
  "maskedAadhaar": "XXXX XXXX 1234",
  "maskedBankAccountNumber": "XXXXXXXX5567",
  "farmerProfile": {
    "name": "Shreenath Raman Sangvikar",
    "profilePhotoUrl": "https://...",
    "mobileNumber": "+919876523410",
    "region": {
      "state": "Maharashtra",
      "district": "Latur",
      "block": "Ahmedpur"
    }
  },
  "farmsSummary": {
    "count": 3
  }
}
```

### Route Decision

- if both eKYC and BAV are accepted and identity already confirmed -> home
- else -> onboarding claim screen

This consolidated bootstrap aligns with both your written requirement and the whiteboard note showing a single farmer details payload being used to derive multiple downstream UI states.

---

## Screen 4: Claim Profile / Confirm Farmer Details

### Purpose

Show the profile details currently stored in Varaha and ask the farmer to confirm whether the details belong to them.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
|                                                              |
|                        VARAHA LOGO                            |
|                                                              |
|                       Is this you?                            |
|         Confirm these details to proceed with verification    |
|                                                              |
|                    [Farmer Photo]                             |
|                                                              |
|               Shreenath Raman Sangvikar                      |
|                     +91 98765 23410                          |
|                                                              |
|  ----------------------------------------------------------  |
|  Location                                                     |
|  Ahmedpur, Latur, Maharashtra                                 |
|  ----------------------------------------------------------  |
|  Aadhaar (Masked)                                             |
|  XXXX XXXX 1234                                               |
|  ----------------------------------------------------------  |
|                                                              |
|  [ I confirm it's my details ]                               |
|  [ Wrong details ]                                           |
|                                                              |
+--------------------------------------------------------------+
```

### Behavior

- primary CTA confirms identity and records that the farmer has acknowledged the retrieved profile
- secondary CTA is frozen for this release
- if user taps primary:
  - create identity confirmation record
  - create corresponding notification
  - continue to Aadhaar eKYC unless already accepted

### CTA Copy

- Primary: `I confirm it's my details`
- Secondary: `Wrong details`

### Backend APIs

`GET /api/v1/farmers/me/profile`

`POST /api/v1/farmers/me/identity-confirmation`

Request:

```json
{
  "confirmed": true,
  "source": "farmer_portal"
}
```

Response:

```json
{
  "success": true,
  "identityConfirmed": true
}
```

---

## Screen 5: Aadhaar eKYC Intro

### Purpose

Explain in simple, farmer-friendly language why Aadhaar verification is needed.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
|  < Back                                                      |
|                                                              |
|                [ Identity Verification Illustration ]        |
|                                                              |
|                     Aadhaar eKYC                             |
|                                                              |
|   This confirms your identity and secures official           |
|   agreements and project-linked records.                     |
|                                                              |
|   [✓] Legal compliance for project registry                  |
|   [✓] Direct payout security                                 |
|                                                              |
|  [ Proceed with Aadhaar ]                                    |
|                                                              |
+--------------------------------------------------------------+
```

### Behavior

- purely educational
- localized content only
- proceed CTA moves to OTP + consent screen

No backend call required on this screen.

---

## Screen 6: Aadhaar eKYC OTP and Consent

### Purpose

Allow the farmer to confirm consent and submit Aadhaar-linked OTP verification.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
|  < Back                                                      |
|                                                              |
|                     Verify Identity                           |
|                                                              |
|  OTP sent to Aadhaar-linked mobile for                       |
|  XXXX XXXX 1234                                              |
|                                                              |
|               [ _ _ _ _ _ _ ]                                |
|                                                              |
|  [ ] I consent to Aadhaar verification as the owner         |
|      of this mobile number.                                  |
|                                                              |
|  [ Confirm & Verify ]                                        |
|                                                              |
|                                                              |
+--------------------------------------------------------------+
```

### Behavior

- consent checkbox mandatory
- OTP input mandatory
- verify CTA enabled only when:
  - 6 digits entered
  - consent checkbox checked
- on submit:
  - initiate or complete Aadhaar verification request
  - store consent version and timestamp

### Suggested Backend Flow

To align with the whiteboard, use a request-ID based flow:

1. initiate eKYC request
2. receive `ekyc_request_id`
3. verify OTP against that request

### Backend APIs

`POST /api/v1/farmers/me/ekyc/initiate`

Request:

```json
{
  "consentAccepted": true,
  "consentVersion": "v1"
}
```

Response:

```json
{
  "success": true,
  "ekycRequestId": "ekyc_req_123",
  "maskedAadhaar": "XXXX XXXX 1234",
  "maskedLinkedMobile": "+91 98XXXXXX10"
}
```

`POST /api/v1/farmers/me/ekyc/verify-otp`

Request:

```json
{
  "ekycRequestId": "ekyc_req_123",
  "otp": "123456"
}
```

Response:

```json
{
  "success": true,
  "ekycStatus": "IN_PROGRESS",
  "message": "Status will be updated shortly"
}
```

### Important Product Rule

Once OTP is submitted successfully, do not promise instant success. The UI should explicitly state that the status will update in a few minutes.

---

## Screen 7: BAV Intro

### Purpose

Explain why bank account verification is needed before the farmer proceeds into account confirmation.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
|                                                              |
|                [ Bank Verification Illustration ]            |
|                                                              |
|                    Bank Verification                         |
|                                                              |
|   This ensures payouts reach the correct account.            |
|                                                              |
|   Account holder name must match your Aadhaar name.          |
|                                                              |
|  [ Review Account ]                                          |
|                                                              |
+--------------------------------------------------------------+
```

### Behavior

- show only when BAV is not accepted
- this is not shown at all if BAV status is already `ACCEPTED`

---

## Screen 8: BAV Form - Existing Account Confirmation

### Purpose

Show the farmer the stored bank account reference and ask them to confirm the actual account details.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
|                     Confirm Account                          |
|                                                              |
|  Verification for State Bank of India                        |
|                                                              |
|  Registered Account (Reference)                              |
|  •••• •••• 5567                                              |
|  Must match last 4 digits                                    |
|                                                              |
|  Bank IFSC Code                                               |
|  [____________________]                                      |
|                                                              |
|  Account Number                                               |
|  [____________________]                                      |
|                                                              |
|  Re-enter Account Number                                      |
|  [____________________]                                      |
|                                                              |
|  [ Verify Account ]                                          |
|                                                              |
+--------------------------------------------------------------+
```

### Behavior

- IFSC required in current prototype
- account number and re-entry must both be numeric
- if both numbers match and align with stored reference, proceed to success
- if they do not match expected account, route to mismatch screen

### Backend Note

The whiteboard indicates a bank verification service layer with validation logic and different branches for:

- verified = true
- verified = false

So backend should expose a single validation action that determines whether the re-entered values match the stored bank details or require the update path.

### Backend API

`POST /api/v1/farmers/me/bav/validate`

Request:

```json
{
  "ifscCode": "SBIN0001234",
  "accountNumber": "123456789012",
  "reEnteredAccountNumber": "123456789012"
}
```

Success-like response:

```json
{
  "success": true,
  "matchesRegisteredAccount": true,
  "bavStatus": "IN_PROGRESS"
}
```

Mismatch-like response:

```json
{
  "success": true,
  "matchesRegisteredAccount": false,
  "nextStep": "UPDATE_ACCOUNT"
}
```

---

## Screen 9: BAV Mismatch

### Purpose

Show the farmer that the entered bank details do not match and offer two next steps.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
|                                                              |
|                     Details Mismatch                         |
|                                                              |
|  The details entered do not match our records.               |
|  You can re-check them or provide another bank account       |
|  with a passbook image.                                      |
|                                                              |
|  [ Re-check & Correct ]                                      |
|                                                              |
|                         OR                                    |
|                                                              |
|  [ Provide Other Bank Account ]                              |
|                                                              |
+--------------------------------------------------------------+
```

### Behavior

- re-check sends user back to confirmation form
- provide other bank account sends user to new account update mode

---

## Screen 10: BAV Form - New Account Update Path

### Purpose

Allow the farmer to submit a new bank account and passbook image if the stored one is incorrect or no longer valid.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
|                    Update Bank Details                       |
|                                                              |
|  Bank IFSC Code                                              |
|  [____________________]                                      |
|                                                              |
|  New Account Number                                          |
|  [____________________]                                      |
|                                                              |
|  Re-enter Account Number                                     |
|  [____________________]                                      |
|                                                              |
|  Upload Passbook Image                                       |
|  [ Choose File ]                                             |
|                                                              |
|  [ Submit Updated Bank Details ]                             |
+--------------------------------------------------------------+
```

### Behavior

- both entered account numbers must match
- passbook image mandatory
- file validation:
  - allowed formats: jpg, jpeg, png, pdf if desired
  - max size configurable
- after submit:
  - BAV status becomes `IN_PROGRESS`
  - success screen shown

### Backend API

`POST /api/v1/farmers/me/bav/update`

Multipart request:

- `ifscCode`
- `accountNumber`
- `reEnteredAccountNumber`
- `passbookImage`

Response:

```json
{
  "success": true,
  "bavStatus": "IN_PROGRESS",
  "maskedBankAccountNumber": "XXXXXXXX9012"
}
```

---

## Screen 11: Verification Success / Submission Complete

### Purpose

Tell the farmer that the latest verification request has been submitted and they will be notified when status updates.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
|                                                              |
|                       [ Success Icon ]                       |
|                                                              |
|                  Submission Success                          |
|                                                              |
|  Your verification status will be notified to you            |
|  in a few minutes.                                           |
|                                                              |
|  [ Go to Dashboard ]                                         |
|                                                              |
+--------------------------------------------------------------+
```

### Behavior

- on click, return to home
- frontend should create/update notification state for:
  - Aadhaar eKYC submitted
  - BAV submitted

---

## Screen 12: Home / Registry Dashboard

### Purpose

Provide the farmer with a top-level portal dashboard including quick actions, a verification banner if needed, and a list of farms.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
| Header:                                                       |
| Varaha Portal                                                 |
| Hello, Farmer Name                                            |
| [ Language v ]                                                |
|                                                              |
| Quick Actions Grid                                           |
| [Profile] [Alerts] [Support] [My Farms]                      |
|                                                              |
| [Verification Required Banner, if applicable]                |
| Complete Aadhaar & Bank Verification for registry access     |
| [ Verify Now ]                                               |
|                                                              |
| My Registry                                                  |
| ----------------------------------------------------------   |
| Farm Card 1                                                  |
| Name                                                         |
| 12 Kyaari Units • Plantation                                |
| Eligibility: Accepted                                        |
| Consent: Pending                                             |
| ----------------------------------------------------------   |
| Farm Card 2                                                  |
| ...                                                          |
|                                                              |
| Registry Help CTA                                            |
| [ Support ]                                                  |
|                                                              |
+--------------------------------------------------------------+
```

### Data Required

Each farm card should show:

- farm name
- number of kyaaris
- project type
- farm eligibility / document status
- CRA consent status

### Behavior

- quick actions:
  - Profile
  - Notifications
  - Support
  - Scroll to farms
- verification banner shown when eKYC or BAV is missing/rejected
- if statuses are in progress, banner messaging should change to informational rather than action-blocking

### Backend API

`GET /api/v1/farmers/me/farms`

Response:

```json
{
  "farms": [
    {
      "farmId": "farm_1",
      "farmName": "Green Acres Plantation",
      "kyaariCount": 12,
      "projectType": "PLANTATION",
      "farmEligibilityStatus": "ACCEPTED",
      "craConsentStatus": "PENDING"
    }
  ]
}
```

---

## Screen 13: Farm Detail

### Purpose

Display full farm-level context including map, farm imagery, onboarding metadata, kyaari modules, and legal registry.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
| Header: Farm Name / Farm ID                                  |
|                                                              |
| Swipable Top Visual Section                                  |
| [ Slide 1: Interactive Google Map with farm polygon ]        |
| [ Slide 2: Farm Ground Image ]                               |
| [ Enlarge/Minimize Map ]                                     |
|                                                              |
| Mapping Mode                                                 |
| Boundary: 4.5 Acres                                          |
|                                                              |
| Farm Onboarding Intel                                        |
| Onboarding Date: 12 March 2024                               |
| Onboarded By: Rahul Deshmukh                                 |
| Organisation: Varaha Climate Services                        |
|                                                              |
| Kyaari Modules                                               |
| Section A1 | 120 Trees | 0.8 Ac | Accepted                   |
| Section A2 | 185 Trees | 1.2 Ac | Pending                    |
| Section B1 | 75 Trees  | 0.5 Ac | Accepted                   |
|                                                              |
| Legal Registry                                               |
| Digital Consents                                             |
| CRA  | Generated | >                                         |
| FPIC | Pending   | >                                         |
|                                                              |
| Documentation                                                |
| Land Ownership Document | Accepted | >                       |
| Aadhaar Card             | Rejected | >                      |
+--------------------------------------------------------------+
```

### Behavior

- top section supports:
  - map view
  - gallery/hero image view
  - full-screen map expansion
- farm area and plantation area shown
- kyaari modules listed with:
  - kyaari name
  - area
  - trees count
  - verification status
- legal registry shown as two grouped buckets:
  - digital consents
  - supporting documentation

### Backend API

`GET /api/v1/farmers/me/farms/:farmId`

Response:

```json
{
  "farmId": "farm_1",
  "farmName": "Green Acres Plantation",
  "farmAreaAcres": 4.5,
  "plantationAreaAcres": 3.8,
  "onboardingDate": "2024-03-12",
  "onboardedBy": {
    "name": "Rahul Deshmukh",
    "organisationName": "Varaha Climate Services"
  },
  "map": {
    "provider": "google",
    "farmPolygon": [
      { "lat": 18.5204, "lng": 73.8567 }
    ]
  },
  "media": {
    "heroImageUrl": "https://..."
  },
  "kyaaris": [
    {
      "kyaariId": "ky_1",
      "kyaariName": "Section A1",
      "areaAcres": 0.8,
      "treeCount": 120,
      "verificationStatus": "ACCEPTED"
    }
  ],
  "legalRegistry": {
    "digitalConsents": [
      {
        "documentId": "doc_cra_1",
        "documentType": "CRA",
        "status": "GENERATED"
      }
    ],
    "documentation": [
      {
        "documentId": "doc_land_1",
        "documentType": "LAND_OWNERSHIP",
        "status": "ACCEPTED"
      }
    ]
  }
}
```

---

## Screen 14: Legal Registry Access Rule

### Purpose

Control how CRA / FPIC are shown.

### Rule

- until Aadhaar eKYC is accepted:
  - final legal document view should remain locked
- until CRA / FPIC are generated:
  - show skeleton / unfilled versions only
- once generated and signed:
  - show filled and signed document

### UI State Variants

1. `SKELETON_ONLY`
2. `GENERATED`
3. `GENERATED_SIGNED`
4. `LOCKED_BY_EKYC`

### Backend API

`GET /api/v1/farmers/me/documents/:documentId`

Response:

```json
{
  "documentId": "doc_cra_1",
  "documentType": "CRA",
  "status": "GENERATED_SIGNED",
  "viewAllowed": true,
  "viewMode": "SIGNED",
  "viewUrl": "https://signed-url..."
}
```

---

## Screen 15: Document View

### Purpose

Show the legal or project document in a secure readable format, with optional assistive audio behavior.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
| Header: Back | Document Title | Varaha Badge                 |
|                                                              |
| Language selector                                            |
| [ English v ]                                                |
|                                                              |
| Audio summary / listen control                               |
| [ Play ] [ Stop ]                                            |
|                                                              |
| Document Viewer                                              |
| ----------------------------------------------------------   |
| PDF / HTML content                                            |
|                                                              |
|                                                              |
| ----------------------------------------------------------   |
| Viewing Page 1 of 1 • Security Encrypted • Document ID       |
+--------------------------------------------------------------+
```

### Notes

- current prototype includes Gemini-based TTS summarization
- this can remain as optional value-add
- core requirement is secure view and proper document state handling

### Backend

`GET /api/v1/farmers/me/documents/:documentId`

Optionally:

`POST /api/v1/documents/summarize`

for audio or summary generation, if this feature is retained

---

## Screen 16: Notifications

### Purpose

Show important verification and identity events.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
| Header: Alerts                                               |
|                                                              |
| Recent Alerts                                [Mark All Read] |
|                                                              |
| ----------------------------------------------------------   |
| Aadhaar Verification Rejected                                |
| Your Aadhaar document was rejected due to mismatch...        |
| Status: Rejected                               2 hours ago    |
| [ Fix Now ]                                                  |
| ----------------------------------------------------------   |
| Bank Verification In-Progress                                |
| Your bank verification is under review...                    |
| Status: Pending                                5 hours ago    |
| ----------------------------------------------------------   |
| Farmer Identity Confirmed                                    |
| Welcome to the Varaha Registry...                            |
| Status: Accepted                               1 day ago      |
| ----------------------------------------------------------   |
+--------------------------------------------------------------+
```

### Initial Notification Types

- Aadhaar eKYC:
  - accepted
  - rejected with detail
  - in progress
- BAV:
  - accepted
  - rejected with detail
  - in progress
- farmer identity confirmed

### Behavior

- `Fix Now` shown on rejected items
- can route to onboarding
- for initial release, frontend can synthesize these notifications from API statuses, but backend notification endpoint should still be designed now

### Backend API

`GET /api/v1/farmers/me/notifications`

---

## Screen 17: Support

### Purpose

Provide FAQs and direct farmer support access.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
| Header: Support                                              |
|                                                              |
|              [ Phone Support Illustration ]                  |
|                                                              |
|                Need Help Instantly?                          |
|      Our support team is active from 9 AM to 6 PM IST        |
|                                                              |
|  [ Call Support Center ]                                     |
|  [ Chat via WhatsApp ]                                       |
|                                                              |
| FAQS & GUIDANCE                                              |
| ----------------------------------------------------------   |
| What is the Varaha Project?                                  |
| Varaha projects focus on carbon removals...                  |
| ----------------------------------------------------------   |
| Why is Aadhaar KYC mandatory?                                |
| It confirms identity to ensure incentives...                 |
| ----------------------------------------------------------   |
| Encrypted Support Channel                                    |
| By calling, you agree to our privacy policy...               |
+--------------------------------------------------------------+
```

### Behavior

- support should be a dedicated screen, not redirected to profile
- call CTA should use support system integration or at minimum a click-to-call fallback
- WhatsApp CTA can be included if operationally supported

### Backend APIs

`GET /api/v1/support/faqs`

`GET /api/v1/support/contact`

Example contact response:

```json
{
  "supportPhoneNumber": "+911800000000",
  "supportWhatsappNumber": "+919900000000",
  "supportHoursText": "9 AM to 6 PM IST"
}
```

---

## Screen 18: Profile

### Purpose

Show farmer profile, identity statuses, personal details, legal acceptance, app version, and logout.

### Full Screen Wireframe

```txt
+--------------------------------------------------------------+
| Header: My Profile                                           |
|                                                              |
|                    [Farmer Photo]                            |
|                                                              |
|               Shreenath Raman Sangvikar                      |
|                     +91 98765 23410                          |
|                      VARH-3920                               |
|                Onboarding Date: 15 Jan 2024                  |
|                                                              |
| Identity Status                                              |
| ----------------------------------------------------------   |
| National ID (Aadhaar)            [Accepted]                  |
| Government Registry                                          |
| ----------------------------------------------------------   |
| Bank Verification                [Rejected]                  |
| Direct Payout Channel                                       |
| ----------------------------------------------------------   |
|                                                              |
| Account & Privacy                                            |
| ----------------------------------------------------------   |
| Personal Details >                                           |
| Village: Sangvi • Block: Ahmedpur                            |
| ----------------------------------------------------------   |
| T&C Signed Status                                            |
| Accepted on: May 12, 2026                                    |
| ----------------------------------------------------------   |
| Logout Profiling >                                           |
|                                                              |
| Verified Infrastructure                                      |
| v1.4.2 (Production)                                          |
+--------------------------------------------------------------+
```

### Behavior

- show Aadhaar and BAV statuses with badges
- if BAV not accepted, clicking that row can route back into onboarding
- personal details are view-only in this release
- show app / portal version
- show T&C signed date
- logout CTA clears session and returns to login

### Backend APIs

`GET /api/v1/farmers/me/profile`

`POST /api/v1/farmer-auth/logout`

---

## 12. Bottom Navigation

The final bottom navigation must include:

- Home
- Support
- Notifications
- Profile

This is fully aligned to the latest requirement and now also reflected in the updated prototype.

## 13. Frontend State Model

### 13.1 Session State

- `UNAUTHENTICATED`
- `OTP_PENDING`
- `AUTHENTICATED`

### 13.2 Verification State

- `IDENTITY_UNCONFIRMED`
- `IDENTITY_CONFIRMED`
- `EKYC_REQUIRED`
- `EKYC_IN_PROGRESS`
- `EKYC_ACCEPTED`
- `BAV_REQUIRED`
- `BAV_IN_PROGRESS`
- `BAV_ACCEPTED`
- `FULLY_VERIFIED`

### 13.3 Home Gating State

- `SHOW_ACTION_BANNER`
- `SHOW_IN_PROGRESS_BANNER`
- `NO_BANNER`

## 14. Suggested Backend API List

### Authentication

- `POST /api/v1/farmer-auth/send-otp`
- `POST /api/v1/farmer-auth/verify-otp`
- `POST /api/v1/farmer-auth/resend-otp`
- `POST /api/v1/farmer-auth/logout`

### Bootstrap / Identity

- `GET /api/v1/farmers/me/bootstrap`
- `GET /api/v1/farmers/me/profile`
- `POST /api/v1/farmers/me/identity-confirmation`
- `PUT /api/v1/farmers/me/preferences`

### Aadhaar eKYC

- `POST /api/v1/farmers/me/ekyc/initiate`
- `POST /api/v1/farmers/me/ekyc/verify-otp`
- `GET /api/v1/farmers/me/ekyc/status`

### Bank Verification

- `GET /api/v1/farmers/me/bank-account`
- `POST /api/v1/farmers/me/bav/validate`
- `POST /api/v1/farmers/me/bav/update`
- `GET /api/v1/farmers/me/bav/status`

### Farms / Kyaaris / Documents

- `GET /api/v1/farmers/me/farms`
- `GET /api/v1/farmers/me/farms/:farmId`
- `GET /api/v1/farmers/me/documents/:documentId`

### Notifications / Support

- `GET /api/v1/farmers/me/notifications`
- `GET /api/v1/support/faqs`
- `GET /api/v1/support/contact`

## 15. Backend Data Contracts

## 15.1 Farmer Bootstrap

```ts
type VerificationStatus =
  | "MISSING"
  | "PENDING"
  | "IN_PROGRESS"
  | "ACCEPTED"
  | "REJECTED";

type FarmerBootstrapResponse = {
  farmerId: string;
  preferredLanguage: "en" | "hi" | "kn" | "ta";
  identityConfirmed: boolean;
  ekycStatus: VerificationStatus;
  bavStatus: VerificationStatus;
  maskedAadhaar: string | null;
  maskedBankAccountNumber: string | null;
  farmerProfile: {
    name: string;
    profilePhotoUrl?: string;
    mobileNumber: string;
    region: {
      state: string;
      district: string;
      block: string;
    };
  };
  farmsSummary: {
    count: number;
  };
};
```

## 15.2 Farm Card

```ts
type FarmCard = {
  farmId: string;
  farmName: string;
  kyaariCount: number;
  projectType: "PLANTATION" | "RETROSPECTIVE";
  farmEligibilityStatus: "ACCEPTED" | "PENDING" | "REJECTED";
  craConsentStatus: "ACCEPTED" | "PENDING" | "REJECTED";
};
```

## 15.3 Farm Detail

```ts
type FarmDetail = {
  farmId: string;
  farmName: string;
  farmAreaAcres: number;
  plantationAreaAcres: number;
  onboardingDate: string;
  onboardedBy: {
    name: string;
    organisationName?: string;
  };
  map: {
    provider: "google";
    farmPolygon: Array<{ lat: number; lng: number }>;
  };
  media?: {
    heroImageUrl?: string;
  };
  kyaaris: Array<{
    kyaariId: string;
    kyaariName: string;
    areaAcres: number;
    treeCount: number;
    verificationStatus: "ACCEPTED" | "PENDING" | "REJECTED";
  }>;
  legalRegistry: {
    digitalConsents: Array<{
      documentId: string;
      documentType: "CRA" | "FPIC";
      status: "SKELETON_ONLY" | "GENERATING" | "GENERATED" | "GENERATED_SIGNED" | "REJECTED";
    }>;
    documentation: Array<{
      documentId: string;
      documentType: string;
      status: "ACCEPTED" | "PENDING" | "REJECTED";
    }>;
  };
};
```

## 16. Security and Compliance Notes

- full Aadhaar must never be shown in frontend
- full stored bank account number must never be shown unless user is entering it fresh
- OTPs must expire quickly and be rate-limited
- all consent events must be recorded with version and timestamp
- uploaded passbook images must be securely stored and access-controlled
- document URLs should be pre-signed and time-limited

## 17. Implementation Gaps Between Prototype and Final Product

The updated prototype is much closer to the final product direction, but the following still need to be aligned in implementation:

- current onboarding remains one route instead of route-separated recoverable screens
- support flow still uses alerts instead of actual support integration
- current prototype uses mock profile, farms, map, and statuses
- legal registry lock rule based on Aadhaar eKYC acceptance must be fully enforced
- document state handling must distinguish skeleton vs generated vs generated-signed
- bootstrap must come from real backend instead of local mock state
- BAV update path needs real file upload handling and backend status orchestration
- notification generation should move to backend eventually even if frontend stubs are used first

## 18. Implementation Priorities

### Must Have

- mobile login and OTP verification
- consolidated bootstrap API
- language switching
- claim profile confirmation
- Aadhaar eKYC OTP flow
- BAV validation and mismatch flow
- home registry dashboard
- farm detail with Google Maps polygon rendering
- legal registry gating
- notifications screen
- support screen
- profile screen

### Nice to Have

- document TTS / summary
- WhatsApp chat support integration
- richer document analytics
- farmer detail correction flow behind `Wrong details`

## 19. Acceptance Criteria

- farmer can log in only with registered mobile and OTP
- language changes the whole UI
- bootstrap response alone is sufficient to route the user correctly
- identity confirmation is recorded before Aadhaar flow proceeds
- Aadhaar eKYC flow stores consent and drives `IN_PROGRESS` state
- BAV accepted users do not see BAV remediation
- BAV mismatch users are offered recheck or update path
- home shows farm list with project, consent, and eligibility statuses
- farm detail shows map, image, onboarding metadata, kyaari modules, and legal registry
- final legal document viewing remains locked until Aadhaar eKYC is accepted
- notifications show eKYC/BAV/identity events
- profile shows Aadhaar status, BAV status, T&C, and version

## 20. Final Note

This version of the documentation is deliberately more detailed at the screen and flow level than the earlier spec. It reflects the newer prototype structure and the whiteboard’s backend-oriented branching, especially around:

- login OTP request IDs
- single bootstrap fetch after login
- identity confirmation before KYC progression
- Aadhaar OTP and consent handling
- BAV validation branching
- locked vs unlocked home/farm/document states

This should be treated as the updated implementation blueprint for both frontend and backend.
