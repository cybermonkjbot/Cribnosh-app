
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
    }
];

export const getVariablesForType = (typeId: string) => {
    const type = EMAIL_TYPES.find(t => t.id === typeId);
    return type?.variables || [];
};
