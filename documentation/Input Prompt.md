```
**Table of Contents**

## WHY - Vision & Purpose

### #1: Purpose & Users

**Purpose:**
Estate Kit’s web application makes estate planning easy, organized, and accessible for older adults (primarily age 60+), enabling them to manage their affairs both physically and digitally, and ensuring that the right individuals have the correct level of access to their information when needed. The solution simplifies and centralizes the process, providing step-by-step guidance, secure digital storage, and seamless multi-user access with permission controls.

**Users:**

- **Primary User (Owner/Customer):** Older adults or anyone wanting to create and maintain an estate plan.
- **Secondary Users (Delegates):** Executors, healthcare proxies, family members, lawyers, and trusted advisors who need specific access to parts of the stored information.

**Why Use This Solution Over Alternatives:**

- **Comprehensive & Hybrid:** Addresses both digital and physical organization, guiding users through what to store physically and digitally.
- **Jurisdiction-Specific Guidance:** Automatically provides province-specific resources and links in Canada.
- **Secure & Trusted:** Employs best-in-class security measures, ensuring sensitive information like SIN/SSN, medical, and financial data is protected.
- **Ease of Use & Accessibility:** Tailored UX for older adults, with clear instructions, simple navigation, and compliance with accessibility standards.
- **Integration & Scalability:** Offers integrations with e-commerce, content management, chatbot support, and secure authentication to streamline the entire process.

## WHAT - Core Requirements

### **#2: Functional Requirements**

**Data Collection & Organization:**

- **System must:**
    - Guide users step-by-step to input personal, financial, legal, healthcare, and other relevant estate planning details.
    - Provide jurisdiction-specific links, resources, and forms (via external URLs) based on the user’s Canadian province.
    - Allow users to upload and store files securely (drag-and-drop upload).
    - Enable users to request third-party file uploads by sending a secure email invite link to lawyers, accountants, insurers, or bankers.

**Physical & Digital Kit Integration:**

- **System must:**
    - Facilitate the purchase and fulfillment of a physical Estate Kit box through integrated e-commerce (Shopify), including initial subscription setup for digital vault access.
    - Store user data in a secure digital vault and enable ongoing subscription payments for continued digital access.

**Output & Formatting:**

- **System must:**
    - Allow users to save, print, and download each section as a nicely formatted PDF.
    - Ensure downloaded PDFs can display sensitive data in full (e.g., SIN, passwords) in a secure manner.

**User-Level Permissions & Access Management:**

- **System must:**
    - Allow owners to grant role-based permissions (e.g., executor, healthcare proxy) with fine-grained access to specific data sections.
    - Enable secure login via Auth0, ensuring only authorized users can access appropriate data.

**Security & Compliance:**

- **System must:**
    - Use encryption-at-rest and in-transit, meeting or exceeding PIPEDA and HIPAA compliance standards (and plan for future GDPR compliance).
    - Safeguard highly sensitive information (SIN/SSN, medical data, passwords) using best-in-class security (akin to bank or hospital-level security).

**Accessibility & Ease-of-Use:**

- **System must:**
    - Comply with ADA/ACA accessibility standards for web applications.
    - Present a simple, clear, and senior-friendly user interface with straightforward navigation and minimal friction.

**Jurisdictional Customization & Content Management:**

- **System must:**
    - Integrate with a headless CMS (Sanity.io) to manage and serve dynamic content, including jurisdiction-specific guidance and resource links.
    - Enable easy updates to resources and content by non-technical staff.

**Chatbot & Support:**

- **System must:**
    - Integrate Intercom for chatbot-based customer support.
    - Allow users to access help resources, FAQs, and real-time support within the interface.

**Notification & Communication:**

- **System must:**
    - Integrate SendGrid for email/SMS notifications, e.g., confirmations of uploads, invitations to add documents, subscription renewals, and relevant alerts.
    - Automatically notify users when a third party uploads requested documents.

**User Account Management** 

- **System must:**
    - Allow authenticated users to update their personal information (e.g., name, email address, phone number) within the account settings.
    - Enable users to change their password and view their current subscription status and renewal date.
    - Provide an interface to view billing history, download invoices/receipts, and manage payment methods associated with their subscription.
    - Allow users to easily upgrade or cancel their subscription from the account settings page.
    - Send email confirmations (via SendGrid) for account changes, billing updates, and subscription modifications.

## **HOW - Planning & Implementation**

### **#3: Technical Foundation**

**Required Stack Components**

- **Frontend:**
    - React (or Next.js for SSR and SEO benefits), Material UI or similar accessible design library.
- **Backend:**
    - Python (Django or FastAPI) or Node.js (Express) for API development and server-side logic.
- **Database & Storage:**
    - Relational database (PostgreSQL) for structured data.
    - Secure, encrypted cloud storage (e.g., AWS S3 with server-side encryption) for uploaded documents.
- **Integrations:**
    - Auth0 for authentication and authorization.
    - Shopify for e-commerce and subscription billing.
    - SendGrid for email/SMS notifications.
    - Intercom for chat support.
    - Sanity.io for content management.
- **Infrastructure:**
    - Deployed on a cloud platform (e.g., AWS) with load balancers and managed services.
    - Use containerization (Docker) and CI/CD pipelines (GitHub Actions) for streamlined deployments.

**System Requirements**

- **Performance:**
    - System must quickly load primary content within 2-3 seconds on standard broadband connections.
    - Quick search and retrieval of stored documents and data.
- **Security:**
    - Industry-standard encryption (TLS 1.2+), strict IAM policies, periodic security audits and vulnerability scans.
- **Scalability:**
    - System must scale to thousands of concurrent users without performance degradation.
    - Horizontal scaling for backend services and database read-replicas as user base grows.
- **Reliability:**
    - Target 99.9% uptime.
    - Automated backups of data and documents.
    - Disaster recovery plan with recovery point objectives (RPO) under 24 hours.
- **Integration Constraints:**
    - Must follow each third-party integration’s best practices and rate limits.
    - Authentication tokens and keys must be securely stored and rotated.

### **#4: User Experience**

**Key User Flows**

**Flow A: Initial Onboarding & Setup**

1. **Entry Point:** User lands on Estate Kit homepage.
2. **Key Steps:** User purchases physical kit, sets up initial account (via Shopify checkout + Auth0 signup). Upon login, user is guided through initial questionnaire to identify their province and what data to enter first.
3. **Success Criteria:** User completes initial profile setup and receives clear next steps.
4. **Alternative Flows:** User skips certain sections to revisit later or requests help via Intercom chatbot.

**Flow B: Data Entry & Document Upload**

1. **Entry Point:** User logs in to dashboard.
2. **Key Steps:** User enters personal info, financial accounts, healthcare details; uploads documents via drag-and-drop; requests accountant to upload missing files via secure link.
3. **Success Criteria:** All required data fields are completed, files are successfully stored, and user sees confirmation and data summary.
4. **Alternative Flows:** User leaves mid-process, saves progress, returns later. User interacts with chatbot for guidance.

**Flow C: Permissions & Access Granting**

1. **Entry Point:** User accesses “Manage Permissions” section.
2. **Key Steps:** Owner assigns executor role and grants them access to financial and healthcare sections. Executor receives secure invite.
3. **Success Criteria:** Executor can log in and view only the granted sections.
4. **Alternative Flows:** Owner modifies permissions later or revokes certain accesses.

**Flow D: Downloading & Printing Data**

1. **Entry Point:** User finishes data input and wants a hard copy.
2. **Key Steps:** User selects a section (e.g., Healthcare Directives) and downloads a formatted PDF with all relevant info.
3. **Success Criteria:** PDF is correctly formatted, readable, and includes sensitive data as requested.
4. **Alternative Flows:** User prints all sections at once, or selectively prints only certain areas.

**Flow E: Managing Account Settings**

1. **Entry Point:** User logs into the dashboard and selects “Account Settings” from the navigation menu.
2. **Key Steps:** User can edit personal details, review or update subscription/payment info, and change their password.
3. **Success Criteria:** Changes are saved successfully, and the user receives an on-screen confirmation and an email summary of account modifications.
4. **Alternative Flows:** User aborts changes (no updates saved), or requests assistance via Intercom chatbot if unsure how to proceed.

**Core Interfaces**

- **Login/Registration Page:** Clean, accessible login with fields and simple instructions.
- **Dashboard/Home:** Central hub for navigation, showing progress indicators, and quick links to main sections.
- **Data Input Sections (e.g., Personal, Healthcare, Financial):** Form-based interfaces with clear labels, tooltips, and embedded links to jurisdiction-specific resources.
- **Permissions Management Page:** Simple UI for granting/revoking access, with dropdowns for roles and checkboxes for data sections.
- **Document Upload Modal:** Drag-and-drop functionality, file validation, and progress indicators.
- **Print/Download Screen:** Ability to preview formatted PDFs before downloading.
- **Support/Chat Window:** Intercom widget accessible from all pages.
- **Account Settings Page:** Provide a secure interface for users to manage their personal and subscription information.

### **#5 Business Requirements**

**Access & Authentication**

- **User Types:** Owner (full access), Delegates (executor, healthcare proxy, family member, etc. with restricted access).
- **Auth Requirements:** Users must authenticate via Auth0 with email/password or passwordless login options.
- **Access Control:** Role-based access ensuring only authorized roles can view/edit certain data.

**Business Rules**

- **Data Validation:**
    - SIN/SSN must follow proper format and must be validated before saving.
    - Mandatory fields must be completed before checkout or full onboarding.
- **Compliance & Security:**
    - Must adhere to PIPEDA, and HIPAA-like standards for data security.
    - Prepare for future GDPR compliance as product may expand globally.
- **E-commerce & Subscription Management:**
    - Shopify handles purchases of physical kits and initial subscription.
    - System must track subscription status and prompt user to renew or upgrade.
- **Content Management:**
    - Sanity.io stores all jurisdiction-specific resources; content updates must reflect in real-time without code deployment.
- **Service Levels:**
    - High availability and minimal downtime.
    - Responsive support within agreed SLA (e.g., 24-hour response time for queries).

### **#6: Implementation Priorities**

- **High Priority:**
    - Secure login and robust permission management (Auth0).
    - Data input forms, secure file storage, and PDF output.
    - E-commerce integration (Shopify) for physical kit purchase and subscription setup.
    - Accessibility compliance and user-friendly design for older adults.
- **Medium Priority:**
    - Integration of Intercom for support and Sanity.io for dynamic content management.
    - Automated email/SMS notifications (SendGrid).
    - Account Management Features:
        - User ability to update personal details, change password, and manage subscription/payment information.
        - Viewing billing history, downloading invoices/receipts, and receiving email confirmations for account changes.
```