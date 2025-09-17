import { Link } from "react-router-dom";
import { memo } from "react";
import { Star } from "lucide-react";
import { extractImages } from "@/lib/jsonb";
import LazyImage from "@/components/LazyImage";

type SupabaseProduct = {
  id: number | string;
  name: string;
  price: number;
  image?: string | string[] | any; // legacy string or jsonb array
  image_url?: string;
  images?: string[];
  image_urls?: string[];
  image_json?: any;
};

interface ProductCardProps {
  product: SupabaseProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link to={`/product/${product.id}`} className="product-card group no-underline block">
      <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden flex items-center justify-center">
        <LazyImage
          src={getPrimaryImage(product)}
          alt={product.name}
          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          skeletonClassName="w-full h-full"
        />
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg text-foreground line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">
            {Number(product.price).toLocaleString()} دج
          </span>
        </div>

        <div className="flex items-center gap-1 text-amber-400" aria-label="تقييم المنتج 4.5 من 5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-current" />
          ))}
          <Star className="w-4 h-4 fill-current [clip-path:polygon(0_0,50%_0,50%_100%,0_100%)]" />
          <span className="text-xs text-muted-foreground ms-1">4.5</span>
        </div>

        <span className="primary-button w-full text-center block">اطلب الآن</span>
      </div>
    </Link>
  );
};

export default memo(ProductCard);

function getPrimaryImage(product: any): string {
  const images = extractImages(product?.image);
  if (images.length > 0) return images[0];
  if (typeof product?.image_url === "string") return product.image_url;
  return "/placeholder.svg";
}