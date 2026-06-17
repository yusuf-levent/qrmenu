import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import jwt from "jsonwebtoken";
import { PrismaService } from "./prisma.service";

export type AuthUser = {
  id: string;
  email: string;
  role: "OWNER" | "STAFF";
  businessId: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};

type JwtPayload = {
  sub: string;
  businessId: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = readToken(request);
    if (!token) {
      throw new UnauthorizedException("Oturum gerekli");
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET ?? "local-dev-secret") as JwtPayload;
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, businessId: true }
      });
      if (!user || user.businessId !== payload.businessId) {
        throw new UnauthorizedException("Oturum gecersiz");
      }
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException("Oturum gecersiz");
    }
  }
}

function readToken(request: Request): string | null {
  const cookies = request.cookies as Record<string, string | undefined> | undefined;
  const cookieToken = cookies?.qrmenu_token;
  if (cookieToken) {
    return cookieToken;
  }
  const header = request.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return null;
}
