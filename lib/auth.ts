import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { z } from "zod";
import { UserRole, AuthUser } from "@/types";
import { generateReferralCode, isValidReferralCodeFormat } from "./referral";
import { generateCode, verifyCode } from "./auth-code";

const credentialsSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, "无效的手机号"),
  code: z.string().regex(/^\d{6}$/, "验证码必须是6位数字"),
  referralCode: z.string().optional(),
});

const nextAuth = NextAuth({
  // Note: PrismaAdapter removed - we're using JWT strategy which doesn't need an adapter
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 }, // 24 hours
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    Credentials({
      name: "phone",
      credentials: {
        phone: { label: "手机号", type: "text" },
        code: { label: "验证码", type: "text" },
      },
      async authorize(credentials): Promise<AuthUser | null> {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { phone, code, referralCode: inputReferralCode } = parsed.data;

        // 验证验证码
        if (!verifyCode(phone, code)) {
          return null;
        }

        // 查找或创建用户
        let user = await prisma.user.findUnique({
          where: { phone },
        });

        if (!user) {
          // 生成用户的唯一邀请码
          const userReferralCode = generateReferralCode();

          // 验证输入的邀请码（如果有）
          let referrerId: string | undefined;
          if (inputReferralCode && isValidReferralCodeFormat(inputReferralCode)) {
            const referrer = await prisma.user.findUnique({
              where: { referralCode: inputReferralCode },
            });
            if (referrer && referrer.phone !== phone) {
              referrerId = referrer.id;
            }
          }

          // 创建新用户
          user = await prisma.user.create({
            data: {
              phone,
              role: UserRole.TENANT,
              referralCode: userReferralCode,
              referredBy: referrerId,
            },
          });

          // 如果有邀请人，创建邀请记录
          if (referrerId) {
            await prisma.referralRecord.create({
              data: {
                referrerId,
                refereeId: user.id,
                status: "pending",
              },
            });
          }
        }

        return {
          id: user.id,
          phone: user.phone,
          role: user.role as UserRole,
          name: user.name ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as AuthUser;
        token.role = authUser.role;
        token.phone = authUser.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
});

export const { handlers, auth, signIn, signOut } = nextAuth;
