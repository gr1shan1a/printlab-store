import { PrismaClient } from "@prisma/client";
import {hashPassword} from "../src/lib/password";
const db = new PrismaClient();
type Item = {
  name: string;
  slug: string;
  sku: string;
  category: string;
  price: number;
  material: string;
  color: string;
  stock: number;
  image: string;
  source: string;
  description?: string;
  variants?: { suffix: string; color: string; stock: number }[];
};
const products: Item[] = [
  {
    name: "Док-органайзер GRID",
    slug: "modular-desk-organizer",
    sku: "P3D-101",
    category: "Рабочее место",
    price: 149000,
    material: "PETG",
    color: "Чёрный / оранжевый",
    stock: 12,
    image: "/products/modular-desk-organizer.png",
    source: "https://www.printables.com/tag/deskorganizer",
  },
  {
    name: "Подставка для геймпада ARC",
    slug: "controller-stand",
    sku: "P3D-102",
    category: "Хобби",
    price: 99000,
    material: "PLA",
    color: "Чёрный",
    stock: 10,
    image: "/products/controller-stand.png",
    source: "https://www.printables.com/tag/controllerstand",
  },
  {
    name: "Кабельная станция CLIP · 5 мест",
    slug: "cable-dock",
    sku: "P3D-103",
    category: "Рабочее место",
    price: 69000,
    material: "PETG",
    color: "Чёрный / оранжевый",
    stock: 18,
    image: "/products/cable-dock.png",
    source: "https://www.thingiverse.com/thing:3247572",
  },
  {
    name: "Настенный ключник POCKET",
    slug: "wall-key-tray",
    sku: "P3D-104",
    category: "Дом",
    price: 119000,
    material: "PETG",
    color: "Оранжевый",
    stock: 8,
    image: "/products/wall-key-tray.png",
    source: "https://www.printables.com/tag/keyholder",
  },
  {
    name: "Держатель для наушников LOOP",
    slug: "headphone-holder",
    sku: "P3D-105",
    category: "Рабочее место",
    price: 89000,
    material: "PLA",
    color: "Чёрный",
    stock: 9,
    image: "/products/headphone-holder.png",
    source: "https://www.thingiverse.com/thing:1657541",
  },
  {
    name: "Корпус Raspberry Pi 5 AIR",
    slug: "raspberry-pi-case",
    sku: "P3D-106",
    category: "Электроника",
    price: 129000,
    material: "PETG",
    color: "Чёрный / оранжевый",
    stock: 5,
    image: "/products/raspberry-pi-case.png",
    source: "https://www.thingiverse.com/thing:6724792/files",
    variants: [
      { suffix: "BK", color: "Чёрный", stock: 5 },
      { suffix: "OR", color: "Оранжевый", stock: 5 },
    ],
  },
  {
    name: "Настольное кашпо WAVE",
    slug: "wave-planter",
    sku: "P3D-107",
    category: "Дом",
    price: 79000,
    material: "PLA",
    color: "Оранжевый",
    stock: 7,
    image: "/products/wave-planter.png",
    source: "https://www.printables.com/tag/planter",
  },
  {
    name: "Подставка для ноутбука LIFT · пара",
    slug: "laptop-lift",
    sku: "P3D-108",
    category: "Рабочее место",
    price: 89000,
    material: "PETG",
    color: "Чёрный",
    stock: 11,
    image: "/products/laptop-lift.png",
    source: "https://www.thingiverse.com/thing:1330829",
  },
  {
    name: "Автодержатель MagSafe SNAP",
    slug: "magsafe-car-holder",
    sku: "P3D-109",
    category: "Авто",
    price: 99000,
    material: "PETG",
    color: "Чёрный / оранжевый",
    stock: 8,
    image: "/products/magsafe-car-holder.png",
    source: "https://www.thingiverse.com/thing:5346482",
  },
  {
    name: "Крепления для кабеля DOT · 6 шт.",
    slug: "cable-clips",
    sku: "P3D-110",
    category: "Рабочее место",
    price: 49000,
    material: "PETG",
    color: "Чёрный / оранжевый",
    stock: 20,
    image: "/products/cable-clips.png",
    source: "https://www.thingiverse.com/thing:3247572",
  },
  {
    name: "Органайзер для инструментов BENCH",
    slug: "tool-organizer",
    sku: "P3D-111",
    category: "Мастерская",
    price: 139000,
    material: "PETG",
    color: "Чёрный / оранжевый",
    stock: 7,
    image: "/products/tool-organizer.png",
    source: "https://www.thingiverse.com/thing:6436085",
  },
  {
    name: "Настольный держатель телефона ARC",
    slug: "desktop-phone-stand",
    sku: "P3D-112",
    category: "Рабочее место",
    price: 69000,
    material: "PLA",
    color: "Чёрный",
    stock: 14,
    image: "/products/desktop-phone-stand.png",
    source: "https://www.thingiverse.com/thing:7084155",
  },
  {
    name: "Корпус Raspberry Pi 5 SLIDE",
    slug: "raspberry-pi-slide",
    sku: "P3D-113",
    category: "Электроника",
    price: 139000,
    material: "PETG",
    color: "Чёрный / оранжевый",
    stock: 4,
    image: "/products/raspberry-pi-slide.png",
    source: "https://www.thingiverse.com/thing:6971147",
    variants: [
      { suffix: "BK", color: "Чёрный", stock: 4 },
      { suffix: "OR", color: "Оранжевый", stock: 4 },
    ],
  },
  {
    name: "Настенный корпус Raspberry Pi 5 WALL",
    slug: "raspberry-pi-wall",
    sku: "P3D-114",
    category: "Электроника",
    price: 149000,
    material: "PETG",
    color: "Чёрный / оранжевый",
    stock: 4,
    image: "/products/raspberry-pi-wall.png",
    source: "https://www.thingiverse.com/thing:6616494",
    variants: [
      { suffix: "BK", color: "Чёрный", stock: 4 },
      { suffix: "OR", color: "Оранжевый", stock: 4 },
    ],
  },
];
async function main() {
  const cats = [...new Set(products.map((p) => p.category))];
  for (let i = 0; i < cats.length; i++)
    await db.category.upsert({
      where: { slug: slug(cats[i]) },
      update: { name: cats[i], sortOrder: i },
      create: { name: cats[i], slug: slug(cats[i]), sortOrder: i },
    });
  for (const item of products) {
    const category = await db.category.findUniqueOrThrow({
      where: { slug: slug(item.category) },
    });
    const product = await db.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        sku: item.sku,
        shortDescription:
          "Полезная вещь с простой геометрией и аккуратной послойной фактурой.",
        description:
          item.description ||
          "Практичный проект без сложных поддержек. Печатаем, проверяем посадку и упаковываем перед отправкой. Размер и цвет можно согласовать.",
        priceInKopecks: item.price,
        material: item.material,
        color: item.color,
        featured: true,
        active: true,
        archivedAt: null,
        categoryId: category.id,
        modelSourceUrl: item.source,
        images: { deleteMany: {}, create: { url: item.image, alt: item.name } },
      },
      create: {
        name: item.name,
        slug: item.slug,
        sku: item.sku,
        shortDescription:
          "Полезная вещь с простой геометрией и аккуратной послойной фактурой.",
        description:
          "Практичный проект без сложных поддержек. Печатаем, проверяем посадку и упаковываем перед отправкой. Размер и цвет можно согласовать.",
        priceInKopecks: item.price,
        material: item.material,
        color: item.color,
        featured: true,
        categoryId: category.id,
        modelSourceUrl: item.source,
        images: { create: { url: item.image, alt: item.name } },
      },
    });
    const variants = item.variants || [
      { suffix: "01", color: item.color, stock: item.stock },
    ];
    for (const v of variants)
      await db.productVariant.upsert({
        where: { sku: `${item.sku}-${v.suffix}` },
        update: {
          productId: product.id,
          material: item.material,
          color: v.color,
          priceInKopecks: item.price,
          stock: v.stock,
        },
        create: {
          productId: product.id,
          sku: `${item.sku}-${v.suffix}`,
          material: item.material,
          color: v.color,
          priceInKopecks: item.price,
          stock: v.stock,
        },
      });
  }
  await configureRaspberry();
  await db.storeSettings.upsert({
    where: { id: "main" },
    update: {},
    create: {
      heroTitle: "Форма, которая решает задачу",
      heroSubtitle:
        "Полезные вещи и детали, напечатанные точно под вашу повседневную жизнь.",
      phone: process.env.STORE_PHONE || "+7 999 000-00-00",
      email: process.env.STORE_EMAIL || "hello@example.ru",
      telegram: process.env.STORE_TELEGRAM || "https://t.me/your_name",
    },
  });
  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    const passwordHash = await hashPassword(process.env.SEED_ADMIN_PASSWORD);
    await db.user.upsert({
      where: { email: process.env.SEED_ADMIN_EMAIL.toLowerCase() },
      update: { role: "ADMIN", passwordHash, blockedAt: null, emailVerifiedAt: new Date() },
      create: {
        email: process.env.SEED_ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        role: "ADMIN",
        name: "Администратор",
        emailVerifiedAt: new Date(),
      },
    });
  }
}
async function configureRaspberry() {
  const product = await db.product.update({
    where: { slug: "raspberry-pi-case" },
    data: {
      name: "Корпус Raspberry Pi 5",
      sku: "P3D-RPI5",
      shortDescription: "Один корпус — три конструкции и девять готовых сочетаний.",
      description: "Выберите конструкцию под задачу: AIR с усиленной вентиляцией, SLIDE с крышкой-слайдером или WALL для настенного монтажа. Затем выберите цвет — цена, изображение и остаток пересчитаются автоматически.",
      priceInKopecks: 129000,
      color: "Графит / оранжевый / песочный",
      dimensions: "95 × 68 × 34–42 мм",
      images: {
        deleteMany: {},
        create: [
          { url: "/products/raspberry-pi-5-air-graphite.png", alt: "Raspberry Pi 5 AIR, графит", position: 0 },
          { url: "/products/raspberry-pi-5-air-orange.png", alt: "Raspberry Pi 5 AIR, оранжевый", position: 1 },
          { url: "/products/raspberry-pi-5-air-sand.png", alt: "Raspberry Pi 5 AIR, песочный", position: 2 },
          { url: "/products/raspberry-pi-5-slide-graphite.png", alt: "Raspberry Pi 5 SLIDE, графит", position: 3 },
          { url: "/products/raspberry-pi-5-slide-orange.png", alt: "Raspberry Pi 5 SLIDE, оранжевый", position: 4 },
          { url: "/products/raspberry-pi-5-slide-sand.png", alt: "Raspberry Pi 5 SLIDE, песочный", position: 5 },
          { url: "/products/raspberry-pi-5-wall-graphite.png", alt: "Raspberry Pi 5 WALL, графит", position: 6 },
          { url: "/products/raspberry-pi-5-wall-orange.png", alt: "Raspberry Pi 5 WALL, оранжевый", position: 7 },
          { url: "/products/raspberry-pi-5-wall-sand.png", alt: "Raspberry Pi 5 WALL, песочный", position: 8 },
        ],
      },
    },
  });
  const types = [
    { code: "AIR", label: "AIR · вентиляция", base: 129000 },
    { code: "SLIDE", label: "SLIDE · крышка-слайдер", base: 139000 },
    { code: "WALL", label: "WALL · настенный", base: 149000 },
  ];
  const colors = [
    { code: "GR", label: "Графит", extra: 0, file: "graphite" },
    { code: "OR", label: "Оранжевый", extra: 10000, file: "orange" },
    { code: "SA", label: "Песочный", extra: 15000, file: "sand" },
  ];
  await db.productVariant.updateMany({ where: { productId: product.id }, data: { stock: 0 } });
  for (const type of types) for (const color of colors) {
    const sku = `P3D-RPI5-${type.code}-${color.code}`;
    await db.productVariant.upsert({
      where: { sku },
      update: { productId: product.id, size: type.label, color: color.label, material: "PETG", priceInKopecks: type.base + color.extra, stock: 4, imageUrl: `/products/raspberry-pi-5-${type.code.toLowerCase()}-${color.file}.png` },
      create: { productId: product.id, sku, size: type.label, color: color.label, material: "PETG", priceInKopecks: type.base + color.extra, stock: 4, imageUrl: `/products/raspberry-pi-5-${type.code.toLowerCase()}-${color.file}.png` },
    });
  }
  await db.product.updateMany({ where: { slug: { in: ["raspberry-pi-slide", "raspberry-pi-wall"] } }, data: { active: false, archivedAt: new Date() } });
}
function slug(v: string) {
  return v
    .toLowerCase()
    .replace(/ё/g, "e")
    .replace(
      /[а-я]/g,
      (c) =>
        ({
          а: "a",
          б: "b",
          в: "v",
          г: "g",
          д: "d",
          е: "e",
          ж: "zh",
          з: "z",
          и: "i",
          й: "y",
          к: "k",
          л: "l",
          м: "m",
          н: "n",
          о: "o",
          п: "p",
          р: "r",
          с: "s",
          т: "t",
          у: "u",
          ф: "f",
          х: "h",
          ц: "c",
          ч: "ch",
          ш: "sh",
          щ: "sch",
          ъ: "",
          ы: "y",
          ь: "",
          э: "e",
          ю: "yu",
          я: "ya",
        })[c] || c,
    )
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
main().finally(() => db.$disconnect());
