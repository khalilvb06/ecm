import { Link } from "react-router-dom";
import { memo } from "react";
import LazyImage from "@/components/LazyImage";

type SupabaseCategory = {
  id: number | string;
  name: string;
  image_url: string;
  productCount?: number;
};

interface CategoryCardProps {
  category: SupabaseCategory;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  return (
    <div className="product-card group text-center">
      <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden">
        <LazyImage
          src={(category as any).image ?? (category as any).image_url}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          skeletonClassName="w-full h-full"
        />
      </div>
      
      <div className="space-y-3">
        <h3 className="font-semibold text-xl text-foreground">
          {category.name}
        </h3>
        
        {typeof category.productCount !== "undefined" && (
          <p className="text-muted-foreground">
            {category.productCount} منتج
          </p>
        )}
        
        <Link
          to={`/category/${category.id}`}
          className="primary-button w-full text-center block"
        >
          تصفح
        </Link>
      </div>
    </div>
  );
};

export default memo(CategoryCard);