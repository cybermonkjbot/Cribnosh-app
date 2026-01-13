import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { EMAIL_TYPES } from "../emailTemplates";

// This is a simplified "Master" layout for seeding purposes.
// In a real scenario, this might come from a file or another template.
const MASTER_LAYOUT = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
        .btn { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{headerTitle}}</h1>
        </div>
        <div class="content">
            {{bodyContent}}
            <br><br>
            {{#if actionUrl}}
            <a href="{{actionUrl}}" class="btn">{{actionButtonText}}</a>
            {{/if}}
        </div>
        <div class="footer">
            <p>&copy; 2024 CribNosh. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export const seedEmailTemplates = mutation({
    args: {
        force: v.optional(v.boolean()), // If true, overwrites existing templates
    },
    handler: async (ctx, args) => {
        const existingTemplates = await ctx.db.query("emailTemplates").collect();

        // Create a map of existing templates by type for quick lookup
        const existingMap = new Map();
        for (const t of existingTemplates) {
            if (t.emailType) {
                existingMap.set(t.emailType, t);
            }
        }

        for (const type of EMAIL_TYPES) {
            const existing = existingMap.get(type.id);

            if (existing && !args.force) {
                console.log(`Skipping existing template: ${type.id}`);
                continue;
            }

            // Generate specific content based on type
            // This is a basic seeding strategy. You can expand this logic.
            let headerTitle = type.subject;
            let bodyContent = `<p>This is a default message for <strong>${type.label}</strong>.</p>`;
            let actionButtonText = "View Details";

            if (type.id === "tax_deadline_reminder") {
                bodyContent = `
          <p>Hello {{userName}},</p>
          <p>This is a reminder that the tax deadline for <strong>{{taxYear}}</strong> is approaching on <strong>{{deadlineDate}}</strong>.</p>
          <p>Please ensure all your documents are submitted.</p>
        `;
                actionButtonText = "Submit Documents";
            } else if (type.id === "welcome_message") {
                headerTitle = "Welcome to CribNosh!";
                bodyContent = `
          <p>Hi {{userName}},</p>
          <p>We are thrilled to have you on board. Explore our platform to find the best meals near you.</p>
        `;
                actionButtonText = "Get Started";
            } else if (type.id === "payment_receipt") {
                bodyContent = `
            <p>Hi {{userName}},</p>
            <p>We received your payment of <strong>{{amount}}</strong> on {{date}}.</p>
            <p>Thank you for your business.</p>
          `;
                actionButtonText = "View Receipt";
            }

            // Replace placeholders in Master Layout
            let html = MASTER_LAYOUT
                .replace("{{headerTitle}}", headerTitle)
                .replace("{{bodyContent}}", bodyContent)
                .replace("{{actionButtonText}}", actionButtonText);

            // Simple handlebar-like helpers removal if not used (very basic)
            // Real implementation might use a proper template engine even for seeding, 
            // but strict replace is safer for "generating" the template source code.
            // We leave {{userName}} etc intact because those are runtime variables.

            // Upsert
            if (existing) {
                await ctx.db.patch(existing._id, {
                    name: type.label,
                    description: `Default template for ${type.label}`,
                    subject: headerTitle, // Set subject
                    htmlContent: html,
                    updatedAt: Date.now(),
                    isSystem: true,
                });
            } else {
                await ctx.db.insert("emailTemplates", {
                    name: type.label,
                    description: `Default template for ${type.label}`,
                    emailType: type.id,
                    subject: headerTitle, // Set subject
                    htmlContent: html,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    isSystem: true,
                });
            }
        }

        return "Seeding complete";
    },
});
