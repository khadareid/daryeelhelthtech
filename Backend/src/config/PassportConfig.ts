import dotenv from "dotenv";
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { generateTokens } from '../helpers/GenerateToken';
import { generateUniqueHealthId } from '../services/healthId.service';

dotenv.config();

const clean = (value?: string) => (value || "").replace(/"/g, "").trim();

/**
 * Must be the API host (not the Website SPA), and must match Google Cloud
 * "Authorized redirect URIs" exactly.
 * Example: https://daryeel-healthtech-api.vercel.app/api/v1/auth/google/callback
 */
const callbackURL =
  clean(process.env.GOOGLE_CALLBACK_URL) ||
  "https://daryeel-healthtech-api.vercel.app/api/v1/auth/google/callback";

passport.use(
  new GoogleStrategy(
    {
      clientID: clean(process.env.GOOGLE_CLIENT_ID),
      clientSecret: clean(process.env.GOOGLE_CLIENT_SECRET),
      callbackURL,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.trim().toLowerCase();

        const name = profile.displayName?.trim() || 'Anonymous';

        const picture = profile.photos?.[0]?.value || '';

        if (!email) {
          return done(new Error('Google account does not have an email address'));
        }

        // 1. Find existing user
        let user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        // 2. First Google visit creates a USER account (sign up).
        if (!user) {
          const healthId = await generateUniqueHealthId();
          user = await prisma.user.create({
            data: {
              email,
              fullName: name,
              googleId: profile.id,
              picture,
              role: Role.USER,
              emailVerified: true,
              passwordHash: null,
              phone: null,
              gender: null,
              dateOfBirth: null,
              lastLoginAt: new Date(),
              lastLogin: new Date(),
              profile: { create: { healthId } },
              medicalProfile: { create: {} },
            },
          });
        } else {
          // Existing Google users: ensure permanent Patient/Health ID
          const { ensureUserProfileWithHealthId } = await import(
            "../services/healthId.service"
          );
          await ensureUserProfileWithHealthId(user.userid).catch(() => undefined);
        }

        // 3. Check account status
        if (user.isDeleted) {
          return done(new Error('This account has been deleted'));
        }

        if (!user.isActive) {
          return done(new Error('This account is inactive'));
        }

        if (user.isSuspended) {
          return done(new Error('This account is suspended'));
        }

        // 4. Save Google information if not already connected
        if (!user.googleId || !user.picture) {
          user = await prisma.user.update({
            where: {
              userid: user.userid,
            },
            data: {
              googleId: user.googleId || profile.id,
              picture: user.picture || picture,
              fullName: user.fullName === 'Anonymous' ? name : user.fullName,
              lastLoginAt: new Date(),
              lastLogin: new Date(),
            },
          });
        } else {
          // Update login time
          user = await prisma.user.update({
            where: {
              userid: user.userid,
            },
            data: {
              lastLoginAt: new Date(),
              lastLogin: new Date(),
            },
          });
        }

        // 5. Generate application tokens
        const tokens = await generateTokens({
          userId: user.userid,
          email: user.email,
          role: user.role,
        });

        // 6. Return user + tokens to Passport
        return done(null, {
          userId: user.userid,
          email: user.email,
          name: user.fullName,
          picture: user.picture || picture,
          role: user.role,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      } catch (error) {
        console.error('Google Strategy Error:', error);
        return done(error);
      }
    },
  ),
);

// Passport session serialization
passport.serializeUser((user: any, done) => {
  done(null, user.userId);
});

// Passport session deserialization
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        userid: id,
      },
    });

    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
