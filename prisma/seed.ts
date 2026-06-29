import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    name: "Mechanical Keyboard",
    description:
      "Tactile switches, aluminum frame, and USB-C — built for long coding sessions.",
    price: 129.99,
    stock: 24,
    imageUrl:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=400&fit=crop",
  },
  {
    name: "Noise-Cancelling Headphones",
    description:
      "Over-ear wireless headphones with active noise cancellation and 30-hour battery.",
    price: 249.0,
    stock: 18,
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop",
  },
  {
    name: "4K Webcam",
    description:
      "Crystal-clear video for remote work and streaming, with auto light correction.",
    price: 89.5,
    stock: 32,
    imageUrl:
      "https://images.unsplash.com/photo-1587826080692-f439cd0b70eb?w=600&h=400&fit=crop",
  },
  {
    name: "USB-C Dock",
    description:
      "12-in-1 hub with dual HDMI, ethernet, SD card reader, and 100W pass-through charging.",
    price: 74.99,
    stock: 40,
    imageUrl:
      "https://images.unsplash.com/photo-1625948515291-69613efd103c?w=600&h=400&fit=crop",
  },
  {
    name: "Standing Desk Mat",
    description:
      "Ergonomic anti-fatigue mat with beveled edges — pairs well with any standing desk.",
    price: 39.0,
    stock: 55,
    imageUrl:
      "https://images.unsplash.com/photo-1616628188859-7a11abb6fcc9?w=600&h=400&fit=crop",
  },
  {
    name: "Portable Monitor",
    description:
      "15.6-inch IPS display, lightweight frame, and single-cable USB-C connectivity.",
    price: 199.99,
    stock: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=400&fit=crop",
  },
];

async function main() {
  const existing = await prisma.product.count();
  if (existing > 0) {
    console.log(`Skipping seed — ${existing} products already in database`);
    return;
  }

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log(`Seeded ${products.length} products`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
