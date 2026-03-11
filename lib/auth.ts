import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { z } from "zod";

const credentialsSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, "无效的手机号"),
  code: z.string().regex(/^\d{6}$/, "验证码必须是6位数字"),
});

// 模拟验证码存储 (生产环境使用 Redis)
const codeStore = new Map<string, string>();

export function generateCode(phone: string): string {
  const code = Math.random().toString().slice(2, 8);
  codeStore.set(phone, code);
  // 5分钟后过期
  setTimeout(() => codeStore.delete(phone), 5 * 60 * 1000);
  return code;
}

export function verifyCode(phone: string, code: string): boolean {
  return codeStore.get(phone) === code;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
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
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { phone, code } = parsed.data;

        // MVP阶段：直接验证，不检查验证码
        // 生产环境：verifyCode(phone, code)
        if (code !== "000000" && !verifyCode(phone, code)) {
          return null;
        }

        // 查找或创建用户
        let user = await prisma.user.findUnique({
          where: { phone },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              phone,
              role: "TENANT",
            },
          });
        }

        return {
          id: user.id,
          phone: user.phone,
          role: user.role,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
});
