/**
 * Mock authentication utilities for testing navigation flow
 * This bypasses the backend API calls to avoid rate limiting during development
 */

export interface MockUser {
  user_id: string;
  email: string;
  name: string;
  roles: string[];
  picture: string;
  isNewUser: boolean;
  provider: string;
}

export interface MockAuthResponse {
  data: {
    success: boolean;
    token: string;
    user: MockUser;
    message?: string;
  };
}

// Mock token generator
const generateMockToken = (): string => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: "mock-user-123",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      phone: "+1234567890",
    })
  );
  const signature = "mock-signature";
  return `${header}.${payload}.${signature}`;
};

// Mock user data
const mockUser: MockUser = {
  user_id: "mock-user-123",
  email: "test@cribnosh.com",
  name: "Test User",
  roles: ["user"],
  picture: "https://avatar.iran.liara.run/public/44",
  isNewUser: false,
  provider: "phone",
};

/**
 * Mock function to simulate sending OTP
 */
export const mockSendOTP = async (phone: string): Promise<MockAuthResponse> => {
  console.log("🔧 MOCK: Sending OTP to", phone);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    data: {
      success: true,
      token: "", // No token yet for OTP send
      user: mockUser,
      message: `Mock OTP sent to ${phone}. Use code: 123456`,
    },
  };
};

/**
 * Mock function to simulate phone login verification
 */
export const mockPhoneLogin = async (
  phone: string,
  otp: string
): Promise<MockAuthResponse> => {
  console.log("🔧 MOCK: Verifying phone login", { phone, otp });

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Accept any 6-digit code for testing
  if (otp.length === 6 && /^\d+$/.test(otp)) {
    const token = generateMockToken();

    return {
      data: {
        success: true,
        token,
        user: {
          ...mockUser,
          // Update user data based on phone number
          name: phone.includes("+1") ? "John Doe" : "Jane Smith",
          email: phone.includes("+1")
            ? "john@cribnosh.com"
            : "jane@cribnosh.com",
        },
        message: "Mock login successful!",
      },
    };
  } else {
    throw {
      data: {
        error: "Invalid verification code",
        requestId: "mock-req-" + Date.now(),
      },
      status: 400,
    };
  }
};

/**
 * Mock function to simulate Google sign-in
 */
export const mockGoogleSignIn = async (
  accessToken: string
): Promise<MockAuthResponse> => {
  console.log(
    "🔧 MOCK: Google sign-in with token",
    accessToken.substring(0, 20) + "..."
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    data: {
      success: true,
      token: generateMockToken(),
      user: {
        ...mockUser,
        name: "Google User",
        email: "google@cribnosh.com",
        provider: "google",
      },
      message: "Mock Google sign-in successful!",
    },
  };
};

/**
 * Mock function to simulate Apple sign-in
 */
export const mockAppleSignIn = async (
  identityToken: string
): Promise<MockAuthResponse> => {
  console.log(
    "🔧 MOCK: Apple sign-in with token",
    identityToken.substring(0, 20) + "..."
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    data: {
      success: true,
      token: generateMockToken(),
      user: {
        ...mockUser,
        name: "Apple User",
        email: "apple@cribnosh.com",
        provider: "apple",
      },
      message: "Mock Apple sign-in successful!",
    },
  };
};
