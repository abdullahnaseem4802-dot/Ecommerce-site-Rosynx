import { Heart, Truck } from "lucide-react";
import { Fragment } from "react";

const rightItems = [
  { label: "Handmade with", icon: true },
  { label: "Sustainable", icon: false },
  { label: "Secure Payments", icon: false },
];

export function TopBar() {
  return (
    <div className="bg-espresso text-cream/90">
      <div className="mx-auto flex h-9 max-w-[1400px] items-center justify-between gap-4 px-4 text-[12px] sm:px-6 lg:px-10">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-cream/70" />
          <span className="hidden sm:inline">
            Free Shipping on all orders over $100
          </span>
          <span className="sm:hidden">Free Shipping over $100</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {rightItems.map((item, i) => (
            <Fragment key={item.label}>
              {i > 0 && <span className="text-cream/30">|</span>}
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                {item.label}
                {item.icon && (
                  <Heart className="h-3.5 w-3.5 fill-sale text-sale" />
                )}
              </span>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
