'use client';

import { SignUp } from '@clerk/nextjs';
import Image from 'next/image';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Logo */}
      <div className="mb-8 sm:mb-12">
        <Image
          src="/logo.png"
          alt="Torvionyx"
          width={120}
          height={120}
          priority
        />
      </div>

      {/* Text content */}
      <div className="text-center mb-10 sm:mb-12 max-w-md">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4" style={{ color: '#0F1F3D' }}>
          Turn a brief into a proposal.
        </h1>
        <p className="text-lg sm:text-xl" style={{ color: '#4A5568' }}>
          In under two minutes.
        </p>
      </div>

      {/* Clerk Sign-Up Component */}
      <div className="w-full max-w-sm">
        <SignUp
          appearance={{
            baseTheme: undefined,
            elements: {
              rootBox: 'w-full',
              card: 'bg-white rounded-lg shadow-sm p-6 sm:p-8',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton: 'hidden',
              dividerLine: 'hidden',
              dividerText: 'hidden',
              formFieldInput:
                'w-full px-4 py-3 rounded-lg border-2 transition-colors placeholder-gray-400 text-sm sm:text-base',
              formField: 'mb-4',
              formFieldLabel: 'block text-sm font-medium mb-2',
              formFieldLabelText: 'font-medium',
              button:
                'w-full px-4 py-3 rounded-lg font-semibold transition-colors text-white text-sm sm:text-base',
              footerAction: 'text-center mt-6',
              footerActionLink: 'font-semibold',
              formFieldInputShowPasswordButton: 'text-gray-500 hover:text-gray-700',
            },
            variables: {
              colorPrimary: '#0F1F3D',
              colorText: '#4A5568',
              colorTextSecondary: '#718096',
              colorSuccess: '#C9A84C',
              colorDanger: '#E53E3E',
              colorInputBackground: '#FFFFFF',
              colorInputBorder: '#0F1F3D',
              colorInputText: '#4A5568',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '0.9375rem',
            },
          }}
          signInUrl="/sign-in"
          routing="path"
          path="/sign-up"
        />
      </div>

      {/* Custom styles for focus states and buttons */}
      <style>{`
        input[type='text'],
        input[type='email'],
        input[type='password'],
        input[type='tel'],
        input[type='url'],
        input[type='number'],
        textarea,
        select {
          border-color: #0F1F3D !important;
        }

        input[type='text']:focus,
        input[type='email']:focus,
        input[type='password']:focus,
        input[type='tel']:focus,
        input[type='url']:focus,
        input[type='number']:focus,
        textarea:focus,
        select:focus {
          outline: none;
          border-color: #C9A84C !important;
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.1) !important;
        }

        button[type='submit'] {
          background-color: #0F1F3D !important;
          color: white !important;
          transition: all 0.3s ease !important;
        }

        button[type='submit']:hover {
          background-color: #0D1929 !important;
          box-shadow: 0 4px 12px rgba(201, 168, 76, 0.3) !important;
        }

        button[type='submit']:active {
          background-color: #0B1520 !important;
        }

        /* Clerk link styling */
        a {
          color: #0F1F3D;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        a:hover {
          color: #C9A84C;
        }

        /* Remove default Clerk styling overrides */
        [data-testid='clerk-loading'] {
          color: #0F1F3D;
        }

        /* Adjust form spacing on mobile */
        @media (max-width: 640px) {
          .cl-card {
            padding: 24px !important;
          }

          input[type='text'],
          input[type='email'],
          input[type='password'],
          button[type='submit'] {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
