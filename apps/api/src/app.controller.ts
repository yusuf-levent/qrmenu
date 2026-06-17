import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { Response } from "express";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import qrcode from "qrcode";
import {
  calculateOrderTotal,
  canTransitionOrderStatus,
  createCategorySchema,
  createMenuItemSchema,
  createOrderSchema,
  createTableSchema,
  loginSchema,
  payOrderSchema,
  registerSchema,
  updateBusinessSchema,
  updateCategorySchema,
  updateMenuItemSchema,
  updateOrderStatusSchema
} from "@qrmenu/types";
import { PrismaService } from "./prisma.service";
import { AuthenticatedRequest, JwtAuthGuard } from "./auth.guard";
import { OrdersGateway } from "./orders.gateway";
import { PaymentsService } from "./payments.service";
import { parseBody } from "./zod";
import { createToken, publicMenuBaseUrl, sanitizeUploadName, slugify } from "./utils";

const uploadsRoot = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadsRoot, { recursive: true });

const imageUploadInterceptor = FileInterceptor("image", {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new BadRequestException("Sadece resim dosyasi yuklenebilir"), false);
      return;
    }
    callback(null, true);
  },
  storage: diskStorage({
    destination: uploadsRoot,
    filename: (_request, file, callback) => callback(null, sanitizeUploadName(file.originalname))
  })
});

