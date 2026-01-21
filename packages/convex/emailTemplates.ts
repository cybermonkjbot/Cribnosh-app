
export const EMAIL_TYPES = [
    {
        id: "tax_deadline_reminder",
        label: "Tax Deadline Reminder",
        variables: ["{{userName}}", "{{taxYear}}", "{{deadlineDate}}", "{{actionUrl}}"],
        subject: "Action Required: Tax Deadline Approaching"
    },
    {
        id: "welcome_message",
        label: "Welcome Message",
        variables: ["{{userName}}", "{{actionUrl}}"],
        subject: "Welcome to CribNosh!"
    },
    {
        id: "payment_receipt",
        label: "Payment Receipt",
        variables: ["{{userName}}", "{{amount}}", "{{date}}", "{{receiptUrl}}"],
        subject: "Your Payment Receipt"
    },
    {
        id: "otp_verification",
        label: "OTP Verification",
        variables: ["{{otpCode}}", "{{recipientName}}", "{{expiryMinutes}}"],
        subject: "Verify your email - {{otpCode}}"
    },
    {
        id: "account_deletion",
        label: "Account Deletion",
        variables: ["{{deletionDate}}", "{{userName}}"],
        subject: "Account Deletion Request Confirmed"
    },
    {
        id: "data_download",
        label: "Data Download",
        variables: ["{{downloadUrl}}", "{{expiresAt}}", "{{userName}}"],
        subject: "Your Data Download is Ready"
    },
    {
        id: "family_invitation",
        label: "Family Invitation",
        variables: ["{{inviterName}}", "{{acceptUrl}}", "{{userName}}"],
        subject: "You've been invited to join a family profile"
    },
    {
        id: "support_case",
        label: "Support Case Notification",
        variables: ["{{supportCaseRef}}", "{{subject}}", "{{userName}}"],
        subject: "Support Case Created: {{supportCaseRef}}"
    },
    {
        id: "review_received",
        label: "New Review Received",
        variables: ["{{customerName}}", "{{rating}}", "{{reviewText}}", "{{userName}}"],
        subject: "New {{rating}}-Star Review from {{customerName}}"
    }
];

export const getVariablesForType = (typeId: string) => {
    const type = EMAIL_TYPES.find(t => t.id === typeId);
    return type?.variables || [];
};
