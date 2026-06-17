import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

const demoItems = [
  {
    category: "Kahveler",
    name: "Latte",
    description: "Yumusak icimli espresso ve sut.",
    priceKurus: 9500,
    imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=900&auto=format&fit=crop",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  },
  {
    category: "Kahveler",
    name: "Americano",
    description: "Cift shot espresso, sicak su.",
    priceKurus: 7800,
    imageUrl: "https://images.unsplash.com/photo-1497636577773-f1231844b336?w=900&auto=format&fit=crop"
  },
  {
    category: "Kahveler",
    name: "Filtre Kahve",
    description: "Gunluk cekirdek, sade servis.",
    priceKurus: 7200,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=900&auto=format&fit=crop"
  },
  {
    category: "Tatli",
    name: "San Sebastian",
    description: "Kremamsi cheesecake, cikolata sos ile.",
    priceKurus: 16500,
    imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=900&auto=format&fit=crop"
  },
  {
    category: "Tatli",
    name: "Brownie",
    description: "Sicak servis, yogun cikolatali.",
    priceKurus: 13500,
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=900&auto=format&fit=crop"
  },
  {
    category: "Tatli",
    name: "Tiramisu",
    description: "Espresso aromali klasik tatli.",
    priceKurus: 14500,
    imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=900&auto=format&fit=crop"
  },
  {
    category: "Atistirmalik",
    name: "Avokadolu Tost",
    description: "Eksili mayali ekmek, avokado, yumurta.",
    priceKurus: 18500,
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=900&auto=format&fit=crop"
  },
  {
    category: "Atistirmalik",
    name: "Mozzarella Panini",
    description: "Feslegen pesto ve mozzarella.",
    priceKurus: 17200,
    imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&auto=format&fit=crop"
  },
  {
    category: "Atistirmalik",
    name: "Granola Kasesi",
    description: "Yogurt, mevsim meyvesi ve granola.",
    priceKurus: 12800,
    imageUrl: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=900&auto=format&fit=crop"
  },
  {
    category: "Atistirmalik",
    name: "Patates Kizartmasi",
    description: "Baharatli, iki sos secenegiyle.",
    priceKurus: 9900,
    imageUrl: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=900&auto=format&fit=crop"
  }
];

function token() {
  return randomBytes(12).toString("hex");
}

async function main() {
  const existing = await prisma.business.findUnique({ where: { slug: "test-kafe" } });
  if (existing) {
    await prisma.payment.deleteMany({ where: { order: { businessId: existing.id } } });
    await prisma.orderItem.deleteMany({ where: { order: { businessId: existing.id } } });
    await prisma.order.deleteMany({ where: { businessId: existing.id } });
    await prisma.menuItem.deleteMany({ where: { businessId: existing.id } });
    await prisma.category.deleteMany({ where: { businessId: existing.id } });
    await prisma.table.deleteMany({ where: { businessId: existing.id } });
    await prisma.user.deleteMany({ where: { businessId: existing.id } });
    await prisma.business.delete({ where: { id: existing.id } });
  }

  const business = await prisma.business.create({
    data: {
      name: "Test Kafe",
      slug: "test-kafe",
      logoUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=300&auto=format&fit=crop",
      address: "Kadikoy, Istanbul",
      phone: "+90 555 000 00 00",
      users: {
        create: {
          email: "owner@testkafe.local",
          passwordHash: await bcrypt.hash("Test12345!", 12),
          role: Role.OWNER
        }
      }
    }
  });

  const categoryByName = new Map<string, string>();
  for (const [index, name] of ["Kahveler", "Tatli", "Atistirmalik"].entries()) {
    const category = await prisma.category.create({
      data: { businessId: business.id, name, sortOrder: index }
    });
    categoryByName.set(name, category.id);
  }

  for (const [index, item] of demoItems.entries()) {
    const categoryId = categoryByName.get(item.category);
    if (!categoryId) {
      throw new Error(`Missing category ${item.category}`);
    }
    await prisma.menuItem.create({
      data: {
        businessId: business.id,
        categoryId,
        name: item.name,
        description: item.description,
        priceKurus: item.priceKurus,
        imageUrl: item.imageUrl,
        videoUrl: "videoUrl" in item ? item.videoUrl : null,
        isAvailable: true,
        sortOrder: index
      }
    });
  }

  for (let index = 1; index <= 5; index += 1) {
    await prisma.table.create({
      data: {
        businessId: business.id,
        label: `Masa ${index}`,
        qrToken: token()
      }
    });
  }

  console.log("Seed tamamlandi: owner@testkafe.local / Test12345!");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
