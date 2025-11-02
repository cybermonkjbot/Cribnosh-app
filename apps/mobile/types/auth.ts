export interface PhoneLoginData {
    phone: string;
    action: 'send' | 'verify';
    otp?: string;
}
export interface CribNoshUser {
    user_id: string;
    email?: string;
    name: string;
    roles: string[];
    picture?: string;
    isNewUser: boolean;
    provider?: Provider;
    phone?: string;
  }

type Provider = "google" | "apple" | "email" | "phone";

 export interface SendLoginOTPResponse {
    success: boolean;
    data:{
        success: boolean;
        message: string;
    },
    
 }
 export interface PhoneLoginResponse {
    success: boolean;
    data:{
        success: boolean;
        message: string;
        token: string;
        user: CribNoshUser;
    },
  
 }

 