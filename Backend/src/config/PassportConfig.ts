import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { generateTokens } from "../helpers/GenerateToken";
import { generateUniqueHealthId } from "../utils/codes";

dotenv.config();

const clean = (value?: string) => (value || "").replace(/"/g, "").trim();

const callbackURL =
  clean(process.env.GOOGLE_CALLBACK_URL) ||
  "https://daryeel-healthtech-gamma.vercel.app/api/v1/auth/google/callback";

passport.use(
  new GoogleStrategy(
    {
      clientID: clean(process.env.GOOGLE_CLIENT_ID),
      clientSecret: clean(process.env.GOOGLE_CLIENT_SECRET),
      callbackURL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.trim().toLowerCase();
        const name = profile.displayName?.trim() || "Anonymous";
        const picture = profile.photos?.[0]?.value || "";

        if (!email) {
          return done(new Error("Google account does not have an email address"));
        }

        let user = await prisma.user.findUnique({ where: { email } });

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
              healthId,
              lastLoginAt: new Date(),
              medicalProfile: { create: {} },
            },
          });
        } else {
          if (user.deletedAt) {
            return done(new Error("This account has been deleted"));
          }
          if (!user.isActive) {
            return done(new Error("This account is inactive"));
          }
          if (user.isSuspended) {
            return done(new Error("This account is suspended"));
          }

          const updates: Record<string, unknown> = {
            lastLoginAt: new Date(),
          };
          if (!user.googleId) updates.googleId = profile.id;
          if (!user.picture && picture) updates.picture = picture;
          if (user.fullName === "Anonymous") updates.fullName = name;
          if (!user.healthId) updates.healthId = await generateUniqueHealthId();
          if (!user.emailVerified) updates.emailVerified = true;

          user = await prisma.user.update({
            where: { userid: user.userid },
            data: updates,
          });

          await prisma.medicalProfile.upsert({
            where: { userId: user.userid },
            create: { userId: user.userid },
            update: {},
          });
        }

        const tokens = await generateTokens({
          userId: user.userid,
          email: user.email,
          role: user.role,
        });

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
        console.error("Google Strategy Error:", error);
        return done(error as Error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.userId);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { userid: id } });
    done(null, user);
  } catch (error) {
    done(error as Error);
  }
});

export default passport;
