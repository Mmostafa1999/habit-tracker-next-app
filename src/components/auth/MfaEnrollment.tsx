import React, { useState, useRef, useEffect } from 'react';
import { RecaptchaVerifier, User } from 'firebase/auth';
import { auth, mfa } from '@/lib/firebase/config';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FiPhone, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface MfaEnrollmentProps {
  user: User;
  onComplete?: () => void;
}

export default function MfaEnrollment({ user, onComplete }: MfaEnrollmentProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize recaptcha when component mounts
  useEffect(() => {
    // Clean up previous instances if they exist
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
    }
    
    if (recaptchaContainerRef.current && typeof window !== 'undefined') {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: 'normal',
        callback: () => {
          // reCAPTCHA solved, allow the user to proceed with verification
          setError(null);
        },
        'expired-callback': () => {
          setError('reCAPTCHA has expired. Please refresh the page and try again.');
        }
      });
      
      recaptchaVerifierRef.current.render();
    }
    
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);
  
  // Handle phone number submission
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || !phoneNumber.match(/^\+[0-9]{10,15}$/)) {
      setError('Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Make sure recaptcha verifier is initialized
      if (!recaptchaVerifierRef.current) {
        throw new Error('reCAPTCHA not initialized');
      }
      
      // Enroll in MFA with phone number
      if (mfa) {
        const verificationIdResult = await mfa.enrollPhoneNumber(
          user,
          phoneNumber,
          recaptchaVerifierRef.current
        );
        
        setVerificationId(verificationIdResult);
        setStep(2);
        toast.success('Verification code sent to your phone');
      } else {
        throw new Error('Multi-factor authentication is not available');
      }
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      setError(error.message || 'Failed to send verification code');
      
      // Refresh the recaptcha
      recaptchaVerifierRef.current?.clear();
      if (recaptchaContainerRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
          size: 'normal',
        });
        recaptchaVerifierRef.current.render();
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle verification code submission
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length < 6) {
      setError('Please enter a valid verification code');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (!verificationId) {
        throw new Error('Verification session expired');
      }
      
      // Complete MFA enrollment
      if (mfa) {
        await mfa.completeEnrollment(user, verificationId, verificationCode);
        toast.success('Multi-factor authentication successfully enabled');
        
        // Call the onComplete callback if provided
        if (onComplete) {
          onComplete();
        }
      } else {
        throw new Error('Multi-factor authentication is not available');
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      setError(error.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white  p-6 rounded-lg shadow-md max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <FiShield className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 ">
          {step === 1 ? 'Enable Two-Factor Authentication' : 'Verify Your Phone'}
        </h2>
        <p className="mt-2 text-sm text-gray-600 ">
          {step === 1 
            ? 'Add an extra layer of security to your account by enabling 2FA' 
            : 'Enter the verification code sent to your phone'}
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100  border border-red-200  rounded text-red-700  text-sm">
          {error}
        </div>
      )}
      
      {step === 1 ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <Input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            label="Phone Number"
            placeholder="+1234567890"
            value={phoneNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
            icon={<FiPhone className="text-gray-500" />}
            required
            error={error}
          />
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700  mb-2">
              Complete the reCAPTCHA
            </label>
            <div 
              ref={recaptchaContainerRef} 
              className="recaptcha-container flex justify-center"
            ></div>
          </div>
          
          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
            className="mt-4"
          >
            Send Verification Code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <Input
            id="verificationCode"
            name="verificationCode"
            type="text"
            label="Verification Code"
            placeholder="123456"
            value={verificationCode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVerificationCode(e.target.value)}
            maxLength={6}
            required
            error={error}
          />
          
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className="flex-1"
            >
              Verify & Enable
            </Button>
          </div>
        </form>
      )}
    </div>
  );
} 