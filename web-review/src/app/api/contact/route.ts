import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Send an email to your support team
    // 2. Store the message in a database
    // 3. Send a confirmation email to the user
    // 4. Integrate with a service like SendGrid, Resend, or Nodemailer

    // For now, we'll just log the message and return success
    console.log("Contact form submission:", {
      name,
      email,
      message,
      timestamp: new Date().toISOString(),
    });

    // TODO: Implement actual email sending
    // Example with a service like Resend:
    /*
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: 'contact@motivz.com',
      to: 'support@motivz.com',
      subject: `New contact form submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });
    */

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for your message! We'll get back to you soon.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
