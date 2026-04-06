import product1 from "../../assets/products/p1.png";
import product2 from "../../assets/products/p2.png";
import product3 from "../../assets/products/p3.png";
import product4 from "../../assets/products/p4.png";

const products = [
  {
    id: 1,
    name: "Skino Ultimate Glow Vitamin E Body Lotion 220ml",
    brand: "Skino",
    price: 299,
    oldPrice: 570,
    discount: "47% OFF",
    image: product1,
  },
  {
    id: 2,
    name: "Nature Beauty Glowing Body Lotion 200ml",
    brand: "Nature Beauty",
    price: 299,
    oldPrice: 630,
    discount: "52% OFF",
    image: product2,
  },
  {
    id: 3,
    name: "La Oliva Olive Oil 150ml",
    brand: "La Oliva",
    price: 489,
    oldPrice: 820,
    discount: "40% OFF",
    image: product3,
  },
  {
    id: 4,
    name: "Skino Keratin Shampoo 220ml",
    brand: "Skino",
    price: 469,
    oldPrice: 700,
    discount: "33% OFF",
    image: product4,
  },
];


export default function ProductSuggestions({ title }) {
  return (
    <section className="mt-10">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button className="text-sm text-teal-600 hover:underline">
          See All
        </button>
      </div>

      {/* Product cards */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-[220px] bg-white border rounded-xl p-3 hover:shadow-md transition"
          >
            {/* Discount */}
            <span className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded mb-2">
              {product.discount}
            </span>

            {/* Image */}
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-32 object-contain mb-3"
            />

            {/* Name */}
            <p className="text-sm font-medium leading-snug mb-1 line-clamp-2">
              {product.name}
            </p>

            {/* Brand */}
            <p className="text-xs text-gray-500 mb-2">
              {product.brand}
            </p>

            {/* Price */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600 font-semibold">
                ৳ {product.price}
              </span>
              <span className="text-xs line-through text-gray-400">
                ৳ {product.oldPrice}
              </span>
            </div>

            {/* Button */}
            <button className="w-full bg-sky-500 text-white text-sm py-2 rounded hover:bg-sky-600 transition">
              Add to cart
            </button>
          </div>
        ))}
      </div>

    </section>
  );
}
