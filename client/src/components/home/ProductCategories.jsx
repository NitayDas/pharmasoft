import exclusive from "../../assets/categories/exclusive.PNG";
import women from "../../assets/categories/women.PNG";
import wellness from "../../assets/categories/wellness.PNG";
import cream from "../../assets/categories/cream.PNG";
import personal from "../../assets/categories/personal.PNG";
import skin from "../../assets/categories/skin.PNG";

const categories = [
  { id: 1, name: "Exclusive Deals", image: exclusive },
  { id: 2, name: "Women's Choice", image: women },
  { id: 3, name: "Sexual Wellness", image: wellness },
  { id: 4, name: "Cream and Moisturizer", image: cream },
  { id: 5, name: "Personal Care", image: personal },
  { id: 6, name: "Skin Care", image: skin },
];

export default function ProductCategories() {
  return (
    <section className="mt-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Product Categories</h2>
        <button className="text-sm text-teal-600 hover:underline">
          See All
        </button>
      </div>

      {/* Cards */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="
              min-w-[160px]
              bg-white
              border
              rounded-xl
              p-4
              flex
              flex-col
              items-center
              justify-center
              cursor-pointer
              hover:shadow-md
              transition
            "
          >
            <img
              src={cat.image}
              alt={cat.name}
              className="w-16 h-16 object-contain mb-3"
            />
            <p className="text-sm font-medium text-center">
              {cat.name}
            </p>
          </div>
        ))}
      </div>

    </section>
  );
}