@Controller("auth")
export class AuthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Post("register")
  async register(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const input = parseBody(registerSchema, body);
    const baseSlug = slugify(input.businessName) || "isletme";
    const slug = await this.uniqueSlug(baseSlug);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const business = await this.prisma.business.create({
      data: {
        name: input.businessName,
        slug,
        users: {
          create: {
            email: input.email,
            passwordHash,
            role: "OWNER"
          }
        }
      },
      include: { users: true }
    });
    const user = business.users[0];
    if (!user) {
      throw new BadRequestException("Kullanici olusturulamadi");
    }
    this.setCookie(response, user.id, business.id);
    return { user: publicUser(user), business };
  }

  @Post("login")
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const input = parseBody(loginSchema, body);
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { business: true }
    });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new BadRequestException("E-posta veya sifre hatali");
    }
    this.setCookie(response, user.id, user.businessId);
    return { user: publicUser(user), business: user.business };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@Req() request: AuthenticatedRequest) {
    const user = await this.prisma.user.findUnique({
      where: { id: request.user.id },
      include: { business: true }
    });
    if (!user) {
      throw new NotFoundException("Kullanici bulunamadi");
    }
    return { user: publicUser(user), business: user.business };
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie("qrmenu_token");
    return { ok: true };
  }

  private setCookie(response: Response, userId: string, businessId: string) {
    const token = jwt.sign({ sub: userId, businessId }, process.env.JWT_SECRET ?? "local-dev-secret", {
      expiresIn: "7d"
    });
    response.cookie("qrmenu_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }

  private async uniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let index = 1;
    while (await this.prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${index}`;
      index += 1;
    }
    return slug;
  }
}

@Controller("businesses")
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get("me")
  getMe(@Req() request: AuthenticatedRequest) {
    return this.prisma.business.findUniqueOrThrow({ where: { id: request.user.businessId } });
  }

  @Patch("me")
  updateMe(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const input = parseBody(updateBusinessSchema, body);
    return this.prisma.business.update({
      where: { id: request.user.businessId },
      data: input
    });
  }
}

@Controller("categories")
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.prisma.category.findMany({
      where: { businessId: request.user.businessId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const input = parseBody(createCategorySchema, body);
    return this.prisma.category.create({
      data: { ...input, businessId: request.user.businessId }
    });
  }

  @Patch(":id")
  async update(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() body: unknown) {
    await assertCategoryOwner(this.prisma, id, request.user.businessId);
    return this.prisma.category.update({
      where: { id },
      data: parseBody(updateCategorySchema, body)
    });
  }

  @Delete(":id")
  async remove(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    await assertCategoryOwner(this.prisma, id, request.user.businessId);
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }
}

@Controller("menu-items")
@UseGuards(JwtAuthGuard)
export class MenuItemsController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.prisma.menuItem.findMany({
      where: { businessId: request.user.businessId },
      include: { category: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
  }

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const input = parseBody(createMenuItemSchema, body);
    await assertCategoryOwner(this.prisma, input.categoryId, request.user.businessId);
    return this.prisma.menuItem.create({
      data: { ...input, businessId: request.user.businessId }
    });
  }

  @Patch(":id")
  async update(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() body: unknown) {
    const input = parseBody(updateMenuItemSchema, body);
    await assertMenuItemOwner(this.prisma, id, request.user.businessId);
    if (input.categoryId) {
      await assertCategoryOwner(this.prisma, input.categoryId, request.user.businessId);
    }
    return this.prisma.menuItem.update({ where: { id }, data: input });
  }

  @Delete(":id")
  async remove(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    await assertMenuItemOwner(this.prisma, id, request.user.businessId);
    await this.prisma.menuItem.delete({ where: { id } });
    return { ok: true };
  }

  @Post(":id/image")
  @UseInterceptors(imageUploadInterceptor)
  async uploadImage(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    await assertMenuItemOwner(this.prisma, id, request.user.businessId);
    if (!file) {
      throw new BadRequestException("Resim dosyasi gerekli");
    }
    const imageUrl = `/uploads/${file.filename}`;
    return this.prisma.menuItem.update({ where: { id }, data: { imageUrl } });
  }
}

@Controller("tables")
@UseGuards(JwtAuthGuard)
export class TablesController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.prisma.table.findMany({
      where: { businessId: request.user.businessId },
      orderBy: { createdAt: "asc" }
    });
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const input = parseBody(createTableSchema, body);
    return this.prisma.table.create({
      data: {
        businessId: request.user.businessId,
        label: input.label,
        qrToken: createToken(12)
      }
    });
  }

  @Delete(":id")
  async remove(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    await assertTableOwner(this.prisma, id, request.user.businessId);
    await this.prisma.table.delete({ where: { id } });
    return { ok: true };
  }

  @Get(":id/qr")
  async qr(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Res() response: Response) {
    const table = await assertTableOwner(this.prisma, id, request.user.businessId);
    const buffer = await qrcode.toBuffer(`${publicMenuBaseUrl()}/t/${table.qrToken}`, {
      width: 512,
      margin: 2
    });
    response.setHeader("Content-Type", "image/png");
    response.send(buffer);
  }
}

@Controller("public")
export class PublicController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get("menu/:slug")
  async menu(@Param("slug") slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      include: {
        categories: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            menuItems: {
              where: { isAvailable: true },
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
            }
          }
        }
      }
    });
    if (!business) {
      throw new NotFoundException("Menu bulunamadi");
    }
    return publicMenuResponse(business);
  }

  @Get("table/:qrToken")
  async table(@Param("qrToken") qrToken: string) {
    const table = await this.prisma.table.findUnique({
      where: { qrToken },
      include: {
        business: {
          include: {
            categories: {
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              include: {
                menuItems: {
                  where: { isAvailable: true },
                  orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
                }
              }
            }
          }
        }
      }
    });
    if (!table) {
      throw new NotFoundException("Masa bulunamadi");
    }
    return publicMenuResponse(table.business, {
      id: table.id,
      label: table.label,
      qrToken: table.qrToken
    });
  }
}

@Controller("orders")
export class OrdersController {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(OrdersGateway)
    private readonly gateway: OrdersGateway,
    @Inject(PaymentsService)
    private readonly payments: PaymentsService
  ) {}

  @Post()
  async create(@Body() body: unknown) {
    const input = parseBody(createOrderSchema, body);
    if (input.type === "DINE_IN" && !input.tableId) {
      throw new BadRequestException("Masada siparis icin masa gerekli");
    }
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        businessId: input.businessId,
        id: { in: input.items.map((item) => item.menuItemId) },
        isAvailable: true
      }
    });
    if (menuItems.length !== new Set(input.items.map((item) => item.menuItemId)).size) {
      throw new BadRequestException("Urunlerden biri bulunamadi veya stokta yok");
    }
    if (input.tableId) {
      const table = await this.prisma.table.findFirst({
        where: { id: input.tableId, businessId: input.businessId }
      });
      if (!table) {
        throw new BadRequestException("Masa bu isletmeye ait degil");
      }
    }
    const itemById = new Map(menuItems.map((item) => [item.id, item]));
    const lines = input.items.map((item) => {
      const menuItem = itemById.get(item.menuItemId);
      if (!menuItem) {
        throw new BadRequestException("Urun bulunamadi");
      }
      return { priceKurus: menuItem.priceKurus, quantity: item.quantity };
    });
    const order = await this.prisma.order.create({
      data: {
        businessId: input.businessId,
        tableId: input.type === "DINE_IN" ? input.tableId : null,
        type: input.type,
        totalKurus: calculateOrderTotal(lines),
        note: input.note ?? null,
        items: {
          create: input.items.map((item) => {
            const menuItem = itemById.get(item.menuItemId);
            if (!menuItem) {
              throw new BadRequestException("Urun bulunamadi");
            }
            return {
              menuItemId: item.menuItemId,
              nameSnapshot: menuItem.name,
              priceKurusSnapshot: menuItem.priceKurus,
              quantity: item.quantity,
              note: item.note ?? null
            };
          })
        }
      },
      include: { items: true, payments: true, table: true }
    });
    this.gateway.emitOrderCreated(order);
    return order;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Req() request: AuthenticatedRequest, @Query("status") status?: string) {
    return this.prisma.order.findMany({
      where: {
        businessId: request.user.businessId,
        ...(status ? { status: status as never } : {})
      },
      include: { items: true, payments: true, table: true },
      orderBy: { createdAt: "desc" }
    });
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true, table: true, business: true }
    });
    if (!order) {
      throw new NotFoundException("Siparis bulunamadi");
    }
    return order;
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard)
  async status(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() body: unknown) {
    const input = parseBody(updateOrderStatusSchema, body);
    const order = await this.prisma.order.findFirst({
      where: { id, businessId: request.user.businessId }
    });
    if (!order) {
      throw new NotFoundException("Siparis bulunamadi");
    }
    if (!canTransitionOrderStatus(order.status, input.status)) {
      throw new BadRequestException("Gecersiz siparis durumu gecisi");
    }
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: input.status },
      include: { items: true, payments: true, table: true }
    });
    this.gateway.emitOrderUpdated(updated);
    return updated;
  }

  @Post(":id/pay")
  async pay(@Param("id") id: string, @Body() body: unknown) {
    const input = parseBody(payOrderSchema, body);
    const order = await this.payments.payOrder(id, input);
    if (order) {
      this.gateway.emitOrderUpdated(order);
    }
    return order;
  }
}

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get("summary")
  async summary(@Req() request: AuthenticatedRequest) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - 6);

    const [todayOrders, weekOrders, items] = await Promise.all([
      this.prisma.order.findMany({
        where: { businessId: request.user.businessId, createdAt: { gte: startOfToday } }
      }),
      this.prisma.order.findMany({
        where: { businessId: request.user.businessId, createdAt: { gte: startOfWeek } }
      }),
      this.prisma.orderItem.findMany({
        where: { order: { businessId: request.user.businessId, createdAt: { gte: startOfWeek } } }
      })
    ]);

    const byItem = new Map<string, number>();
    for (const item of items) {
      byItem.set(item.nameSnapshot, (byItem.get(item.nameSnapshot) ?? 0) + item.quantity);
    }
    return {
      todayOrderCount: todayOrders.length,
      todayRevenueKurus: todayOrders.reduce((sum, order) => sum + order.totalKurus, 0),
      weekOrderCount: weekOrders.length,
      weekRevenueKurus: weekOrders.reduce((sum, order) => sum + order.totalKurus, 0),
      topItems: Array.from(byItem.entries())
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
    };
  }
}

function publicUser(user: { id: string; email: string; role: string; businessId: string }) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    businessId: user.businessId
  };
}

function publicMenuResponse(
  business: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    address: string | null;
    phone: string | null;
    categories: {
      id: string;
      name: string;
      sortOrder: number;
      menuItems: {
        id: string;
        categoryId: string;
        name: string;
        description: string | null;
        priceKurus: number;
        imageUrl: string | null;
        videoUrl: string | null;
        sortOrder: number;
      }[];
    }[];
  },
  table?: { id: string; label: string; qrToken: string }
) {
  return {
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      logoUrl: business.logoUrl,
      address: business.address,
      phone: business.phone
    },
    table,
    categories: business.categories.map((category) => ({
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
      items: category.menuItems.map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        priceKurus: item.priceKurus,
        imageUrl: item.imageUrl,
        videoUrl: item.videoUrl,
        sortOrder: item.sortOrder
      }))
    }))
  };
}

async function assertCategoryOwner(prisma: PrismaService, id: string, businessId: string) {
  const category = await prisma.category.findFirst({ where: { id, businessId } });
  if (!category) {
    throw new ForbiddenException("Kategori bu isletmeye ait degil");
  }
  return category;
}

async function assertMenuItemOwner(prisma: PrismaService, id: string, businessId: string) {
  const item = await prisma.menuItem.findFirst({ where: { id, businessId } });
  if (!item) {
    throw new ForbiddenException("Urun bu isletmeye ait degil");
  }
  return item;
}

async function assertTableOwner(prisma: PrismaService, id: string, businessId: string) {
  const table = await prisma.table.findFirst({ where: { id, businessId } });
  if (!table) {
    throw new ForbiddenException("Masa bu isletmeye ait degil");
  }
  return table;
}
