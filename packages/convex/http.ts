import { httpRouter } from "convex/server";
import { api, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// ============================================================================
// EMAIL CONFIGURATION API ENDPOINTS
// ============================================================================

// Get all email templates
http.route({
  path: "/api/email/templates",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("activeOnly") === "true";
    const limit = parseInt(url.searchParams.get("limit") || "50");
    
    const templates = await ctx.runQuery(api.emailConfig.getEmailTemplates, {
      activeOnly,
      limit,
    });
    
    return new Response(JSON.stringify(templates), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Get specific email template
http.route({
  path: "/api/email/templates/:templateId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const templateId = url.pathname.split('/').pop();
    
    if (!templateId) {
      return new Response(JSON.stringify({ error: "Template ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const template = await ctx.runQuery(api.emailConfig.getEmailTemplate, {
      templateId,
    });
    
    if (!template) {
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify(template), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Create email template
http.route({
  path: "/api/email/templates",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { changedBy, ...templateData } = body;
      
      const templateId = await ctx.runMutation(api.emailConfig.createEmailTemplate, {
        ...templateData,
        changedBy: changedBy || "system",
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        templateId,
        message: "Template created successfully" 
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: String(error) 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Update email template
http.route({
  path: "/api/email/templates/:templateId",
  method: "PUT",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const templateId = url.pathname.split('/').pop();
      
      if (!templateId) {
        return new Response(JSON.stringify({ error: "Template ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const body = await request.json();
      const { changedBy, changeReason, ...updates } = body;
      
      await ctx.runMutation(api.emailConfig.updateEmailTemplate, {
        templateId,
        updates,
        changedBy: changedBy || "system",
        changeReason,
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Template updated successfully" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: String(error) 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Delete email template
http.route({
  path: "/api/email/templates/:templateId",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const templateId = url.pathname.split('/').pop();
      
      if (!templateId) {
        return new Response(JSON.stringify({ error: "Template ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const changedBy = url.searchParams.get("changedBy") || "system";
      const changeReason = url.searchParams.get("changeReason") || undefined;
      
      await ctx.runMutation(api.emailConfig.deleteEmailTemplate, {
        templateId,
        changedBy,
        changeReason,
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Template deleted successfully" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: String(error) 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// ============================================================================
// EMAIL ANALYTICS API ENDPOINTS
// ============================================================================

// Get email dashboard stats
http.route({
  path: "/api/email/analytics/dashboard",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate") ? parseInt(url.searchParams.get("startDate")!) : undefined;
    const endDate = url.searchParams.get("endDate") ? parseInt(url.searchParams.get("endDate")!) : undefined;
    const templateId = url.searchParams.get("templateId") || undefined;
    
    const stats = await ctx.runQuery(api.emailAnalytics.getEmailDashboardStats, {
      startDate,
      endDate,
      templateId,
    });
    
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Email click tracking
http.route({
  path: "/api/email/track/click/:emailId/:linkId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const emailId = pathParts[pathParts.length - 2];
      const linkId = pathParts[pathParts.length - 1];
      const templateId = url.searchParams.get("templateId");
      const recipientEmail = url.searchParams.get("recipient");
      const redirectUrl = url.searchParams.get("url");
      
      if (!templateId || !recipientEmail) {
        return new Response("Missing required parameters", { status: 400 });
      }
      
      // Record click event
      await ctx.runMutation(api.emailConfig.recordEmailEvent, {
        emailId,
        templateId,
        recipientEmail,
        eventType: "clicked",
        metadata: {
          linkId,
          redirectUrl,
          userAgent: request.headers.get("user-agent"),
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        },
      });
      
      // Redirect to the original URL
      if (redirectUrl) {
        return new Response(null, {
          status: 302,
          headers: { "Location": redirectUrl },
        });
      }
      
      return new Response("Click tracked", { status: 200 });
    } catch (error) {
      console.error("Click tracking error:", error);
      return new Response("Error tracking click", { status: 500 });
    }
  }),
});

// Email open tracking
http.route({
  path: "/api/email/track/open/:emailId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const emailId = url.pathname.split('/').pop();
      const templateId = url.searchParams.get("templateId");
      const recipientEmail = url.searchParams.get("recipient");
      
      if (!emailId || !templateId || !recipientEmail) {
        return new Response("Missing required parameters", { status: 400 });
      }
      
      // Record open event
      await ctx.runMutation(api.emailConfig.recordEmailEvent, {
        emailId: emailId as string,
        templateId: templateId as string,
        recipientEmail: recipientEmail as string,
        eventType: "opened",
        metadata: {
          userAgent: request.headers.get("user-agent"),
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        },
      });
      
      // Return 1x1 transparent pixel
      const pixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64"
      );
      
      return new Response(pixel, {
        status: 200,
        headers: { 
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
      });
    } catch (error) {
      console.error("Open tracking error:", error);
      return new Response("Error tracking open", { status: 500 });
    }
  }),
});

// ============================================================================
// APPLE SIGN IN NOTIFICATION ENDPOINTS
// ============================================================================

// Apple Sign in server-to-server notification endpoint
http.route({
  path: "/api/apple/signin-notifications",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Parse the notification payload
      const payload = await request.json();
      
      // Verify the JWT signature (Apple sends notifications with JWT)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isValid = await ctx.runMutation((internal as any)["internal/appleNotifications"].verifyAppleJWT, {
        jwt: request.headers.get("authorization")?.replace("Bearer ", "") || "",
        payload,
      });
      
      if (!isValid) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Invalid Apple JWT signature" 
        }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Handle different notification types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await ctx.runMutation((internal as any)["internal/appleNotifications"].handleNotification, {
        notificationType: payload.type,
        payload,
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Notification processed successfully",
        result 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      
    } catch (error) {
      console.error("Apple notification error:", error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: String(error) 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Resend webhook handler - using Next.js API route instead
// The webhook is handled at /api/webhooks/resend/route.ts

export default http;